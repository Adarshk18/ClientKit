import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function signedLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("https://") || path.startsWith("http://")) return path;
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage.from("logos").createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function signedPdfUrl(path: string): Promise<string | null> {
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage.from("pdfs").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
