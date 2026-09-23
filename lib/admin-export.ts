import { formatActiveMinutes, type AdminDashboard } from "@/lib/admin-metrics";

export function exportFilename(ext: "csv" | "xls" | "pdf", now = new Date()): string {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Calcutta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return `client-kit-admin-${day}.${ext}`;
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvEscape).join(",");
}

export function buildAdminCsv(data: AdminDashboard): string {
  const lines: string[] = [];
  const section = (title: string) => {
    if (lines.length) lines.push("");
    lines.push(title);
  };

  section("KPIs");
  lines.push(csvRow(["metric", "value"]));
  lines.push(csvRow(["workspaces_total", data.signups.total]));
  lines.push(csvRow(["signups_7d", data.signups.last7]));
  lines.push(csvRow(["signups_30d", data.signups.last30]));
  lines.push(csvRow(["paid_workspaces", data.paidWorkspaces]));
  lines.push(csvRow(["estimated_mrr_usd", data.estimatedMrr]));
  lines.push(csvRow(["page_views_7d", data.analytics.pageViews7]));
  lines.push(csvRow(["page_views_30d", data.analytics.pageViews30]));
  lines.push(csvRow(["cta_clicks_7d", data.analytics.ctaClicks7]));
  lines.push(csvRow(["cta_clicks_30d", data.analytics.ctaClicks30]));
  lines.push(csvRow(["docs_sent_30d", data.docs.sent30]));
  lines.push(csvRow(["docs_signed_30d", data.docs.signed30]));
  lines.push(csvRow(["docs_paid_30d", data.docs.paid30]));

  section("Plan counts");
  lines.push(csvRow(["plan", "count"]));
  for (const plan of ["free", "founder", "solo", "busy"] as const) {
    lines.push(csvRow([plan, data.planCounts[plan]]));
  }

  section("Funnel docs by status");
  lines.push(csvRow(["status", "count"]));
  for (const [status, count] of Object.entries(data.docs.byStatus)) {
    lines.push(csvRow([status, count]));
  }

  section("Events 30d");
  lines.push(csvRow(["type", "count"]));
  for (const [type, count] of Object.entries(data.events30)) {
    lines.push(csvRow([type, count]));
  }

  section("Traffic by day (UTC)");
  lines.push(csvRow(["day", "page_view", "cta_click"]));
  for (const row of data.analytics.byDay) {
    lines.push(csvRow([row.day, row.counts.page_view ?? 0, row.counts.cta_click ?? 0]));
  }

  section("Daily signups (IST)");
  lines.push(
    csvRow([
      "day_ist",
      "workspace_id",
      "name",
      "email",
      "plan",
      "created_at",
      "active_minutes",
      "action_count",
      "last_seen_at",
    ]),
  );
  for (const day of data.dailySignups) {
    for (const a of day.accounts) {
      lines.push(
        csvRow([
          day.day,
          a.id,
          a.name,
          a.email,
          a.plan,
          a.created_at,
          a.activeMinutes,
          a.actionCount,
          a.lastSeenAt,
        ]),
      );
    }
  }

  section("Top workspaces");
  lines.push(csvRow(["id", "name", "plan", "docs"]));
  for (const w of data.topWorkspaces) {
    lines.push(csvRow([w.id, w.name, w.plan, w.docs]));
  }

  section("Recent signed/paid docs");
  lines.push(csvRow(["id", "title", "status", "public_id", "signed_at", "paid_at"]));
  for (const d of data.recentDocs) {
    lines.push(csvRow([d.id, d.title, d.status, d.public_id, d.signed_at, d.paid_at]));
  }

  section("Recent analytics");
  lines.push(csvRow(["id", "name", "path", "created_at"]));
  for (const a of data.recentAnalytics) {
    lines.push(csvRow([a.id, a.name, a.path, a.created_at]));
  }

  // UTF-8 BOM for Excel
  return `\uFEFF${lines.join("\n")}\n`;
}

function xmlEscape(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetRows(rows: Array<Array<string | number | null | undefined>>): string {
  return rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const isNum = typeof cell === "number";
          return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");
}

/** Excel-friendly SpreadsheetML (.xls) without extra npm deps. */
export function buildAdminXls(data: AdminDashboard): string {
  const overview: Array<Array<string | number | null | undefined>> = [
    ["Section", "Metric", "Value"],
    ["KPI", "workspaces_total", data.signups.total],
    ["KPI", "signups_7d", data.signups.last7],
    ["KPI", "signups_30d", data.signups.last30],
    ["KPI", "paid_workspaces", data.paidWorkspaces],
    ["KPI", "estimated_mrr_usd", data.estimatedMrr],
    ["KPI", "page_views_7d", data.analytics.pageViews7],
    ["KPI", "cta_clicks_7d", data.analytics.ctaClicks7],
    ["KPI", "docs_sent_30d", data.docs.sent30],
    ["KPI", "docs_signed_30d", data.docs.signed30],
    ["KPI", "docs_paid_30d", data.docs.paid30],
  ];
  for (const plan of ["free", "founder", "solo", "busy"] as const) {
    overview.push(["Plan", plan, data.planCounts[plan]]);
  }
  for (const [status, count] of Object.entries(data.docs.byStatus)) {
    overview.push(["Doc status", status, count]);
  }
  for (const row of data.analytics.byDay) {
    overview.push(["Traffic", row.day, `views=${row.counts.page_view ?? 0}; cta=${row.counts.cta_click ?? 0}`]);
  }
  for (const w of data.topWorkspaces) {
    overview.push(["Top workspace", `${w.name} (${w.plan})`, w.docs]);
  }

  const signups: Array<Array<string | number | null | undefined>> = [
    [
      "day_ist",
      "name",
      "email",
      "plan",
      "created_at",
      "active_minutes",
      "active_label",
      "action_count",
      "last_seen_at",
      "workspace_id",
    ],
  ];
  for (const day of data.dailySignups) {
    for (const a of day.accounts) {
      signups.push([
        day.day,
        a.name,
        a.email,
        a.plan,
        a.created_at,
        a.activeMinutes,
        formatActiveMinutes(a.activeMinutes),
        a.actionCount,
        a.lastSeenAt,
        a.id,
      ]);
    }
  }

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Overview">
  <Table>${sheetRows(overview)}</Table>
 </Worksheet>
 <Worksheet ss:Name="Daily signups">
  <Table>${sheetRows(signups)}</Table>
 </Worksheet>
</Workbook>
`;
}
