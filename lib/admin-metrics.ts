import { FOUNDER_CAP, PLAN_PRICES, founderSeatsRemaining } from "@/lib/plans";
import type { DocStatus, Plan, PlanStatus } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanCounts = Record<Plan, number>;
export type PlanStatusCounts = Record<PlanStatus, number>;
export type DocStatusCounts = Record<DocStatus, number>;

export const IST_TIMEZONE = "Asia/Calcutta";

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

/** YYYY-MM-DD calendar day in Asia/Calcutta for an ISO timestamp. */
export function istDayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/**
 * Last `days` calendar days in Asia/Calcutta, newest first (YYYY-MM-DD).
 * Walks civil dates so DST/offset quirks do not skip a day.
 */
export function istDayKeys(days: number, now = new Date()): string[] {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  let y = Number(parts.find((p) => p.type === "year")?.value);
  let m = Number(parts.find((p) => p.type === "month")?.value);
  let d = Number(parts.find((p) => p.type === "day")?.value);
  const pad = (n: number) => String(n).padStart(2, "0");
  const keys: string[] = [];
  for (let i = 0; i < days; i++) {
    keys.push(`${y}-${pad(m)}-${pad(d)}`);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() - 1);
    y = dt.getUTCFullYear();
    m = dt.getUTCMonth() + 1;
    d = dt.getUTCDate();
  }
  return keys;
}

/**
 * Estimate active minutes from activity timestamps.
 * Sort unique times; sum consecutive gaps capped at `maxGapMinutes` each.
 * One timestamp → 1 minute; none → 0.
 */
export function estimateActiveMinutes(
  timestamps: Array<string | null | undefined>,
  maxGapMinutes = 5,
): number {
  const unique = [
    ...new Set(
      timestamps
        .filter((t): t is string => typeof t === "string" && t.length > 0)
        .map((t) => new Date(t).getTime())
        .filter((ms) => !Number.isNaN(ms)),
    ),
  ].sort((a, b) => a - b);

  if (unique.length === 0) return 0;
  if (unique.length === 1) return 1;

  const maxGapMs = maxGapMinutes * 60 * 1000;
  let totalMs = 0;
  for (let i = 1; i < unique.length; i++) {
    const gap = unique[i]! - unique[i - 1]!;
    totalMs += Math.min(gap, maxGapMs);
  }
  return Math.max(1, Math.round(totalMs / 60_000));
}

