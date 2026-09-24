"use server";

import { revalidatePath } from "next/cache";
import { requireWorkspace } from "@/lib/auth";
import { canSendDocument } from "@/lib/plans";
import { computeAmounts } from "@/lib/money";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { normalizeScopeHtml } from "@/lib/sanitize";
import { newPublicId } from "@/lib/public-id";
import { documentInputSchema } from "@/lib/validators";
import {
  canConfirmPayment,
  canRejectPaymentClaim,
  canSoftDelete,
  effectiveStatus,
} from "@/lib/document-state";
import { sendDocumentToClient } from "@/lib/email";
import { logError } from "@/lib/logger";
import { assertSameOrigin, requestMeta } from "@/lib/request";
import { assertWorkspaceOwns } from "@/lib/workspace";
import type { ActionResult, DocumentRow, LineItemRow } from "@/lib/types";

function parseDocumentForm(formData: FormData) {
  let lineItems: unknown = [];
  const raw = formData.get("line_items");
  if (typeof raw === "string" && raw.length > 0) {
    try {
      lineItems = JSON.parse(raw);
    } catch {
      lineItems = [];
    }
  }
  const expiresRaw = String(formData.get("expires_at") ?? "").trim();
  const expires_at = expiresRaw ? new Date(expiresRaw).toISOString() : null;
  return documentInputSchema.safeParse({
    client_name: formData.get("client_name"),
    client_email: formData.get("client_email"),
    title: formData.get("title"),
    scope_html: formData.get("scope_html") ?? "",
    currency: formData.get("currency"),
    deposit_percent: Number(formData.get("deposit_percent") ?? 100),
    expires_at,
    line_items: lineItems,
  });
}

async function upsertClient(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
  workspaceId: string,
  name: string,
  email: string,
) {
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("workspace_id", workspaceId)
    .ilike("email", email)
    .maybeSingle();
  if (existing) {
    await supabase.from("clients").update({ name }).eq("id", existing.id).eq("workspace_id", workspaceId);
    return existing.id as string;
  }
  const { data, error } = await supabase
    .from("clients")
    .insert({ workspace_id: workspaceId, name, email })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not save client");
  return data.id as string;
}

async function replaceLineItems(
  supabase: Awaited<ReturnType<typeof requireWorkspace>>["supabase"],
  documentId: string,
  items: { label: string; qty: number; unit_amount: number }[],
) {
  await supabase.from("line_items").delete().eq("document_id", documentId);
  if (items.length === 0) return;
  const { error } = await supabase.from("line_items").insert(
    items.map((item, index) => ({
      document_id: documentId,
      label: item.label,
      qty: item.qty,
      unit_amount: item.unit_amount,
      sort_order: index,
    })),
  );
  if (error) throw new Error("Could not save line items");
}

export async function saveDraftAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertSameOrigin();
    const { supabase, workspace } = await requireWorkspace();
    const parsed = parseDocumentForm(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid document." };
    }

    const input = parsed.data;
    const scope_html = normalizeScopeHtml(input.scope_html);
    const amounts = computeAmounts(input.line_items, input.deposit_percent);
    const clientId = await upsertClient(supabase, workspace.id, input.client_name, input.client_email);
    const existingId = String(formData.get("document_id") ?? "");

    if (existingId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", existingId)
        .eq("workspace_id", workspace.id)
        .maybeSingle();
      if (!doc) return { ok: false, error: "Not found" };
      assertWorkspaceOwns(doc.workspace_id, workspace.id);
      if (doc.status !== "draft") {
        return { ok: false, error: "Only drafts can be saved in place. Use “Save as new version”." };
      }
      const { error } = await supabase
        .from("documents")
        .update({
          client_id: clientId,
          title: input.title,
          scope_html,
          currency: input.currency,
          ...amounts,
          expires_at: input.expires_at ?? null,
        })
        .eq("id", existingId)
        .eq("workspace_id", workspace.id);
      if (error) return { ok: false, error: "Could not save draft." };
      await replaceLineItems(supabase, existingId, input.line_items);
      revalidatePath("/jobs");
      revalidatePath(`/jobs/${existingId}`);
      return { ok: true, data: { id: existingId } };
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        client_id: clientId,
        public_id: newPublicId(),
        title: input.title,
        scope_html,
        currency: input.currency,
        ...amounts,
        expires_at: input.expires_at ?? null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create draft." };
    await replaceLineItems(supabase, data.id, input.line_items);
    revalidatePath("/jobs");
    return { ok: true, data: { id: data.id } };
  } catch (error) {
    logError("documents.saveDraft", error);
    return { ok: false, error: "Could not save draft." };
  }
}

