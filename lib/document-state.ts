import type { DocStatus } from "@/lib/types";

export function isExpired(expiresAt: string | null, now = new Date()): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function effectiveStatus(
  status: DocStatus,
  expiresAt: string | null,
  now = new Date(),
): DocStatus {
  if (status === "sent" || status === "viewed") {
    if (isExpired(expiresAt, now)) return "expired";
  }
  return status;
}

export function canSign(status: DocStatus, expiresAt: string | null, now = new Date()): { ok: true } | { ok: false; reason: string } {
  const current = effectiveStatus(status, expiresAt, now);
  if (current === "draft") return { ok: false, reason: "This document has not been sent." };
  if (current === "void") return { ok: false, reason: "This document was voided." };
  if (current === "expired") return { ok: false, reason: "This document has expired." };
  if (current === "signed" || current === "payment_sent" || current === "paid") {
    return { ok: false, reason: "This document is already signed." };
  }
  return { ok: true };
}

/** Client may claim they paid when status is signed (not yet claimed). */
export function canClaimPayment(status: DocStatus, expiresAt: string | null, now = new Date()): { ok: true } | { ok: false; reason: string } {
  const current = effectiveStatus(status, expiresAt, now);
  if (current === "paid") return { ok: false, reason: "Already marked paid." };
  if (current === "payment_sent") return { ok: false, reason: "Payment claim already recorded." };
  if (current !== "signed") return { ok: false, reason: "Sign before paying." };
  return { ok: true };
}

/** @deprecated Prefer canClaimPayment — same gate for client pay panel. */
export function canPay(status: DocStatus, expiresAt: string | null, now = new Date()) {
  return canClaimPayment(status, expiresAt, now);
}

export function canConfirmPayment(status: DocStatus): boolean {
  return status === "signed" || status === "payment_sent";
}

export function canRejectPaymentClaim(status: DocStatus): boolean {
  return status === "payment_sent";
}

export function canEdit(status: DocStatus): boolean {
  return status === "draft" || status === "sent" || status === "viewed";
}

export function canSoftDelete(status: DocStatus): boolean {
  return status === "draft" || status === "void" || status === "expired";
}

export function publicReadable(status: DocStatus): boolean {
  return status !== "draft";
}

export const LOCKED_STATUSES: DocStatus[] = ["signed", "payment_sent", "paid"];

export function statusLabel(status: DocStatus): string {
  if (status === "payment_sent") return "Awaiting confirmation";
  return status;
}

/** Allowed DB status transitions for locked docs (mirrors migration 0004). */
export function allowedLockedTransition(from: DocStatus, to: DocStatus): boolean {
  if (from === to) return true;
  if (from === "signed" && (to === "payment_sent" || to === "paid")) return true;
  if (from === "payment_sent" && (to === "paid" || to === "signed")) return true;
  return false;
}
