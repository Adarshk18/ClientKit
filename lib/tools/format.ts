/**
 * The name to use after "Hi" or "Dear". A title keeps the surname with it ("Mr. Rao" stays "Mr. Rao"),
 * a lone title is dropped, and an empty name becomes "there".
 */
export function firstName(full: string): string {
  const words = (full ?? "").trim().split(/\s+/).filter(Boolean);
  const isTitle = (w: string) => /^(mr|mrs|ms|miss|dr|prof|shri|smt|sri)\.?$/i.test(w);
  while (words.length && isTitle(words[0]!) && words.length === 1) words.shift();
  if (!words.length) return "there";
  if (isTitle(words[0]!)) return `${capitalize(words[0]!.toLowerCase().replace(/\.?$/, "."))} ${words[1]}`;
  return words[0]!;
}

export const TOOL_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"] as const;
export type ToolCurrency = (typeof TOOL_CURRENCIES)[number];

/** Rough rupees per unit of each currency, only used to pick a believable example amount. Not an exchange rate service. */
const EXAMPLE_INR_PER_UNIT: Record<string, number> = { INR: 1, USD: 83, EUR: 90, GBP: 105, AED: 23, AUD: 55, CAD: 61, SGD: 62 };

/**
 * The example amount is written in rupees (60000). When the visitor is outside India and the currency switches,
 * 60000 dollars would read as a fake figure, so we show a similar-sized job: 60000 INR becomes about 700 USD.
 */
export function exampleAmountFor(inrAmount: number, currency: string): number {
  const rate = EXAMPLE_INR_PER_UNIT[currency] ?? 1;
  const raw = inrAmount / rate;
  if (currency === "INR" || !Number.isFinite(raw) || raw <= 0) return inrAmount;
  const step = raw >= 200 ? 50 : 10;
  return Math.max(step, Math.round(raw / step) * step);
}

/** "₹60,000", "$1,200.50". Whole amounts drop the decimals. INR uses Indian digit grouping. */
export function moneyText(amount: number, currency: string): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const whole = Math.abs(safe - Math.round(safe)) < 0.005;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(whole ? Math.round(safe) : safe);
}

/** Round to 2 decimals without float drift. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Trim, collapse spaces, and drop a trailing full stop so we can add our own. */
export function tidy(text: string | undefined | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
}

export function sentence(text: string): string {
  const t = tidy(text);
  if (!t) return "";
  return /[?!]$/.test(t) ? t : `${t}.`;
}

export function capitalize(text: string): string {
  return text ? text[0]!.toUpperCase() + text.slice(1) : text;
}

export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "a few days", "about a week", "about two weeks". Used only to word the message. */
export function daysPhrase(days: number): string {
  if (!Number.isFinite(days) || days <= 0) return "a little while";
  if (days <= 3) return "a couple of days";
  if (days <= 6) return "a few days";
  if (days <= 10) return "about a week";
  if (days <= 17) return "about two weeks";
  if (days <= 24) return "about three weeks";
  return "a few weeks";
}
