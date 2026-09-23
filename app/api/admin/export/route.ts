import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { loadAdminDashboard } from "@/lib/admin-metrics";
import { buildAdminCsv, buildAdminXls, exportFilename } from "@/lib/admin-export";
import { renderAdminPdf } from "@/lib/admin-export-pdf";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

const FORMATS = new Set(["csv", "xlsx", "xls", "pdf"]);

export async function GET(request: Request) {
  const { admin } = await requireAdmin();
  const url = new URL(request.url);
  const raw = (url.searchParams.get("format") ?? "csv").toLowerCase();
  if (!FORMATS.has(raw)) {
    return NextResponse.json({ ok: false, error: "invalid_format" }, { status: 400 });
  }

  try {
    const data = await loadAdminDashboard(admin);
    const now = new Date();

    if (raw === "csv") {
      const body = buildAdminCsv(data);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${exportFilename("csv", now)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    if (raw === "xlsx" || raw === "xls") {
      const body = buildAdminXls(data);
      return new NextResponse(body, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="${exportFilename("xls", now)}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const pdf = await renderAdminPdf(data, now);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${exportFilename("pdf", now)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logError("admin.export", error);
    return NextResponse.json({ ok: false, error: "export_failed" }, { status: 500 });
  }
}
