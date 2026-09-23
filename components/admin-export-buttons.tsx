"use client";

const BUTTON =
  "inline-flex items-center border border-line bg-cream px-3 py-1.5 text-[12px] text-ink hover:border-stamp hover:text-stamp";

export function AdminExportButtons() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[12px] text-stamp">Export</span>
      <a className={BUTTON} href="/api/admin/export?format=csv">
        CSV
      </a>
      <a className={BUTTON} href="/api/admin/export?format=xls">
        Excel
      </a>
      <a className={BUTTON} href="/api/admin/export?format=pdf">
        PDF
      </a>
    </div>
  );
}
