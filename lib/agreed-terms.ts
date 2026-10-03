import type { FrozenPayload } from "@/lib/types";

/**
 * A short, readable copy of what the client agreed to, saved next to the signature.
 * The full signed content (and its hash) is in the frozen payload. This is the quick view for support.
 */
export type AgreedTerms = {
  currency: string;
  subtotal: number;
  /** Advance percent after signing. 0 when the job is paid in one go. */
  advance_percent: number;
  advance_amount: number;
  balance_amount: number;
  /** Present only when the proposal had a revision clause. */
  revisions?: { included: number; extra_price: number | null };
};

export function buildAgreedTerms(payload: FrozenPayload): AgreedTerms {
  const split = payload.remainder_amount > 0 && payload.amount_due > 0;
  return {
    currency: payload.currency,
    subtotal: payload.subtotal,
    advance_percent: split ? payload.deposit_percent : 0,
    advance_amount: payload.amount_due,
    balance_amount: payload.remainder_amount,
    ...(payload.revisions ? { revisions: payload.revisions } : {}),
  };
}
