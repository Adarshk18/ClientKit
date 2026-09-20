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
  if (current === "signed" || current === "paid") {
    return { ok: false, reason: "This document is already signed." };
  }
  return { ok: true };
}

export function canPay(status: DocStatus, expiresAt: string | null, now = new Date()): { ok: true } | { ok: false; reason: string } {
  const current = effectiveStatus(status, expiresAt, now);
  if (current === "paid") return { ok: false, reason: "Already marked paid." };
  if (current !== "signed") return { ok: false, reason: "Sign before paying." };
  return { ok: true };
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

export const LOCKED_STATUSES: DocStatus[] = ["signed", "paid"];