async function loadDocBundle(documentId: string, workspaceId: string) {
  const { supabase } = await requireWorkspace();
  const { data: doc } = await supabase
    .from("documents")
    .select("*, clients(*), line_items(*)")
    .eq("id", documentId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!doc) return null;
  assertWorkspaceOwns(doc.workspace_id, workspaceId);
  return doc as DocumentRow & {
    clients: { name: string; email: string };
    line_items: LineItemRow[];
  };
}

export async function sendDocumentAction(documentId: string): Promise<ActionResult<{ publicId: string }>> {
  try {
    await assertSameOrigin();
    const { supabase, user, workspace } = await requireWorkspace();
    const gate = canSendDocument(workspace);
    if (!gate.ok) return { ok: false, error: gate.reason, code: gate.code };

    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc || doc.deleted_at) return { ok: false, error: "Not found" };
    if (doc.status !== "draft") return { ok: false, error: "Only drafts can be sent." };
    if (!doc.line_items.length || doc.subtotal <= 0) {
      return { ok: false, error: "Add at least one line item with a price before sending." };
    }

    const payload = buildFrozenPayload({
      title: doc.title,
      scope_html: doc.scope_html,
      currency: doc.currency,
      line_items: doc.line_items
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item) => ({ label: item.label, qty: Number(item.qty), unit_amount: item.unit_amount })),
      subtotal: doc.subtotal,
      deposit_percent: doc.deposit_percent,
      deposit_amount: doc.deposit_amount,
      amount_due: doc.amount_due,
      remainder_amount: doc.remainder_amount,
      client_name: doc.clients.name,
      client_email: doc.clients.email,
      workspace_name: workspace.name,
    });
    const contentHash = hashFrozenPayload(payload);

    const { data: sentRows, error } = await supabase
      .from("documents")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        frozen_hash: contentHash,
      })
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .eq("status", "draft")
      .select("id");
    if (error || !sentRows?.length) return { ok: false, error: "Could not send." };

    // Optimistic lock on the send counter so concurrent sends cannot under-count the cap.
    let counterOk = false;
    for (let attempt = 0; attempt < 2 && !counterOk; attempt++) {
      const { data: fresh } = await supabase
        .from("workspaces")
        .select("docs_sent_this_period, period_reset_at")
        .eq("id", workspace.id)
        .maybeSingle();
      if (!fresh) break;
      const resetDue = new Date(fresh.period_reset_at).getTime() <= Date.now();
      const nextCount = resetDue ? 1 : fresh.docs_sent_this_period + 1;
      const nextReset = resetDue
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : fresh.period_reset_at;
      let q = supabase
        .from("workspaces")
        .update({
          docs_sent_this_period: nextCount,
          period_reset_at: nextReset,
        })
        .eq("id", workspace.id)
        .eq("owner_id", user.id);
      if (!resetDue) {
        q = q.eq("docs_sent_this_period", fresh.docs_sent_this_period);
      }
      const { data: bumped } = await q.select("id");
      counterOk = Boolean(bumped?.length);
    }
    if (!counterOk) {
      logError("documents.send.counter", new Error("send counter update failed after document send"));
    }

    await sendDocumentToClient({
      to: doc.clients.email,
      clientName: doc.clients.name,
      workspaceName: workspace.name,
      title: doc.title,
      publicId: doc.public_id,
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${documentId}`);
    return { ok: true, data: { publicId: doc.public_id } };
  } catch (error) {
    logError("documents.send", error);
    return { ok: false, error: "Could not send document." };
  }
}

export async function saveAsNewVersionAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const existingId = String(formData.get("document_id") ?? "");
    if (!existingId) return { ok: false, error: "Missing document." };

    const current = await loadDocBundle(existingId, workspace.id);
    if (!current) return { ok: false, error: "Not found" };
    if (current.status === "signed" || current.status === "payment_sent" || current.status === "paid") {
      return { ok: false, error: "Signed documents cannot be edited." };
    }
    if (current.status !== "sent" && current.status !== "viewed") {
      return { ok: false, error: "Only sent documents need a new version." };
    }

    const parsed = parseDocumentForm(formData);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid document." };
    }
    const input = parsed.data;
    const scope_html = normalizeScopeHtml(input.scope_html);
    const amounts = computeAmounts(input.line_items, input.deposit_percent);
    const clientId = await upsertClient(supabase, workspace.id, input.client_name, input.client_email);
    const { ip, userAgent } = await requestMeta();

    const { data: voided, error: voidError } = await supabase
      .from("documents")
      .update({ status: "void" })
      .eq("id", existingId)
      .eq("workspace_id", workspace.id)
      .in("status", ["sent", "viewed"])
      .select("id");
    if (voidError || !voided?.length) {
      return { ok: false, error: "Document changed — refresh and try again." };
    }

    await supabase.from("events").insert({
      document_id: existingId,
      type: "voided",
      ip,
      user_agent: userAgent,
      meta: { reason: "new_version", by: user.id },
    });

    const { data: created, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        client_id: clientId,
        public_id: newPublicId(),
        title: input.title,
        scope_html,
        currency: input.currency,
        ...amounts,
        expires_at: input.expires_at ?? null,
        status: "draft",
        version: current.version + 1,
        supersedes_id: existingId,
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Could not create the new version." };
    await replaceLineItems(supabase, created.id, input.line_items);
    revalidatePath("/jobs");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    logError("documents.newVersion", error);
    return { ok: false, error: "Could not create a new version." };
  }
}

export async function voidDocumentAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const { data: doc } = await supabase
      .from("documents")
      .select("id, status, workspace_id")
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (!doc) return { ok: false, error: "Not found" };
    if (doc.status === "signed" || doc.status === "payment_sent" || doc.status === "paid") {
      return { ok: false, error: "Signed documents cannot be voided. They are the record." };
    }
    const { ip, userAgent } = await requestMeta();
    const { data: voided, error: voidError } = await supabase
      .from("documents")
      .update({ status: "void" })
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .in("status", ["draft", "sent", "viewed", "expired"])
      .select("id");
    if (voidError || !voided?.length) {
      return { ok: false, error: "Could not void document." };
    }
    await supabase.from("events").insert({
      document_id: documentId,
      type: "voided",
      ip,
      user_agent: userAgent,
      meta: { by: user.id },
    });
    revalidatePath("/jobs");
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.void", error);
    return { ok: false, error: "Could not void document." };
  }
}

export async function deleteDraftAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace } = await requireWorkspace();
    const { data: doc } = await supabase
      .from("documents")
      .select("id, status, workspace_id")
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle();
    if (!doc) return { ok: false, error: "Not found" };
    if (!canSoftDelete(doc.status)) {
      return { ok: false, error: "Only drafts (and void/expired jobs) can be deleted. Signed jobs stay." };
    }
    await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", documentId)
      .eq("workspace_id", workspace.id);
    revalidatePath("/jobs");
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.delete", error);
    return { ok: false, error: "Could not delete." };
  }
}

export async function resendDocumentAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc) return { ok: false, error: "Not found" };
    const status = effectiveStatus(doc.status, doc.expires_at);
    if (!["sent", "viewed"].includes(status)) {
      return { ok: false, error: "Only outstanding sent documents can be resent." };
    }
    const { ip, userAgent } = await requestMeta();
    await sendDocumentToClient({
      to: doc.clients.email,
      clientName: doc.clients.name,
      workspaceName: workspace.name,
      title: doc.title,
      publicId: doc.public_id,
    });
    await supabase.from("events").insert({
      document_id: documentId,
      type: "resent",
      ip,
      user_agent: userAgent,
      meta: { by: user.id },
    });
    revalidatePath(`/jobs/${documentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.resend", error);
    return { ok: false, error: "Could not resend." };
  }
}

export async function markPaidAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc) return { ok: false, error: "Not found" };
    if (doc.status === "paid") return { ok: true, data: undefined };
    if (!canConfirmPayment(doc.status)) {
      return { ok: false, error: "Mark paid after the client signs." };
    }

    const { ip, userAgent } = await requestMeta();
    const now = new Date().toISOString();
    const { data: paidRows, error } = await supabase
      .from("documents")
      .update({
        status: "paid",
        payment_status: "paid",
        paid_at: now,
        payment_marked_by: user.id,
      })
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .in("status", ["signed", "payment_sent"])
      .select("id");
    if (error || !paidRows?.length) return { ok: false, error: "Could not mark paid." };

    await supabase.from("events").insert({
      document_id: documentId,
      type: "paid",
      ip,
      user_agent: userAgent,
      meta: { by: user.id, from_status: doc.status },
    });

    const { sendMarkedPaidToFreelancer } = await import("@/lib/email");
    if (user.email) {
      await sendMarkedPaidToFreelancer({
        to: user.email,
        clientName: doc.clients.name,
        title: doc.title,
        amount: doc.amount_due,
        currency: doc.currency,
      });
    }

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${documentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.markPaid", error);
    return { ok: false, error: "Could not mark paid." };
  }
}

