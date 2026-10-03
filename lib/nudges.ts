import { effectiveStatus } from "@/lib/document-state";
import { paymentStage } from "@/lib/job-payments";
import type { DocStatus } from "@/lib/types";

/** A sent proposal that nobody has opened or signed for this many days needs a nudge. */
export const NUDGE_DAYS = 2;
/** After the client signs we give them a day to pay before suggesting a follow-up. */
export const UNPAID_GRACE_DAYS = 1;

const DAY_MS = 24 * 60 * 60 * 1000;

export type NudgeReason =
  | "awaiting_confirmation"
  | "balance_overdue"
  | "advance_unpaid"
  | "payment_unpaid"
  | "not_signed"
  | "not_viewed";

export type NudgeDoc = {
  status: DocStatus;
  expires_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  payment_claimed_at: string | null;
  subtotal: number;
  amount_due: number;
  remainder_amount: number;
  advance_paid_at: string | null;
  balance_due_at: string | null;
  last_nudged_at: string | null;
  nudge_count: number;
  deleted_at?: string | null;
};

export type Nudge = {
  reason: NudgeReason;
  /** When the wait started (sent, signed, due date, or claim time). */
  since: string;
  daysWaiting: number;
  /** 1 = polite first message, 2 = firmer second message. */
  step: 1 | 2;
};

function ms(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Whole days between two instants, never negative. */
function wholeDays(from: number, to: number): number {
  return Math.max(0, Math.floor((to - from) / DAY_MS));
}

/**
 * Does this job need a follow-up today? Returns why, or null.
 * A job the freelancer already followed up on stays out of the list for NUDGE_DAYS days.
 * "Awaiting confirmation" is the freelancer's own task, so it is never hidden by that rule.
 */
export function nudgeFor(doc: NudgeDoc, now = new Date()): Nudge | null {
  if (doc.deleted_at) return null;
  const nowMs = now.getTime();
  const status = effectiveStatus(doc.status, doc.expires_at, now);
  const step: 1 | 2 = doc.nudge_count >= 1 ? 2 : 1;

  if (status === "payment_sent") {
    const since = doc.payment_claimed_at ?? doc.signed_at ?? doc.sent_at;
    const sinceMs = ms(since) ?? nowMs;
    return {
      reason: "awaiting_confirmation",
      since: new Date(sinceMs).toISOString(),
      daysWaiting: wholeDays(sinceMs, nowMs),
      step,
    };
  }

  const nudgedMs = ms(doc.last_nudged_at);
  if (nudgedMs !== null && nowMs - nudgedMs < NUDGE_DAYS * DAY_MS) return null;

  if (status === "sent" || status === "viewed") {
    const sentMs = ms(doc.sent_at);
    if (sentMs === null) return null;
    if (nowMs - sentMs < NUDGE_DAYS * DAY_MS) return null;
    return {
      reason: status === "sent" ? "not_viewed" : "not_signed",
      since: new Date(sentMs).toISOString(),
      daysWaiting: wholeDays(sentMs, nowMs),
      step,
    };
  }

  if (status === "signed") {
    const stage = paymentStage({ ...doc, status });
    if (stage === "balance") {
      const dueMs = ms(doc.balance_due_at);
      if (dueMs === null || dueMs > nowMs) return null;
      return {
        reason: "balance_overdue",
        since: new Date(dueMs).toISOString(),
        daysWaiting: wholeDays(dueMs, nowMs),
        step,
      };
    }
    const signedMs = ms(doc.signed_at);
    if (signedMs === null) return null;
    if (nowMs - signedMs < UNPAID_GRACE_DAYS * DAY_MS) return null;
    return {
      reason: stage === "advance" ? "advance_unpaid" : "payment_unpaid",
      since: new Date(signedMs).toISOString(),
      daysWaiting: wholeDays(signedMs, nowMs),
      step,
    };
  }

  return null;
}

const ORDER: NudgeReason[] = [
  "awaiting_confirmation",
  "balance_overdue",
  "advance_unpaid",
  "payment_unpaid",
  "not_signed",
  "not_viewed",
];

/** Most urgent first, then the longest wait. */
export function compareNudges(a: Nudge, b: Nudge): number {
  const byReason = ORDER.indexOf(a.reason) - ORDER.indexOf(b.reason);
  if (byReason !== 0) return byReason;
  return b.daysWaiting - a.daysWaiting;
}

export function nudgeReasonLabel(reason: NudgeReason): string {
  switch (reason) {
    case "awaiting_confirmation":
      return "Client says they paid. Confirm it";
    case "balance_overdue":
      return "Balance is past its date";
    case "advance_unpaid":
      return "Signed, advance not paid";
    case "payment_unpaid":
      return "Signed, payment not received";
    case "not_signed":
      return "Opened, not signed yet";
    case "not_viewed":
      return "Not opened yet";
  }
}
