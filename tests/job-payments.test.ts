import { describe, expect, it } from "vitest";
import {
  advanceState,
  amountConfirmed,
  balanceOutstanding,
  hasBalanceStage,
  paymentStage,
  stageAmount,
  type PaymentFields,
} from "@/lib/job-payments";

function f(over: Partial<PaymentFields> = {}): PaymentFields {
  return {
    status: "signed",
    subtotal: 100000,
    amount_due: 30000,
    remainder_amount: 70000,
    advance_paid_at: null,
    ...over,
  };
}

describe("payment stages", () => {
  it("treats a pay-in-full job as a single payment, same as before", () => {
    const full = f({ amount_due: 100000, remainder_amount: 0 });
    expect(hasBalanceStage(full)).toBe(false);
    expect(paymentStage(full)).toBe("single");
    expect(stageAmount(full)).toBe(100000);
    expect(advanceState(full)).toBe("none");
    expect(balanceOutstanding(full)).toBe(100000);
    expect(amountConfirmed({ ...full, status: "paid" })).toBe(100000);
    expect(balanceOutstanding({ ...full, status: "paid" })).toBe(0);
  });

  it("asks for the advance first, then the balance", () => {
    const start = f();
    expect(paymentStage(start)).toBe("advance");
    expect(stageAmount(start)).toBe(30000);
    expect(advanceState(start)).toBe("no");
    expect(balanceOutstanding(start)).toBe(100000);

    const afterAdvance = f({ advance_paid_at: "2026-10-01T00:00:00Z" });
    expect(paymentStage(afterAdvance)).toBe("balance");
    expect(stageAmount(afterAdvance)).toBe(70000);
    expect(advanceState(afterAdvance)).toBe("yes");
    expect(balanceOutstanding(afterAdvance)).toBe(70000);
  });

  it("keeps the balance stage when the client claims the balance", () => {
    const claim = f({ status: "payment_sent", advance_paid_at: "2026-10-01T00:00:00Z" });
    expect(paymentStage(claim)).toBe("balance");
    expect(stageAmount(claim)).toBe(70000);
  });

  it("settles to zero once paid after both steps", () => {
    const done = f({ status: "paid", advance_paid_at: "2026-10-01T00:00:00Z" });
    expect(paymentStage(done)).toBe("settled");
    expect(balanceOutstanding(done)).toBe(0);
    expect(amountConfirmed(done)).toBe(100000);
  });

  it("leaves a deposit job that was marked paid before balances existed as it was", () => {
    const legacy = f({ status: "paid", amount_due: 50000, remainder_amount: 50000 });
    expect(paymentStage(legacy)).toBe("settled");
    expect(amountConfirmed(legacy)).toBe(50000);
    expect(advanceState(legacy)).toBe("yes");
  });

  it("never reports a negative balance", () => {
    expect(balanceOutstanding(f({ status: "paid", subtotal: 0, amount_due: 0, remainder_amount: 0 }))).toBe(0);
  });
});
