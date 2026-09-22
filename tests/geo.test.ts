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
  it("maps each country to its currency", () => {
    expect(currencyForCountry("IN")).toBe("INR");
    expect(currencyForCountry("US")).toBe("USD");
    expect(currencyForCountry("GB")).toBe("GBP");
    expect(currencyForCountry("DE")).toBe("EUR");
    expect(currencyForCountry("FR")).toBe("EUR");
    expect(currencyForCountry("CA")).toBe("CAD");
    expect(currencyForCountry("AU")).toBe("AUD");
    expect(currencyForCountry("SG")).toBe("SGD");
    expect(currencyForCountry("AE")).toBe("AED");
    expect(currencyForCountry("NZ")).toBe("NZD");
    expect(currencyForCountry("OTHER")).toBe("USD");
  });

  it("uses fixed list prices per currency", () => {
    expect(PLAN_PRICES_BY_CURRENCY.USD).toEqual({ founder: 9, solo: 12, busy: 29 });
    expect(PLAN_PRICES_BY_CURRENCY.INR).toEqual({ founder: 749, solo: 999, busy: 2499 });
    expect(PLAN_PRICES_BY_CURRENCY.GBP).toEqual({ founder: 7, solo: 9, busy: 22 });
    expect(PLAN_PRICES_BY_CURRENCY.EUR).toEqual({ founder: 8, solo: 11, busy: 27 });
    expect(planPriceMajor("solo", "US")).toBe(12);
    expect(planPriceMajor("solo", "IN")).toBe(999);
    expect(planPriceMajor("solo", "GB")).toBe(9);
    expect(planPriceMajor("solo", "DE")).toBe(11);
    expect(planPriceMajor("busy", "AU")).toBe(45);
  });

  it("formats plan prices with the right currency symbol", () => {
    expect(formatPlanPrice("founder", "US")).toMatch(/\$9/);
    expect(formatPlanPrice("solo", "GB")).toMatch(/£9|GBP/);
    expect(formatPlanPrice("solo", "DE")).toMatch(/11/);
    expect(formatPlanPrice("founder", "IN")).toMatch(/749/);
    expect(formatPlanPrice("busy", "IN")).toMatch(/2,?499/);
  });

  it("normalizes country codes and Other to US for workspace", () => {
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
