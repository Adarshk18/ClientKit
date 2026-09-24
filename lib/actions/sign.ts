"use server";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { signInputSchema } from "@/lib/validators";
import { canClaimPayment, canSign } from "@/lib/document-state";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { rateLimit, SIGN_LIMIT, PAY_LIMIT } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { renderSignedPdf } from "@/lib/pdf";
import { sendSignedToFreelancer } from "@/lib/email";
import { logError } from "@/lib/logger";
import { first } from "@/lib/one";
import type { ActionResult, FrozenPayload, LineItemRow, WorkspaceRow } from "@/lib/types";

const PUBLIC_STATUSES = ["sent", "viewed", "signed", "payment_sent", "paid", "expired", "void"] as const;

export async function signDocumentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = signInputSchema.safeParse({
      public_id: formData.get("public_id"),
      signer_name: formData.get("signer_name"),
      signer_email: formData.get("signer_email"),
      agree: formData.get("agree") === "on" || formData.get("agree") === "true",
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid signature." };
    }

    const { ip, userAgent } = await requestMeta();
    const limited = await rateLimit({
      key: `sign:${parsed.data.public_id}:${ip}`,
      ...SIGN_LIMIT,
    });
    if (!limited.ok) {
      return { ok: false, error: "Too many attempts. Try again later." };
    }

    const admin = createSupabaseAdmin();
    const { data: doc } = await admin
      .from("documents")
      .select("*, clients(*), line_items(*), workspaces(*)")
      .eq("public_id", parsed.data.public_id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!doc || !PUBLIC_STATUSES.includes(doc.status)) {
      return { ok: false, error: "Document not found." };
    }

    const signable = canSign(doc.status, doc.expires_at);
    if (!signable.ok) {
      if (signable.reason.includes("already signed")) {
        return { ok: false, error: signable.reason, code: "already_signed" };
      }
      return { ok: false, error: signable.reason };
    }

    const client = first(doc.clients as { name: string; email: string } | { name: string; email: string }[]);
    const workspace = first(doc.workspaces as WorkspaceRow | WorkspaceRow[]);
    if (!client || !workspace) return { ok: false, error: "Document not found." };
    const items = ((doc.line_items as LineItemRow[]) ?? []).sort((a, b) => a.sort_order - b.sort_order);

    const payload = buildFrozenPayload({
      title: doc.title,
      scope_html: doc.scope_html,
      currency: doc.currency,
      line_items: items.map((item) => ({
        label: item.label,
        qty: Number(item.qty),
        unit_amount: item.unit_amount,
      })),
      subtotal: doc.subtotal,
      deposit_percent: doc.deposit_percent,
      deposit_amount: doc.deposit_amount,
      amount_due: doc.amount_due,
      remainder_amount: doc.remainder_amount,
      client_name: client.name,
      client_email: client.email,
      workspace_name: workspace.name,
    });
    const hash = hashFrozenPayload(payload);
    const submittedHash = String(formData.get("document_hash") ?? "");
    if (doc.frozen_hash && doc.frozen_hash !== hash) {
      return { ok: false, error: "This document changed. Refresh and try again." };
    }
    if (submittedHash && submittedHash !== hash) {
      return { ok: false, error: "This document changed. Refresh and try again." };
    }

    const signedAt = new Date().toISOString();

    // Claim the document first (status guard) so void/expire races cannot be overwritten after sign.
    const { data: claimed, error: claimError } = await admin
      .from("documents")
      .update({
        status: "signed",
        signed_at: signedAt,
        frozen_payload: payload,
        frozen_hash: hash,
      })
      .eq("id", doc.id)
      .in("status", ["sent", "viewed"])
      .select("id")
      .maybeSingle();

    if (claimError) {
      logError("sign.claim", claimError);
      return { ok: false, error: "Could not save the signature." };
    }
    if (!claimed) {
      return { ok: false, error: "This document is no longer available to sign." };
    }

    const { error: signError } = await admin.from("signatures").insert({
      document_id: doc.id,
      signer_name: parsed.data.signer_name,
      signer_email: parsed.data.signer_email,
      signed_at: signedAt,
      ip,
      user_agent: userAgent,
      document_hash: hash,
    });

    if (signError) {
      if (signError.code === "23505") {
        return { ok: false, error: "This document is already signed.", code: "already_signed" };
      }
      logError("sign.insert", signError);
      // Roll back the claim so the doc is not left signed without a signature row.
      await admin
        .from("documents")
        .update({
          status: doc.status,
          signed_at: null,
          frozen_payload: doc.frozen_payload,
          frozen_hash: doc.frozen_hash,
        })
        .eq("id", doc.id)
        .eq("status", "signed");
      return { ok: false, error: "Could not save the signature." };
    }

    await admin.from("events").insert({
      document_id: doc.id,
      type: "signed",
      ip,
      user_agent: userAgent,
      meta: { signer_name: parsed.data.signer_name },
    });

    try {
      const pdf = await renderSignedPdf({
        payload: payload as FrozenPayload,
        signerName: parsed.data.signer_name,
        signerEmail: parsed.data.signer_email,
        signedAt,
        hash,
      });
      const path = `${workspace.id}/${doc.id}.pdf`;
      const { error: uploadError } = await admin.storage.from("pdfs").upload(path, pdf, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!uploadError) {
        await admin.from("pdfs").upsert(
          { document_id: doc.id, storage_path: path, hash },
          { onConflict: "document_id" },
        );
      } else {
        logError("sign.pdf", uploadError);
      }
    } catch (error) {
      logError("sign.pdf", error);
    }

    const { data: owner } = await admin.auth.admin.getUserById(workspace.owner_id);
    if (owner.user?.email) {
      await sendSignedToFreelancer({
        to: owner.user.email,
        clientName: client.name,
        title: doc.title,
        amountDue: doc.amount_due,
        currency: doc.currency,
      });
    }

    return { ok: true, data: undefined };
  } catch (error) {
    logError("sign", error);
    return { ok: false, error: "Could not sign." };
  }
}

