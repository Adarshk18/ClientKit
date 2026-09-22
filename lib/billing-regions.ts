import type { Plan } from "@/lib/types";

export type BillingCurrency =
  | "USD"
  | "INR"
  | "GBP"
  | "EUR"
  | "CAD"
  | "AUD"
  | "SGD"
  | "AED"
  | "NZD";

export type CountryOption = {
  code: string;
  label: string;
  currency: BillingCurrency;
};

/** Countries shown in the pricing / checkout dropdown. */
export const BILLING_COUNTRIES: CountryOption[] = [
  { code: "IN", label: "India", currency: "INR" },
  { code: "US", label: "United States", currency: "USD" },
  { code: "GB", label: "United Kingdom", currency: "GBP" },
  { code: "CA", label: "Canada", currency: "CAD" },
  { code: "AU", label: "Australia", currency: "AUD" },
  { code: "SG", label: "Singapore", currency: "SGD" },
  { code: "AE", label: "United Arab Emirates", currency: "AED" },
  { code: "DE", label: "Germany", currency: "EUR" },
  { code: "FR", label: "France", currency: "EUR" },
  { code: "NL", label: "Netherlands", currency: "EUR" },
  { code: "IE", label: "Ireland", currency: "EUR" },
  { code: "NZ", label: "New Zealand", currency: "NZD" },
  { code: "OTHER", label: "Other", currency: "USD" },
];

const BY_CODE = Object.fromEntries(BILLING_COUNTRIES.map((c) => [c.code, c])) as Record<
  string,
  CountryOption
>;
const KNOWN_CODES = new Set(BILLING_COUNTRIES.map((c) => c.code));

/** Fixed list prices by billing currency (major units). Do not invent live FX. */
export const PLAN_PRICES_BY_CURRENCY: Record<
  BillingCurrency,
  Record<Exclude<Plan, "free">, number>
> = {
  USD: { founder: 9, solo: 12, busy: 29 },
  INR: { founder: 749, solo: 999, busy: 2499 },
  GBP: { founder: 7, solo: 9, busy: 22 },
  EUR: { founder: 8, solo: 11, busy: 27 },
  CAD: { founder: 12, solo: 16, busy: 39 },
  AUD: { founder: 14, solo: 18, busy: 45 },
  SGD: { founder: 12, solo: 16, busy: 39 },
  AED: { founder: 33, solo: 44, busy: 107 },
  NZD: { founder: 15, solo: 20, busy: 48 },
};

const LOCALE_FOR_CURRENCY: Record<BillingCurrency, string> = {
  USD: "en-US",
  INR: "en-IN",
  GBP: "en-GB",
  EUR: "en-IE",
  CAD: "en-CA",
  AUD: "en-AU",
  SGD: "en-SG",
  AED: "en-AE",
  NZD: "en-NZ",
};

export const COUNTRY_COOKIE = "ck_country";
export const COUNTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function normalizeCountry(raw: string | null | undefined): string {
  if (!raw) return "US";
  const code = raw.trim().toUpperCase();
  if (!code || code === "XX" || code === "T1") return "US";
  if (KNOWN_CODES.has(code)) return code;
  return "OTHER";
}

/** Country code stored on the workspace / sent to Dodo (never OTHER). */
export function workspaceCountry(country: string): string {
  const n = normalizeCountry(country);
  return n === "OTHER" ? "US" : n;
}

export function currencyForCountry(country: string): BillingCurrency {
  const code = normalizeCountry(country);
  return BY_CODE[code]?.currency ?? "USD";
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
  const locale = LOCALE_FOR_CURRENCY[currency];
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
