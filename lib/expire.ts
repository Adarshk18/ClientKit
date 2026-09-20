import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function expireOverdueDocuments(): Promise<number> {
  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { data } = await admin
    .from("documents")
    .select("id")
    .in("status", ["sent", "viewed"])
    .lt("expires_at", now)
    .is("deleted_at", null);
  if (!data?.length) return 0;
  const ids = data.map((row) => row.id);
  await admin.from("documents").update({ status: "expired" }).in("id", ids);
  await admin.from("events").insert(
    ids.map((id) => ({
      document_id: id,
      type: "expired",
      meta: { source: "cron" },
    })),
  );
  return ids.length;
}
