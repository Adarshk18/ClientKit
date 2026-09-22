import type { Plan, PlanStatus } from "@/lib/types";

export const PLAN_PRICES: Record<Exclude<Plan, "free">, { usd: number; label: string }> = {
  founder: { usd: 9, label: "Founder" },
  solo: { usd: 12, label: "Solo" },
  busy: { usd: 29, label: "Busy" },
};

export const SENT_LIMITS: Record<Plan, number> = {
  free: 3,
  founder: 20,
  solo: 40,
  busy: Number.POSITIVE_INFINITY,
};

export const GRACE_DAYS = 3;

/** Founder is only offered to the first N workspaces. After that, new accounts take Solo. */
export const FOUNDER_CAP = 50;

export function founderSeatsRemaining(founderWorkspaceCount: number): number {
  return Math.max(0, FOUNDER_CAP - founderWorkspaceCount);
}

export function canPurchaseFounder(founderWorkspaceCount: number): boolean {
  return founderWorkspaceCount < FOUNDER_CAP;
}

export function sentLimit(plan: Plan): number {
  return SENT_LIMITS[plan];
}

export function canSendDocument(input: {
  plan: Plan;
  plan_status: PlanStatus;
  docs_sent_this_period: number;
  period_reset_at: string;
  grace_until: string | null;
  now?: Date;
}): { ok: true; sentThisPeriod: number } | { ok: false; reason: string; code: string } {
  const now = input.now ?? new Date();
  const periodReset = new Date(input.period_reset_at);
  const sent = periodReset.getTime() <= now.getTime() ? 0 : input.docs_sent_this_period;

  if (input.plan_status === "canceled") {
    return { ok: false, reason: "Your plan is canceled. Upgrade to send documents.", code: "plan_canceled" };
  }

  if (input.plan_status === "read_only") {
    return {
      ok: false,
      reason: "Your workspace is read-only after a failed payment. Update billing to send again.",
      code: "read_only",
    };
  }

  if (input.plan_status === "past_due") {
    const grace = input.grace_until ? new Date(input.grace_until) : null;
    if (grace && grace.getTime() < now.getTime()) {
      return {
        ok: false,
        reason: "Payment failed and the 3-day grace period ended. Update billing to send again.",
        code: "read_only",
      };
    }
  }

  const limit = sentLimit(input.plan);
  if (sent >= limit) {
    return {
      ok: false,
      reason: `You've sent ${sent} documents this period. Upgrade to send more.`,
      code: "plan_limit",
    };
  }

  return { ok: true, sentThisPeriod: sent };
}

export function effectivePlanStatus(input: {
  plan_status: PlanStatus;
  grace_until: string | null;
  now?: Date;
}): PlanStatus {
  const now = input.now ?? new Date();
  if (input.plan_status === "past_due") {
    const grace = input.grace_until ? new Date(input.grace_until) : null;
    if (!grace || grace.getTime() < now.getTime()) return "read_only";
  }
  return input.plan_status;
}

export function productEnvKey(plan: Exclude<Plan, "free">): string {
  return {
    founder: "DODO_PRODUCT_FOUNDER",
    solo: "DODO_PRODUCT_SOLO",
    busy: "DODO_PRODUCT_BUSY",
  }[plan];
}
