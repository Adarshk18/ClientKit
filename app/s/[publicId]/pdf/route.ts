import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ publicId: string }> },
) {
  const { publicId } = await context.params;
  const admin = createSupabaseAdmin();
  const { data: doc } = await admin
    .from("documents")
    .select("id, workspace_id, status, pdfs(storage_path)")
    .eq("public_id", publicId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!doc || (doc.status !== "signed" && doc.status !== "payment_sent" && doc.status !== "paid")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pdfs = Array.isArray(doc.pdfs) ? doc.pdfs[0] : doc.pdfs;
  if (!pdfs?.storage_path) {
    return NextResponse.json({ error: "PDF not ready" }, { status: 404 });
  }

  const { data, error } = await admin.storage.from("pdfs").download(pdfs.storage_path);
  if (error || !data) {
    logError("pdf.download", error);
    return NextResponse.json({ error: "Could not download" }, { status: 500 });
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="client-kit-${publicId}.pdf"`,
      "X-Frame-Options": "DENY",
    },
  });
}
