import { firstName } from "@/lib/followups";

export { firstName };

export const TOOL_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"] as const;
export type ToolCurrency = (typeof TOOL_CURRENCIES)[number];

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