/** Freelancer rejects a client payment claim → back to signed / awaiting payment. */
export async function rejectPaymentClaimAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc) return { ok: false, error: "Not found" };
    if (!canRejectPaymentClaim(doc.status)) {
      return { ok: false, error: "No payment claim to reject." };
    }

    const { ip, userAgent } = await requestMeta();
    const prior = {
      reference: doc.payment_reference ?? null,
      note: doc.payment_claim_note ?? null,
      claimed_at: doc.payment_claimed_at ?? null,
    };
    const { data: rows, error } = await supabase
      .from("documents")
      .update({
        status: "signed",
        payment_status: "unpaid",
        payment_claimed_at: null,
        payment_reference: null,
        payment_claim_note: null,
      })
      .eq("id", documentId)
      .eq("workspace_id", workspace.id)
      .eq("status", "payment_sent")
      .select("id");
    if (error || !rows?.length) return { ok: false, error: "Could not reject payment claim." };

    await supabase.from("events").insert({
      document_id: documentId,
      type: "payment_rejected",
      ip,
      user_agent: userAgent,
      meta: { by: user.id, prior_claim: prior },
    });

    revalidatePath("/jobs");
    revalidatePath(`/jobs/${documentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.rejectPaymentClaim", error);
    return { ok: false, error: "Could not reject payment claim." };
  }
}

export async function duplicateDocumentAction(documentId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await assertSameOrigin();
    const { supabase, workspace } = await requireWorkspace();
    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc || doc.deleted_at) return { ok: false, error: "Not found" };

    const { data: created, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        client_id: doc.client_id,
        public_id: newPublicId(),
        title: `${doc.title} (copy)`,
        scope_html: doc.scope_html,
        currency: doc.currency,
        subtotal: doc.subtotal,
        deposit_percent: doc.deposit_percent,
        deposit_amount: doc.deposit_amount,
        amount_due: doc.amount_due,
        remainder_amount: doc.remainder_amount,
        expires_at: null,
        status: "draft",
      })
      .select("id")
      .single();
    if (error || !created) return { ok: false, error: "Could not duplicate." };

    const items = doc.line_items
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({ label: item.label, qty: Number(item.qty), unit_amount: item.unit_amount }));
    await replaceLineItems(supabase, created.id, items);
    revalidatePath("/jobs");
    return { ok: true, data: { id: created.id } };
  } catch (error) {
    logError("documents.duplicate", error);
    return { ok: false, error: "Could not duplicate." };
  }
}

export async function nudgeClientAction(documentId: string): Promise<ActionResult> {
  try {
    await assertSameOrigin();
    const { supabase, workspace, user } = await requireWorkspace();
    const doc = await loadDocBundle(documentId, workspace.id);
    if (!doc) return { ok: false, error: "Not found" };
    const status = effectiveStatus(doc.status, doc.expires_at);
    if (status !== "sent" && status !== "viewed" && status !== "signed" && status !== "payment_sent") {
      return { ok: false, error: "Nothing to nudge. Send the job first, or it is already paid." };
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("document_id", documentId)
      .eq("type", "resent")
      .gte("created_at", hourAgo);
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Wait an hour between reminders." };
    }

    const { sendNudgeToClient } = await import("@/lib/email");
    await sendNudgeToClient({
      to: doc.clients.email,
      clientName: doc.clients.name,
      workspaceName: workspace.name,
      title: doc.title,
      publicId: doc.public_id,
      kind: status === "signed" || status === "payment_sent" ? "pay" : "sign",
    });

    const { ip, userAgent } = await requestMeta();
    await supabase.from("events").insert({
      document_id: documentId,
      type: "resent",
      ip,
      user_agent: userAgent,
      meta: { by: user.id, kind: "nudge" },
    });
    revalidatePath(`/jobs/${documentId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    logError("documents.nudge", error);
    return { ok: false, error: "Could not send the reminder." };
  }
}


