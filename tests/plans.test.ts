import { describe, expect, it } from "vitest";
import {
  canPurchaseFounder,
  canSendDocument,
  effectivePlan,
  effectivePlanStatus,
  FOUNDER_CAP,
} from "@/lib/plans";
import { workspacePatchFromSubscription } from "@/lib/billing-map";

describe("canSendDocument", () => {
  const base = {
    plan: "solo" as const,
    plan_status: "active" as const,
    docs_sent_this_period: 0,
    period_reset_at: new Date(Date.now() + 86400000).toISOString(),
    grace_until: null,
  };

  it("blocks solo at 40 sent docs", () => {
    const result = canSendDocument({ ...base, docs_sent_this_period: 40 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("plan_limit");
  });

  it("allows busy unlimited", () => {
    const result = canSendDocument({ ...base, plan: "busy", docs_sent_this_period: 4000 });
    expect(result.ok).toBe(true);
  });

  it("turns past_due into read-only status after grace, and the workspace falls back to Free", () => {
    const grace = new Date(Date.now() - 1000).toISOString();
    expect(effectivePlanStatus({ plan_status: "past_due", grace_until: grace })).toBe("read_only");
    expect(effectivePlan({ plan: "solo", plan_status: "past_due", grace_until: grace })).toBe("free");
    // Free still has sends left, so it is not blocked.
    expect(canSendDocument({ ...base, plan_status: "past_due", grace_until: grace }).ok).toBe(true);
    // But it is capped at the Free limit.
    const over = canSendDocument({ ...base, plan_status: "past_due", grace_until: grace, docs_sent_this_period: 3 });
    expect(over.ok).toBe(false);
  });
});

describe("cancelled plan falls back to Free", () => {
  const future = () => new Date(Date.now() + 5 * 86400000).toISOString();
  const past = () => new Date(Date.now() - 1000).toISOString();
  const base = {
    docs_sent_this_period: 10,
    period_reset_at: new Date(Date.now() + 86400000).toISOString(),
  };

  it("active paid plan keeps its own limit", () => {
    expect(effectivePlan({ plan: "solo", plan_status: "active", grace_until: null })).toBe("solo");
    const r = canSendDocument({ ...base, plan: "solo", plan_status: "active", grace_until: null });
    expect(r.ok).toBe(true);
  });

  it("cancelled after the paid period ended is Free, not blocked", () => {
    expect(effectivePlan({ plan: "solo", plan_status: "canceled", grace_until: past() })).toBe("free");
    expect(effectivePlan({ plan: "busy", plan_status: "canceled", grace_until: null })).toBe("free");
    const under = canSendDocument({
      plan: "solo",
      plan_status: "canceled",
      grace_until: past(),
      docs_sent_this_period: 1,
      period_reset_at: base.period_reset_at,
    });
    expect(under.ok).toBe(true);
  });

  it("cancelled with paid time remaining keeps the paid plan", () => {
    expect(effectivePlan({ plan: "solo", plan_status: "canceled", grace_until: future() })).toBe("solo");
    const r = canSendDocument({ ...base, plan: "solo", plan_status: "canceled", grace_until: future() });
    expect(r.ok).toBe(true);
  });

  it("free user uses the Free limit and is not affected by status", () => {
    expect(effectivePlan({ plan: "free", plan_status: "active", grace_until: null })).toBe("free");
    const r = canSendDocument({
      plan: "free",
      plan_status: "active",
      grace_until: null,
      docs_sent_this_period: 2,
      period_reset_at: base.period_reset_at,
    });
    expect(r.ok).toBe(true);
  });

  it("over the free limit is blocked with plan_limit, even after cancelling", () => {
    const r = canSendDocument({
      plan: "solo",
      plan_status: "canceled",
      grace_until: past(),
      docs_sent_this_period: 3,
      period_reset_at: base.period_reset_at,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("plan_limit");
  });

  it("monthly reset still zeroes the count on Free", () => {
    const r = canSendDocument({
      plan: "solo",
      plan_status: "canceled",
      grace_until: null,
      docs_sent_this_period: 3,
      period_reset_at: new Date(Date.now() - 1000).toISOString(),
    });
    expect(r.ok).toBe(true);
  });

  it("a cancelled Founder keeps plan=founder in the row so the cap count is unchanged", () => {
    const patch = workspacePatchFromSubscription({
      type: "subscription.cancelled",
      metadata: { plan: "founder" },
    });
    expect(patch?.plan).toBeUndefined();
    expect(patch?.plan_status).toBe("canceled");
  });
});

describe("workspacePatchFromSubscription", () => {
  it("grants the plan only from subscription.active, not from a return URL", () => {
    const patch = workspacePatchFromSubscription({
      type: "subscription.active",
      metadata: { workspace_id: "ws_1", plan: "solo" },
      subscriptionId: "sub_1",
      customerId: "cus_1",
    });
    expect(patch?.plan).toBe("solo");
    expect(patch?.plan_status).toBe("active");
  });

  it("does not grant access on subscription.failed", () => {
    const patch = workspacePatchFromSubscription({
      type: "subscription.failed",
      metadata: { plan: "solo" },
    });
    expect(patch?.plan_status).toBeUndefined();
  });
});


describe("cancellation webhook mapping", () => {
  it("cancel at period end stores the paid-through date", () => {
    const end = new Date(Date.now() + 10 * 86400000).toISOString();
    const patch = workspacePatchFromSubscription({
      type: "subscription.cancelled",
      cancelAtPeriodEnd: true,
      nextBillingDate: end,
    });
    expect(patch?.plan_status).toBe("canceled");
    expect(patch?.grace_until).toBe(end);
  });

  it("cancel now, expired, or a past date leave no paid time", () => {
    expect(workspacePatchFromSubscription({ type: "subscription.cancelled" })?.grace_until).toBeNull();
    expect(workspacePatchFromSubscription({ type: "subscription.expired" })?.grace_until).toBeNull();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(
      workspacePatchFromSubscription({ type: "subscription.cancelled", cancelAtPeriodEnd: true, nextBillingDate: past })
        ?.grace_until,
    ).toBeNull();
  });

  it("subscription.updated with a cancelled status is handled the same way", () => {
    const patch = workspacePatchFromSubscription({ type: "subscription.updated", status: "cancelled" });
    expect(patch?.plan_status).toBe("canceled");
    expect(patch?.grace_until).toBeNull();
  });
});

describe("FOUNDER_CAP", () => {
  it("is exactly 50", () => {
    expect(FOUNDER_CAP).toBe(50);
  });

  it("allows founder while under the cap", () => {
    expect(canPurchaseFounder(0)).toBe(true);
    expect(canPurchaseFounder(FOUNDER_CAP - 1)).toBe(true);
  });

  it("rejects founder at and above the cap", () => {
    expect(canPurchaseFounder(FOUNDER_CAP)).toBe(false);
    expect(canPurchaseFounder(FOUNDER_CAP + 10)).toBe(false);
  });
});
