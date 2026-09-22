import { FOUNDER_CAP, PLAN_PRICES, founderSeatsRemaining } from "@/lib/plans";
import type { DocStatus, Plan, PlanStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanCounts = Record<Plan, number>;
export type PlanStatusCounts = Record<PlanStatus, number>;
export type DocStatusCounts = Record<DocStatus, number>;

export function emptyPlanCounts(): PlanCounts {
  return { free: 0, founder: 0, solo: 0, busy: 0 };
}

export function emptyPlanStatusCounts(): PlanStatusCounts {
  return { active: 0, past_due: 0, canceled: 0, read_only: 0 };
}

export function emptyDocStatusCounts(): DocStatusCounts {
  return {
    draft: 0,
    sent: 0,
    viewed: 0,
    signed: 0,
    paid: 0,
    expired: 0,
    void: 0,
  };
}

/** Estimated MRR from paid plan seat counts (USD). */
export function estimateMrr(counts: Pick<PlanCounts, "founder" | "solo" | "busy">): number {
  return (
    counts.founder * PLAN_PRICES.founder.usd +
    counts.solo * PLAN_PRICES.solo.usd +
    counts.busy * PLAN_PRICES.busy.usd
  );
}

export function daysAgoIso(days: number, now = new Date()): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function utcDayKey(iso: string): string {
  return iso.slice(0, 10);
}

export function bucketByDay(
  rows: { created_at: string; name?: string }[],
  names: string[],
  days: number,
  now = new Date(),
): { day: string; counts: Record<string, number> }[] {
  const result: { day: string; counts: Record<string, number> }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const day = d.toISOString().slice(0, 10);
    const counts: Record<string, number> = {};
    for (const k of names) counts[k] = 0;
    result.push({ day, counts });
  }
  const index = new Map(result.map((r, i) => [r.day, i]));
  for (const row of rows) {
    const day = utcDayKey(row.created_at);
    const idx = index.get(day);
    if (idx === undefined) continue;
    const bucket = result[idx];
    if (!bucket) continue;
    const name = row.name ?? "event";
    if (name in bucket.counts) {
      bucket.counts[name] = (bucket.counts[name] ?? 0) + 1;
    }
  }
  return result;
}

export type AdminDashboard = {
  signups: { total: number; last7: number; last30: number };
  paidWorkspaces: number;
  estimatedMrr: number;
  planCounts: PlanCounts;
  planStatusCounts: PlanStatusCounts;
  founderSeatsLeft: number;
  founderCap: number;
  docs: {
    byStatus: DocStatusCounts;
    sent30: number;
    signed30: number;
    paid30: number;
  };
  events30: Record<string, number>;
  analytics: {
    pageViews7: number;
    pageViews30: number;
    ctaClicks7: number;
    ctaClicks30: number;
    byDay: { day: string; counts: Record<string, number> }[];
  };
  topWorkspaces: { id: string; name: string; plan: Plan; docs: number }[];
  recentWorkspaces: { id: string; name: string; plan: Plan; created_at: string }[];
  recentDocs: {
    id: string;
    title: string;
    status: DocStatus;
    public_id: string;
    signed_at: string | null;
    paid_at: string | null;
  }[];
  recentAnalytics: {
    id: string;
    name: string;
    path: string | null;
    created_at: string;
  }[];
};

