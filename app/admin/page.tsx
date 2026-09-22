import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { loadAdminDashboard } from "@/lib/admin-metrics";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-line bg-cream p-4">
      <p className="text-[12px] text-stamp">{label}</p>
      <p className="mt-2 font-serif text-3xl tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function fmtDay(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Calcutta",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso.slice(0, 16);
  }
}

export default async function AdminPage() {
  const { admin } = await requireAdmin();
  const data = await loadAdminDashboard(admin);

  const maxBar = Math.max(
    1,
    ...data.analytics.byDay.flatMap((d) => [d.counts.page_view ?? 0, d.counts.cta_click ?? 0]),
  );

  const eventTypes = ["viewed", "signed", "paid", "resent", "voided", "expired", "payment_sent"];

  return (
    <main className="ck-page-pad mx-auto w-full max-w-6xl space-y-8 overflow-x-clip px-3 py-6 sm:space-y-10 sm:px-4 sm:py-8">
      <div>
        <p className="text-[13px] text-stamp">Founder dashboard</p>
        <h1 className="mt-1 font-serif text-3xl">Product pulse</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Signups, traffic, funnel, and plan mix. Analytics inserts need migration{" "}
          <code className="text-ink">0002_admin_analytics.sql</code> applied in Supabase.
        </p>
      </div>

      <div className="grid gap-px border border-line bg-line grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Workspaces"
          value={data.signups.total}
          hint={`+${data.signups.last7} / 7d · +${data.signups.last30} / 30d`}
        />
        <Kpi label="Paid seats" value={data.paidWorkspaces} hint={`~$${data.estimatedMrr} MRR`} />
        <Kpi
          label="Docs 30d"
          value={`${data.docs.sent30} / ${data.docs.signed30} / ${data.docs.paid30}`}
          hint="sent · signed · paid"
        />
        <Kpi
          label="Traffic"
          value={data.analytics.pageViews7}
          hint={`page views 7d · ${data.analytics.ctaClicks7} CTA clicks`}
        />
      </div>

      <Section title="Plans">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {(["free", "founder", "solo", "busy"] as const).map((plan) => (
            <div key={plan} className="border border-line bg-cream px-4 py-3">
              <p className="text-[12px] capitalize text-stamp">{plan}</p>
              <p className="mt-1 font-serif text-2xl tabular-nums">{data.planCounts[plan]}</p>
            </div>
          ))}
          <div className="border border-line bg-cream px-4 py-3">
            <p className="text-[12px] text-stamp">Founder seats left</p>
            <p className="mt-1 font-serif text-2xl tabular-nums">
              {data.founderSeatsLeft}
              <span className="text-base text-muted"> / {data.founderCap}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
          <span>
            past_due: <strong className="text-ink">{data.planStatusCounts.past_due}</strong>
          </span>
          <span>
            read_only: <strong className="text-ink">{data.planStatusCounts.read_only}</strong>
          </span>
          <span>
            canceled: <strong className="text-ink">{data.planStatusCounts.canceled}</strong>
          </span>
          <span>
            active: <strong className="text-ink">{data.planStatusCounts.active}</strong>
          </span>
        </div>
      </Section>

      <Section title="Funnel">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <p className="text-[12px] text-muted">Documents by status</p>
            <ul className="mt-2 divide-y divide-line border border-line bg-cream text-sm">
              {(Object.keys(data.docs.byStatus) as Array<keyof typeof data.docs.byStatus>).map((status) => (
                <li key={status} className="flex justify-between px-3 py-2">
                  <span className="capitalize">{status}</span>
                  <span className="tabular-nums">{data.docs.byStatus[status]}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] text-muted">Events last 30d</p>
            <ul className="mt-2 divide-y divide-line border border-line bg-cream text-sm">
              {eventTypes.map((type) => (
                <li key={type} className="flex justify-between px-3 py-2">
                  <span>{type}</span>
                  <span className="tabular-nums">{data.events30[type] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Traffic (14d)">
        <p className="mb-3 text-[12px] text-muted">
          page_view 7d / 30d: {data.analytics.pageViews7} / {data.analytics.pageViews30} · cta_click:{" "}
          {data.analytics.ctaClicks7} / {data.analytics.ctaClicks30}
        </p>
        <div className="max-w-full overflow-x-auto overscroll-x-contain border border-line bg-cream">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead className="border-b border-line text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Day (UTC)</th>
                <th className="px-3 py-2 font-medium">Views</th>
                <th className="px-3 py-2 font-medium">CTA</th>
                <th className="px-3 py-2 font-medium">Bars</th>
              </tr>
            </thead>
            <tbody>
              {data.analytics.byDay.map((row) => {
                const views = row.counts.page_view ?? 0;
                const clicks = row.counts.cta_click ?? 0;
                return (
                  <tr key={row.day} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 tabular-nums">{row.day}</td>
                    <td className="px-3 py-2 tabular-nums">{views}</td>
                    <td className="px-3 py-2 tabular-nums">{clicks}</td>
                    <td className="px-3 py-2">
                      <div className="flex h-3 max-w-xs gap-0.5">
                        <span
                          className="bg-stamp/80"
                          style={{ width: `${(views / maxBar) * 100}%`, minWidth: views ? 2 : 0 }}
                          title={`views ${views}`}
                        />
                        <span
                          className="bg-ink/40"
                          style={{ width: `${(clicks / maxBar) * 100}%`, minWidth: clicks ? 2 : 0 }}
                          title={`cta ${clicks}`}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Top workspaces by docs">
        <ul className="divide-y divide-line border border-line bg-cream text-sm">
          {data.topWorkspaces.length === 0 ? (
            <li className="px-3 py-3 text-muted">No documents yet.</li>
          ) : (
            data.topWorkspaces.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span>
                  {w.name}
                  <span className="mt-0.5 block text-[12px] capitalize text-muted">{w.plan}</span>
                </span>
                <span className="tabular-nums">{w.docs}</span>
              </li>
            ))
          )}
        </ul>
      </Section>

      <div className="grid gap-8 border-t border-line pt-8 lg:grid-cols-3">
        <div>
          <h2 className="font-serif text-xl">Latest workspaces</h2>
          <ul className="mt-4 divide-y divide-line border border-line bg-cream text-sm">
            {data.recentWorkspaces.map((w) => (
              <li key={w.id} className="px-3 py-2">
                <span className="font-medium">{w.name}</span>
                <span className="mt-0.5 block text-[12px] text-muted">
                  {w.plan} · {fmtDay(w.created_at)} IST
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-xl">Signed / paid</h2>
          <ul className="mt-4 divide-y divide-line border border-line bg-cream text-sm">
            {data.recentDocs.length === 0 ? (
              <li className="px-3 py-3 text-muted">None yet.</li>
            ) : (
              data.recentDocs.map((d) => (
                <li key={d.id} className="px-3 py-2">
                  <Link href={`/s/${d.public_id}`} className="font-medium hover:text-stamp">
                    {d.title}
                  </Link>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {d.status}
                    {d.paid_at ? ` · paid ${fmtDay(d.paid_at)}` : d.signed_at ? ` · signed ${fmtDay(d.signed_at)}` : ""}{" "}
                    IST
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h2 className="font-serif text-xl">Analytics feed</h2>
          <ul className="mt-4 divide-y divide-line border border-line bg-cream text-sm">
            {data.recentAnalytics.length === 0 ? (
              <li className="px-3 py-3 text-muted">No analytics events (migration applied?).</li>
            ) : (
              data.recentAnalytics.map((a) => (
                <li key={a.id} className="px-3 py-2">
                  <span className="font-medium">{a.name}</span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    {a.path ?? "—"} · {fmtDay(a.created_at)} IST
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
