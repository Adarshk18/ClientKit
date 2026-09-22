import { describe, expect, it } from "vitest";
import { canPurchaseFounder, canSendDocument, effectivePlanStatus, FOUNDER_CAP } from "@/lib/plans";
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

  it("turns past_due into read-only after grace", () => {
    const result = canSendDocument({
      ...base,
      plan_status: "past_due",
      grace_until: new Date(Date.now() - 1000).toISOString(),
    });
    expect(result.ok).toBe(false);
    expect(effectivePlanStatus({ plan_status: "past_due", grace_until: new Date(Date.now() - 1000).toISOString() })).toBe(
      "read_only",
    );
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
