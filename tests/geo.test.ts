import { describe, expect, it } from "vitest";
import {
  currencyForCountry,
  detectCountryFromHeaders,
  formatPlanPrice,
  normalizeCountry,
  planPriceMajor,
  PLAN_PRICES_BY_CURRENCY,
  resolveVisitorCountry,
  workspaceCountry,
} from "@/lib/billing-regions";

describe("billing regions", () => {
  it("maps only India to INR", () => {
    expect(currencyForCountry("IN")).toBe("INR");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("GB")).toBe("USD");
    expect(currencyForCountry("OTHER")).toBe("USD");
    expect(currencyForCountry("xx")).toBe("USD");
  });

  it("uses fixed USD and INR list prices", () => {
    expect(PLAN_PRICES_BY_CURRENCY.USD).toEqual({ founder: 9, solo: 12, busy: 29 });
    expect(PLAN_PRICES_BY_CURRENCY.INR).toEqual({ founder: 749, solo: 999, busy: 2499 });
    expect(planPriceMajor("solo", "US")).toBe(12);
    expect(planPriceMajor("solo", "IN")).toBe(999);
    expect(planPriceMajor("busy", "IN")).toBe(2499);
  });

  it("formats plan prices with currency symbols", () => {
    expect(formatPlanPrice("founder", "US")).toMatch(/\$9/);
    expect(formatPlanPrice("solo", "US")).toMatch(/\$12/);
    expect(formatPlanPrice("busy", "US")).toMatch(/\$29/);
    expect(formatPlanPrice("founder", "IN")).toMatch(/749/);
    expect(formatPlanPrice("solo", "IN")).toMatch(/999/);
    expect(formatPlanPrice("busy", "IN")).toMatch(/2,?499/);
  });

  it("normalizes country codes and Other → US for workspace", () => {
    expect(normalizeCountry("in")).toBe("IN");
    expect(normalizeCountry("OTHER")).toBe("OTHER");
    expect(workspaceCountry("OTHER")).toBe("US");
    expect(workspaceCountry("IN")).toBe("IN");
    expect(normalizeCountry("ZZ")).toBe("OTHER");
  });

  it("detects country from Vercel / CF headers with US default", () => {
    expect(
      detectCountryFromHeaders((name) => (name === "x-vercel-ip-country" ? "IN" : null)),
    ).toBe("IN");
    expect(
      detectCountryFromHeaders((name) => (name === "cf-ipcountry" ? "GB" : null)),
    ).toBe("GB");
    expect(detectCountryFromHeaders(() => null)).toBe("US");
  });

  it("prefers ck_country cookie over geo headers", () => {
    expect(
      resolveVisitorCountry({
        cookie: "IN",
        getHeader: () => "US",
      }),
    ).toBe("IN");
    expect(
      resolveVisitorCountry({
        cookie: null,
        getHeader: (name) => (name === "x-vercel-ip-country" ? "DE" : null),
      }),
    ).toBe("DE");
  });
});
