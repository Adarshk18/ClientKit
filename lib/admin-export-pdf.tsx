import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { formatActiveMinutes, type AdminDashboard } from "@/lib/admin-metrics";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#15202B",
  },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 9, color: "#5B6575", marginBottom: 14 },
  section: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.4,
    borderBottomColor: "#D8DEE8",
  },
  muted: { color: "#5B6575" },
  mono: { fontSize: 8 },
});

function Row({ left, right }: { left: string; right: string }) {
  return (
    <View style={styles.row}>
      <Text>{left}</Text>
      <Text style={styles.mono}>{right}</Text>
    </View>
  );
}

function AdminPdfDoc({ data, generatedAt }: { data: AdminDashboard; generatedAt: string }) {
  const totalNew = data.dailySignups.reduce((n, d) => n + d.accounts.length, 0);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Client Kit — Admin export</Text>
        <Text style={styles.subtitle}>Generated {generatedAt} (Asia/Calcutta)</Text>

        <Text style={styles.section}>KPIs</Text>
        <Row left="Workspaces" right={String(data.signups.total)} />
        <Row left="Signups 7d / 30d" right={`${data.signups.last7} / ${data.signups.last30}`} />
        <Row left="Paid seats" right={`${data.paidWorkspaces} (~$${data.estimatedMrr} MRR)`} />
        <Row
          left="Docs 30d sent/signed/paid"
          right={`${data.docs.sent30} / ${data.docs.signed30} / ${data.docs.paid30}`}
        />
        <Row
          left="Traffic 7d views / CTA"
          right={`${data.analytics.pageViews7} / ${data.analytics.ctaClicks7}`}
        />

        <Text style={styles.section}>Plan mix</Text>
        {(["free", "founder", "solo", "busy"] as const).map((plan) => (
          <Row key={plan} left={plan} right={String(data.planCounts[plan])} />
        ))}

        <Text style={styles.section}>Funnel — docs by status</Text>
        {Object.entries(data.docs.byStatus).map(([status, count]) => (
          <Row key={status} left={status} right={String(count)} />
        ))}

        <Text style={styles.section}>Events 30d</Text>
        {Object.keys(data.events30).length === 0 ? (
          <Text style={styles.muted}>None</Text>
        ) : (
          Object.entries(data.events30).map(([type, count]) => (
            <Row key={type} left={type} right={String(count)} />
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.section}>Traffic (14d UTC)</Text>
        {data.analytics.byDay.map((row) => (
          <Row
            key={row.day}
            left={row.day}
            right={`views ${row.counts.page_view ?? 0} · cta ${row.counts.cta_click ?? 0}`}
          />
        ))}

        <Text style={styles.section}>
          New accounts by day (IST) — {totalNew} in window
        </Text>
        {data.dailySignups.length === 0 ? (
          <Text style={styles.muted}>No signups in last 30d IST.</Text>
        ) : (
          data.dailySignups.map((day) => (
            <View key={day.day} wrap={false}>
              <Text style={{ marginTop: 8, fontFamily: "Helvetica-Bold" }}>
                {day.day} · {day.accounts.length} new
              </Text>
              {day.accounts.map((a) => (
                <Row
                  key={a.id}
                  left={`${a.name} · ${a.email ?? "—"} · ${a.plan}`}
                  right={`${formatActiveMinutes(a.activeMinutes)} · ${a.actionCount} actions`}
                />
              ))}
            </View>
          ))
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.section}>Top workspaces</Text>
        {data.topWorkspaces.map((w) => (
          <Row key={w.id} left={`${w.name} (${w.plan})`} right={String(w.docs)} />
        ))}

        <Text style={styles.section}>Recent signed / paid</Text>
        {data.recentDocs.length === 0 ? (
          <Text style={styles.muted}>None</Text>
        ) : (
          data.recentDocs.map((d) => (
            <Row key={d.id} left={`${d.title} · ${d.status}`} right={d.public_id} />
          ))
        )}

        <Text style={styles.section}>Recent analytics</Text>
        {data.recentAnalytics.length === 0 ? (
          <Text style={styles.muted}>None</Text>
        ) : (
          data.recentAnalytics.map((a) => (
            <Row key={a.id} left={`${a.name} · ${a.path ?? "—"}`} right={a.created_at.slice(0, 16)} />
          ))
        )}
      </Page>
    </Document>
  );
}

export async function renderAdminPdf(data: AdminDashboard, now = new Date()): Promise<Buffer> {
  const generatedAt = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Calcutta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(now);
  const buf = await renderToBuffer(<AdminPdfDoc data={data} generatedAt={generatedAt} />);
  return Buffer.from(buf);
}