export async function markPaymentSentAction(
  publicId: string,
  claim?: { reference?: string; note?: string },
): Promise<ActionResult> {
  try {
    const { ip, userAgent } = await requestMeta();
    const limited = await rateLimit({
      key: `pay:${publicId}:${ip}`,
      ...PAY_LIMIT,
    });
    if (!limited.ok) {
      return { ok: false, error: "Too many attempts. Try again later." };
    }

    const reference = (claim?.reference ?? "").trim().slice(0, 120) || null;
    const note = (claim?.note ?? "").trim().slice(0, 500) || null;

    const admin = createSupabaseAdmin();
    const { data: doc } = await admin
      .from("documents")
      .select("id, status, expires_at, payment_status")
      .eq("public_id", publicId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!doc) return { ok: false, error: "Not found" };
    if (doc.status === "paid" || doc.payment_status === "paid") {
      return { ok: true, data: undefined };
    }
    if (doc.status === "payment_sent") {
      return { ok: true, data: undefined };
    }
    const payable = canClaimPayment(doc.status, doc.expires_at);
    if (!payable.ok) return { ok: false, error: payable.reason };

    const claimedAt = new Date().toISOString();
    const { data: updated, error: updateError } = await admin
      .from("documents")
      .update({
        status: "payment_sent",
        payment_status: "payment_sent",
        payment_claimed_at: claimedAt,
        payment_reference: reference,
        payment_claim_note: note,
      })
      .eq("id", doc.id)
      .eq("status", "signed")
      .neq("payment_status", "paid")
      .select("id")
      .maybeSingle();
    if (updateError) {
      logError("pay.sent.update", updateError);
      return { ok: false, error: "Could not record payment." };
    }
    if (!updated) return { ok: true, data: undefined };

    await admin.from("events").insert({
      document_id: doc.id,
      type: "payment_sent",
      ip,
      user_agent: userAgent,
      meta: { reference, note },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    logError("pay.sent", error);
    return { ok: false, error: "Could not record payment." };
  }
}
