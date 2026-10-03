import { describe, expect, it } from "vitest";
import { compareNudges, nudgeFor, type NudgeDoc } from "@/lib/nudges";

const NOW = new Date("2026-10-10T10:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

function doc(over: Partial<NudgeDoc> = {}): NudgeDoc {
  return {
    status: "sent",
    expires_at: null,
    sent_at: daysAgo(3),
    viewed_at: null,
    signed_at: null,
    payment_claimed_at: null,
    subtotal: 100000,
    amount_due: 50000,
    remainder_amount: 50000,
    advance_paid_at: null,
    balance_due_at: null,
    last_nudged_at: null,
    nudge_count: 0,
    ...over,
  };
}

describe("nudgeFor", () => {
  it("flags a sent, unopened proposal after 2 days", () => {
    expect(nudgeFor(doc({ sent_at: daysAgo(2) }), NOW)?.reason).toBe("not_viewed");
    expect(nudgeFor(doc({ sent_at: daysAgo(1) }), NOW)).toBeNull();
  });

  it("flags an opened but unsigned proposal after 2 days", () => {
    const n = nudgeFor(doc({ status: "viewed", viewed_at: daysAgo(1), sent_at: daysAgo(4) }), NOW);
    expect(n?.reason).toBe("not_signed");
    expect(n?.daysWaiting).toBe(4);
  });

  it("ignores drafts, void, paid and expired", () => {
    expect(nudgeFor(doc({ status: "draft", sent_at: null }), NOW)).toBeNull();
    expect(nudgeFor(doc({ status: "void" }), NOW)).toBeNull();
    expect(nudgeFor(doc({ status: "paid", signed_at: daysAgo(9) }), NOW)).toBeNull();
    expect(nudgeFor(doc({ status: "sent", expires_at: daysAgo(1) }), NOW)).toBeNull();
  });

  it("flags signed with the advance unpaid after a day of grace", () => {
    expect(nudgeFor(doc({ status: "signed", signed_at: daysAgo(0) }), NOW)).toBeNull();
    expect(nudgeFor(doc({ status: "signed", signed_at: daysAgo(1) }), NOW)?.reason).toBe("advance_unpaid");
  });

  it("calls a pay-in-full job payment_unpaid, not advance_unpaid", () => {
    const n = nudgeFor(doc({ status: "signed", signed_at: daysAgo(2), amount_due: 100000, remainder_amount: 0 }), NOW);
    expect(n?.reason).toBe("payment_unpaid");
  });

  it("does not nag about the balance until its date has passed", () => {
    const base = doc({ status: "signed", signed_at: daysAgo(8), advance_paid_at: daysAgo(7) });
    expect(nudgeFor(base, NOW)).toBeNull();
    expect(nudgeFor({ ...base, balance_due_at: new Date(NOW.getTime() + 86400000).toISOString() }, NOW)).toBeNull();
    const overdue = nudgeFor({ ...base, balance_due_at: daysAgo(3) }, NOW);
    expect(overdue?.reason).toBe("balance_overdue");
    expect(overdue?.daysWaiting).toBe(3);
  });

  it("always lists awaiting confirmation, even right after a nudge", () => {
    const n = nudgeFor(
      doc({ status: "payment_sent", payment_claimed_at: daysAgo(0), last_nudged_at: daysAgo(0), nudge_count: 3 }),
      NOW,
    );
    expect(n?.reason).toBe("awaiting_confirmation");
  });

  it("hides a job for 2 days after a follow-up, then brings it back as the firm step", () => {
    const base = doc({ sent_at: daysAgo(6), nudge_count: 1 });
    expect(nudgeFor({ ...base, last_nudged_at: daysAgo(1) }, NOW)).toBeNull();
    const back = nudgeFor({ ...base, last_nudged_at: daysAgo(2) }, NOW);
    expect(back?.reason).toBe("not_viewed");
    expect(back?.step).toBe(2);
  });

  it("uses the polite step for a job never followed up", () => {
    expect(nudgeFor(doc(), NOW)?.step).toBe(1);
  });

  it("copes with missing or invalid dates", () => {
    expect(nudgeFor(doc({ sent_at: null }), NOW)).toBeNull();
    expect(nudgeFor(doc({ sent_at: "not a date" }), NOW)).toBeNull();
    expect(nudgeFor(doc({ deleted_at: daysAgo(1) }), NOW)).toBeNull();
  });

  it("sorts awaiting confirmation first, then longest wait", () => {
    const a = nudgeFor(doc({ status: "payment_sent", payment_claimed_at: daysAgo(1) }), NOW)!;
    const b = nudgeFor(doc({ sent_at: daysAgo(9) }), NOW)!;
    const c = nudgeFor(doc({ sent_at: daysAgo(3) }), NOW)!;
    expect([c, b, a].sort(compareNudges).map((n) => n.reason)).toEqual([
      "awaiting_confirmation",
      "not_viewed",
      "not_viewed",
    ]);
    expect([c, b].sort(compareNudges)[0]).toBe(b);
  });
});
