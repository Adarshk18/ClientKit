import type { Plan } from "@/lib/types";

export type BillingCurrency = "USD" | "INR";

export type CountryOption = {
  code: string;
  label: string;
};

/** Countries shown in the pricing / checkout dropdown. Only IN bills in INR. */
export const BILLING_COUNTRIES: CountryOption[] = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "SG", label: "Singapore" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "NL", label: "Netherlands" },
  { code: "IE", label: "Ireland" },
  { code: "NZ", label: "New Zealand" },
  { code: "OTHER", label: "Other" },
];

const KNOWN_CODES = new Set(BILLING_COUNTRIES.map((c) => c.code));

/** Fixed list prices by billing currency (major units). Do not invent live FX. */
export const PLAN_PRICES_BY_CURRENCY: Record<
  BillingCurrency,
  Record<Exclude<Plan, "free">, number>
> = {
  USD: { founder: 9, solo: 12, busy: 29 },
  INR: { founder: 749, solo: 999, busy: 2499 },
};

export const COUNTRY_COOKIE = "ck_country";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function normalizeCountry(raw: string | null | undefined): string {
  if (!raw) return "US";
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return "US";
  if (KNOWN_CODES.has(code)) return code;
  // Unknown geo codes fall back to Other (USD checkout via workspace country US).
  return "OTHER";
}

/** Country code stored on the workspace / sent to Dodo (never OTHER). */
export function workspaceCountry(country: string): string {
  const n = normalizeCountry(country);
  return n === "OTHER" ? "US" : n;
}

export function currencyForCountry(country: string): BillingCurrency {
  return workspaceCountry(country) === "IN" ? "INR" : "USD";
}

export function isIndiaCountry(country: string): boolean {
  return workspaceCountry(country) === "IN";
}

export function planPriceMajor(plan: Exclude<Plan, "free">, country: string): number {
  const currency = currencyForCountry(country);
  return PLAN_PRICES_BY_CURRENCY[currency][plan];
}

export function formatPlanPrice(plan: Exclude<Plan, "free">, country: string): string {
  const currency = currencyForCountry(country);
  const major = PLAN_PRICES_BY_CURRENCY[currency][plan];
  const locale = currency === "INR" ? "en-IN" : "en-US";
  // List prices are whole units; avoid "$9.00" / "₹749.00".
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(major);
}

/** Detect visitor country from CDN headers; default US. */
export function detectCountryFromHeaders(getHeader: (name: string) => string | null): string {
  const raw =
    getHeader("x-vercel-ip-country") ||
    getHeader("cf-ipcountry") ||
    getHeader("x-country-code") ||
    null;
  return normalizeCountry(raw || "US");
}

/**
 * Resolve display/checkout country: cookie wins when valid, else geo headers, else US.
 */
export function resolveVisitorCountry(input: {
  cookie?: string | null;
  getHeader: (name: string) => string | null;
}): string {
  if (input.cookie) {
    const fromCookie = input.cookie.trim().toUpperCase();
    if (KNOWN_CODES.has(fromCookie)) return fromCookie;
  }
  return detectCountryFromHeaders(input.getHeader);
}

export function countrySelectValue(country: string): string {
  const n = normalizeCountry(country);
  return KNOWN_CODES.has(n) ? n : "OTHER";
}