export function formatActiveMinutes(minutes: number): string {
  if (minutes <= 0) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

export type DailySignupAccount = {
  id: string;
  name: string;
  email: string | null;
  plan: Plan;
  created_at: string;
  activeMinutes: number;
  actionCount: number;
  lastSeenAt: string | null;
};

export type DailySignups = {
  day: string;
  accounts: DailySignupAccount[];
};

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
  dailySignups: DailySignups[];
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

type DocRow = {
  id: string;
  title: string;
  status: string;
  public_id: string;
  workspace_id: string;
  signed_at: string | null;
  paid_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
};

type AnalyticsRow = {
  id: string;
  name: string;
  path: string | null;
  created_at: string;
  workspace_id: string | null;
};

async function emailsForOwners(
  admin: SupabaseClient,
  ownerIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  await Promise.all(
    ownerIds.map(async (ownerId) => {
      try {
        const { data, error } = await admin.auth.admin.getUserById(ownerId);
        if (error || !data?.user) {
          map.set(ownerId, null);
          return;
        }
        map.set(ownerId, data.user.email ?? null);
      } catch {
        map.set(ownerId, null);
      }
    }),
  );
  return map;
}

function collectDocTimestampsOnDay(doc: DocRow, day: string): string[] {
  const fields = [doc.created_at, doc.updated_at, doc.sent_at, doc.signed_at, doc.paid_at];
  return fields.filter((t): t is string => typeof t === "string" && t.length > 0 && istDayKey(t) === day);
}

export function buildDailySignups(args: {
  workspaces: { id: string; name: string; plan: Plan; created_at: string; owner_id: string }[];
  docs: DocRow[];
  analytics: AnalyticsRow[];
  emails: Map<string, string | null>;
  dayKeys: string[]; // newest first, last 30 IST days
}): DailySignups[] {
  const daySet = new Set(args.dayKeys);
  const byDay = new Map<string, typeof args.workspaces>();
  for (const w of args.workspaces) {
    const day = istDayKey(w.created_at);
    if (!daySet.has(day)) continue;
    const list = byDay.get(day) ?? [];
    list.push(w);
    byDay.set(day, list);
  }

  const docsByWs = new Map<string, DocRow[]>();
  for (const d of args.docs) {
    const list = docsByWs.get(d.workspace_id) ?? [];
    list.push(d);
    docsByWs.set(d.workspace_id, list);
  }

  const analyticsByWs = new Map<string, AnalyticsRow[]>();
  for (const a of args.analytics) {
    if (!a.workspace_id) continue;
    const list = analyticsByWs.get(a.workspace_id) ?? [];
    list.push(a);
    analyticsByWs.set(a.workspace_id, list);
  }

  const result: DailySignups[] = [];
  for (const day of args.dayKeys) {
    const accountsRaw = byDay.get(day);
    if (!accountsRaw || accountsRaw.length === 0) continue;

    const accounts: DailySignupAccount[] = accountsRaw
      .slice()
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((w) => {
        const stamps: string[] = [];
        for (const doc of docsByWs.get(w.id) ?? []) {
          stamps.push(...collectDocTimestampsOnDay(doc, day));
        }
        for (const ev of analyticsByWs.get(w.id) ?? []) {
          if (istDayKey(ev.created_at) === day) stamps.push(ev.created_at);
        }
        const uniqueSorted = [
          ...new Set(
            stamps
              .map((t) => new Date(t).getTime())
              .filter((ms) => !Number.isNaN(ms)),
          ),
        ].sort((a, b) => a - b);
        const lastSeenAt =
          uniqueSorted.length > 0 ? new Date(uniqueSorted[uniqueSorted.length - 1]!).toISOString() : null;

        return {
          id: w.id,
          name: w.name,
          email: args.emails.get(w.owner_id) ?? null,
          plan: w.plan,
          created_at: w.created_at,
          activeMinutes: estimateActiveMinutes(stamps),
          actionCount: uniqueSorted.length,
          lastSeenAt,
        };
      });

    result.push({ day, accounts });
  }
  return result;
}

export async function loadAdminDashboard(admin: SupabaseClient): Promise<AdminDashboard> {
  const now = new Date();
  const d7 = daysAgoIso(7, now);
  const d30 = daysAgoIso(30, now);
  // Slightly wider UTC window so IST day boundaries near midnight are covered.
  const d31 = daysAgoIso(31, now);

  const [workspacesRes, docsRes, eventsRes, analyticsRes, docsCountRes] = await Promise.all([
    admin
      .from("workspaces")
      .select("id, name, plan, plan_status, created_at, owner_id")
      .order("created_at", { ascending: false }),
    admin
      .from("documents")
      .select(
        "id, title, status, public_id, workspace_id, signed_at, paid_at, sent_at, created_at, updated_at, deleted_at",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    admin.from("events").select("type, created_at").gte("created_at", d30).limit(10000),
    admin
      .from("analytics_events")
      .select("id, name, path, created_at, workspace_id")
      .gte("created_at", d31)
      .order("created_at", { ascending: false })
      .limit(10000),
    admin.from("documents").select("workspace_id").is("deleted_at", null).limit(10000),
  ]);

  const workspaces = workspacesRes.data ?? [];
  const docs = (docsRes.data ?? []) as DocRow[];
  const events = eventsRes.data ?? [];
  const analytics = (analyticsRes.data ?? []) as AnalyticsRow[];
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
  const pageViews30 = analytics.filter((a) => a.name === "page_view" && a.created_at >= d30).length;
  const ctaClicks7 = analytics.filter((a) => a.name === "cta_click" && a.created_at >= d7).length;
  const ctaClicks30 = analytics.filter((a) => a.name === "cta_click" && a.created_at >= d30).length;

  const byDay = bucketByDay(
    analytics.filter((a) => a.name === "page_view" || a.name === "cta_click"),
    ["page_view", "cta_click"],
    14,
    now,
  );

  const dayKeys = istDayKeys(30, now);
  const recentOwnerIds = [
    ...new Set(
      workspaces
        .filter((w) => dayKeys.includes(istDayKey(w.created_at)))
        .map((w) => w.owner_id as string),
    ),
  ];
  const emails = await emailsForOwners(admin, recentOwnerIds);

  const dailySignups = buildDailySignups({
    workspaces: workspaces.map((w) => ({
      id: w.id,
      name: w.name,
      plan: w.plan as Plan,
      created_at: w.created_at,
      owner_id: w.owner_id as string,
    })),
    docs,
    analytics,
    emails,
    dayKeys,
  });

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
    dailySignups,
    topWorkspaces,
    recentWorkspaces,
    recentDocs,
    recentAnalytics,
  };
}
