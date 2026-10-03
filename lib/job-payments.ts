import type { DocStatus } from "@/lib/types";

/**
 * How a job is paid, worked out from fields that already exist plus advance_paid_at.
 *
 * - "single": one payment (the job pays in full, 0% or 100% advance). Works exactly as it always did.
 * - "advance": the job has an advance and a balance, and the advance is not confirmed yet.
 * - "balance": the freelancer confirmed the advance. The balance is next.
 * - "settled": status is paid.
 */
export type PaymentStage = "single" | "advance" | "balance" | "settled";

export type PaymentFields = {
  status: DocStatus;
  subtotal: number;
  amount_due: number;
  remainder_amount: number;
  advance_paid_at: string | null;
};

/** True when the job splits into an advance now and a balance later. */
export function hasBalanceStage(doc: Pick<PaymentFields, "amount_due" | "remainder_amount">): boolean {
  return doc.amount_due > 0 && doc.remainder_amount > 0;
}

export function paymentStage(doc: PaymentFields): PaymentStage {
  if (doc.status === "paid") return "settled";
  if (!hasBalanceStage(doc)) return "single";
  return doc.advance_paid_at ? "balance" : "advance";
}

/** The amount the client is asked to pay right now. */
export function stageAmount(doc: PaymentFields): number {
  const stage = paymentStage(doc);
  if (stage === "balance") return doc.remainder_amount;
  if (stage === "settled") return 0;
  return doc.amount_due;
}

/**
 * Money Client Kit knows was confirmed by the freelancer.
 * A job that was marked paid before the balance step existed (advance_paid_at is null but a balance remains)
 * counts only the advance, as it always did.
 */
export function amountConfirmed(doc: PaymentFields): number {
  if (!hasBalanceStage(doc)) return doc.status === "paid" ? doc.amount_due : 0;
  if (doc.status === "paid") return doc.advance_paid_at ? doc.subtotal : doc.amount_due;
  return doc.advance_paid_at ? doc.amount_due : 0;
}

/** What the client still owes on this job, as far as Client Kit tracks it. */
export function balanceOutstanding(doc: PaymentFields): number {
  return Math.max(0, doc.subtotal - amountConfirmed(doc));
}

/** "yes" / "no" / "none" for the advance column: none means the job pays in full in one go. */
export function advanceState(doc: PaymentFields): "yes" | "no" | "none" {
  if (!hasBalanceStage(doc)) return "none";
  if (doc.advance_paid_at || doc.status === "paid") return "yes";
  return "no";
}
