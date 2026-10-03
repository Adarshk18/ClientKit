import { describe, expect, it } from "vitest";
import { computeAmounts, formatMoney, toMinorUnits } from "@/lib/money";

describe("computeAmounts", () => {
  const items = [{ qty: 1, unit_amount: 120000 }];

  it("treats 0% as pay in full", () => {
    const result = computeAmounts(items, 0);
    expect(result.amount_due).toBe(120000);
    expect(result.remainder_amount).toBe(0);
  });

  it("treats 100% as pay in full", () => {
    const result = computeAmounts(items, 100);
    expect(result.amount_due).toBe(120000);
    expect(result.remainder_amount).toBe(0);
  });

  it("splits 50% and shows remainder as due later", () => {
    const result = computeAmounts(items, 50);
    expect(result.amount_due).toBe(60000);
    expect(result.remainder_amount).toBe(60000);
  });

  it("handles empty line items", () => {
    const result = computeAmounts([], 50);
    expect(result.subtotal).toBe(0);
    expect(result.amount_due).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats USD from minor units", () => {
    expect(formatMoney(60000, "USD", "en-US")).toBe("$600.00");
  });

  it("formats JPY without cents", () => {
    expect(toMinorUnits(1200, "JPY")).toBe(1200);
    expect(formatMoney(1200, "JPY", "en-US")).toContain("1,200");
  });
});

describe("computeAmounts advance edge cases", () => {
  it("always adds the advance and balance up to the subtotal", () => {
    for (const subtotal of [1, 3, 99, 100, 33333, 120001, 999999999]) {
      for (const pct of [30, 40, 50]) {
        const r = computeAmounts([{ qty: 1, unit_amount: subtotal }], pct);
        expect(r.deposit_amount + r.remainder_amount).toBe(subtotal);
        expect(r.amount_due).toBe(r.deposit_amount);
      }
    }
  });

  it("rounds the advance to the nearest minor unit and gives the rest to the balance", () => {
    const r = computeAmounts([{ qty: 1, unit_amount: 33333 }], 30);
    expect(r.deposit_amount).toBe(10000);
    expect(r.remainder_amount).toBe(23333);
  });

  it("falls back to one payment when the advance would round to nothing", () => {
    const r = computeAmounts([{ qty: 1, unit_amount: 1 }], 30);
    expect(r.deposit_amount).toBe(1);
    expect(r.remainder_amount).toBe(0);
    expect(r.deposit_percent).toBe(0);
  });

  it("works for zero-decimal currencies (whole units are the minor unit)", () => {
    const r = computeAmounts([{ qty: 1, unit_amount: toMinorUnits(10001, "JPY") }], 40);
    expect(r.deposit_amount).toBe(4000);
    expect(r.remainder_amount).toBe(6001);
  });

  it("handles a zero total and bad input", () => {
    expect(computeAmounts([], 30)).toMatchObject({ subtotal: 0, amount_due: 0, remainder_amount: 0 });
    expect(computeAmounts([{ qty: 1, unit_amount: 1000 }], Number.NaN).remainder_amount).toBe(0);
    expect(computeAmounts([{ qty: 1, unit_amount: 1000 }], 250).remainder_amount).toBe(0);
    expect(computeAmounts([{ qty: 1, unit_amount: 1000 }], -5).remainder_amount).toBe(0);
  });

  it("keeps old documents with 0 and 100 percent exactly as before", () => {
    for (const pct of [0, 100]) {
      const r = computeAmounts([{ qty: 2, unit_amount: 50000 }], pct);
      expect(r).toEqual({
        subtotal: 100000,
        deposit_percent: pct,
        deposit_amount: 100000,
        amount_due: 100000,
        remainder_amount: 0,
      });
    }
  });
});
