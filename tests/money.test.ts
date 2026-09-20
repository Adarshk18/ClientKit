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