export async function loadAdminDashboard(admin: SupabaseClient): Promise<AdminDashboard> {
  const now = new Date();
  const d7 = daysAgoIso(7, now);
  const d30 = daysAgoIso(30, now);

  const [workspacesRes, docsRes, eventsRes, analyticsRes, docsCountRes] = await Promise.all([
    admin.from("workspaces").select("id, name, plan, plan_status, created_at").order("created_at", { ascending: false }),
    admin
      .from("documents")
      .select("id, title, status, public_id, workspace_id, signed_at, paid_at, sent_at, created_at, deleted_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    admin.from("events").select("type, created_at").gte("created_at", d30).limit(10000),
    admin
      .from("analytics_events")
      .select("id, name, path, created_at")
      .gte("created_at", d30)
      .order("created_at", { ascending: false })
      .limit(10000),
    admin.from("documents").select("workspace_id").is("deleted_at", null).limit(10000),
  ]);

  const workspaces = workspacesRes.data ?? [];
  const docs = docsRes.data ?? [];
  const events = eventsRes.data ?? [];
  const analytics = analyticsRes.data ?? [];
  const docWs = docsCountRes.data ?? [];

  const planCounts = emptyPlanCounts();
  const planStatusCounts = emptyPlanStatusCounts();
  for (const w of workspaces) {
    const plan = w.plan as Plan;
    const status = w.plan_status as PlanStatus;
    if (plan in planCounts) planCounts[plan] += 1;
    if (status in planStatusCounts) planStatusCounts[status] += 1;
  }

  const signups = {
    total: workspaces.length,
    last7: workspaces.filter((w) => w.created_at >= d7).length,
    last30: workspaces.filter((w) => w.created_at >= d30).length,
  };

  const paidWorkspaces = planCounts.founder + planCounts.solo + planCounts.busy;
  const estimatedMrr = estimateMrr(planCounts);

  const byStatus = emptyDocStatusCounts();
  for (const d of docs) {
    const s = d.status as DocStatus;
    if (s in byStatus) byStatus[s] += 1;
  }

  const sent30 = docs.filter((d) => d.sent_at && d.sent_at >= d30).length;
  const signed30 = docs.filter((d) => d.signed_at && d.signed_at >= d30).length;
  const paid30 = docs.filter((d) => d.paid_at && d.paid_at >= d30).length;

  const events30: Record<string, number> = {};
  for (const e of events) {
    events30[e.type] = (events30[e.type] ?? 0) + 1;
  }

  const pageViews7 = analytics.filter((a) => a.name === "page_view" && a.created_at >= d7).length;
  const pageViews30 = analytics.filter((a) => a.name === "page_view").length;
  const ctaClicks7 = analytics.filter((a) => a.name === "cta_click" && a.created_at >= d7).length;
  const ctaClicks30 = analytics.filter((a) => a.name === "cta_click").length;

  const byDay = bucketByDay(
    analytics.filter((a) => a.name === "page_view" || a.name === "cta_click"),
    ["page_view", "cta_click"],
    14,
    now,
  );

  const docsByWs = new Map<string, number>();
  for (const row of docWs) {
    docsByWs.set(row.workspace_id, (docsByWs.get(row.workspace_id) ?? 0) + 1);
  }
  const wsName = new Map(workspaces.map((w) => [w.id, w]));
  const topWorkspaces = [...docsByWs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => {
      const w = wsName.get(id);
      return {
        id,
        name: w?.name ?? id.slice(0, 8),
        plan: (w?.plan as Plan) ?? "free",
        docs: count,
      };
    });

  const recentWorkspaces = workspaces.slice(0, 12).map((w) => ({
    id: w.id,
    name: w.name,
    plan: w.plan as Plan,
    created_at: w.created_at,
  }));

  const recentDocs = docs
    .filter((d) => d.status === "signed" || d.status === "paid")
    .slice(0, 12)
    .map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status as DocStatus,
      public_id: d.public_id,
      signed_at: d.signed_at,
      paid_at: d.paid_at,
    }));

  const recentAnalytics = analytics.slice(0, 20).map((a) => ({
    id: a.id,
    name: a.name,
    path: a.path,
    created_at: a.created_at,
  }));

  return {
    signups,
    paidWorkspaces,
    estimatedMrr,
    planCounts,
    planStatusCounts,
    founderSeatsLeft: founderSeatsRemaining(planCounts.founder),
    founderCap: FOUNDER_CAP,
    docs: { byStatus, sent30, signed30, paid30 },
    events30,
    analytics: {
      pageViews7,
      pageViews30,
      ctaClicks7,
      ctaClicks30,
      byDay,
    },
    topWorkspaces,
    recentWorkspaces,
    recentDocs,
    recentAnalytics,
  };
}
