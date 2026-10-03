const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

export function minorDigits(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
}

export function toMinorUnits(major: number, currency: string): number {
  const digits = minorDigits(currency);
  const factor = 10 ** digits;
  return Math.round(major * factor);
}

export function fromMinorUnits(minor: number, currency: string): number {
  const digits = minorDigits(currency);
  const factor = 10 ** digits;
  return minor / factor;
}

export function formatMoney(minor: number, currency: string, locale = "en"): string {
  const digits = minorDigits(currency);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fromMinorUnits(minor, currency));
}

export function computeAmounts(
  lineItems: { qty: number; unit_amount: number }[],
  depositPercent: number,
): {
  subtotal: number;
  deposit_percent: number;
  deposit_amount: number;
  amount_due: number;
  remainder_amount: number;
} {
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = Number(item.qty);
    if (!Number.isFinite(qty) || qty < 0) return sum;
    return sum + Math.round(qty * item.unit_amount);
  }, 0);

  const pct = Math.min(100, Math.max(0, Math.round(Number.isFinite(depositPercent) ? depositPercent : 0)));
  // 0% and 100% both mean pay in full on this page. Any other percent is the advance paid after signing.
  // The balance is subtotal minus the advance, so the two always add up to the subtotal exactly.
  // If rounding makes the advance 0 or the whole amount, there is no real split, so it is a single payment.
  const advance = Math.round((subtotal * pct) / 100);
  const payFull = pct === 0 || pct === 100 || advance <= 0 || advance >= subtotal;
  const deposit_amount = payFull ? subtotal : advance;
  const remainder_amount = subtotal - deposit_amount;

  return {
    subtotal,
    deposit_percent: payFull ? (pct === 100 ? 100 : 0) : pct,
    deposit_amount,
    amount_due: deposit_amount,
    remainder_amount,
  };
}

export function parseMajorAmount(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
