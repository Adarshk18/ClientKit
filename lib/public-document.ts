import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { effectiveStatus, publicReadable } from "@/lib/document-state";
import { rateLimit, VIEW_LIMIT } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request";
import { sendViewedToFreelancer } from "@/lib/email";
import { logError } from "@/lib/logger";
import { first } from "@/lib/one";
import type { LineItemRow, WorkspaceRow } from "@/lib/types";

export async function loadPublicDocument(publicId: string) {
  const admin = createSupabaseAdmin();
  const { data: doc } = await admin
    .from("documents")
    .select("*, clients(*), line_items(*), workspaces(*), signatures(*), pdfs(*)")
    .eq("public_id", publicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!doc) return null;
  if (!publicReadable(doc.status)) return null;

  const status = effectiveStatus(doc.status, doc.expires_at);
  if (status === "expired" && doc.status !== "expired") {
    await admin.from("documents").update({ status: "expired" }).eq("id", doc.id).in("status", ["sent", "viewed"]);
    doc.status = "expired";
  }

  const clients = first(doc.clients as { name: string; email: string } | { name: string; email: string }[]);
  const workspaces = first(doc.workspaces as WorkspaceRow | WorkspaceRow[]);
  if (!clients || !workspaces) return null;

  return {
    ...doc,
    clients,
    line_items: (doc.line_items ?? []) as LineItemRow[],
    workspaces,
    signatures: (Array.isArray(doc.signatures) ? doc.signatures : doc.signatures ? [doc.signatures] : []) as {
      signer_name: string;
      signed_at: string;
      document_hash: string;
    }[],
    pdfs: first(doc.pdfs as { storage_path: string; hash: string } | { storage_path: string; hash: string }[] | null),
  };
}

export async function recordPublicView(publicId: string): Promise<void> {
  try {
    const { ip, userAgent } = await requestMeta();
    const limited = await rateLimit({
      key: `view:${publicId}:${ip}`,
      ...VIEW_LIMIT,
    });
    if (!limited.ok) return;

    const admin = createSupabaseAdmin();
    const { data: doc } = await admin
      .from("documents")
      .select("id, status, title, workspace_id, viewed_at, workspaces(owner_id), clients(name)")
      .eq("public_id", publicId)
      .in("status", ["sent", "viewed"])
      .is("deleted_at", null)
      .maybeSingle();
    if (!doc) return;

    if (doc.status === "sent") {
      await admin
        .from("documents")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("id", doc.id)
        .eq("status", "sent");
    }

    await admin.from("events").insert({
      document_id: doc.id,
      type: "viewed",
      ip,
      user_agent: userAgent,
    });

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id)
      .eq("type", "viewed")
      .gte("created_at", hourAgo);

    if ((count ?? 0) <= 1) {
      const workspace = first(
        doc.workspaces as { owner_id: string } | { owner_id: string }[] | null,
      );
      const client = first(doc.clients as { name: string } | { name: string }[] | null);
      if (workspace?.owner_id) {
        const { data: owner } = await admin.auth.admin.getUserById(workspace.owner_id);
        if (owner.user?.email) {
          await sendViewedToFreelancer({
            to: owner.user.email,
            clientName: client?.name ?? "Client",
            title: doc.title,
          });
        }
      }
    }
  } catch (error) {
    logError("sign.view", error);
  }
}
