import { describe, expect, it } from "vitest";
import {
  allowedLockedTransition,
  canClaimPayment,
  canConfirmPayment,
  canRejectPaymentClaim,
  canSign,
  statusLabel,
} from "@/lib/document-state";

describe("payment claim gates", () => {
  it("allows claim only from signed", () => {
    expect(canClaimPayment("signed", null).ok).toBe(true);
    expect(canClaimPayment("payment_sent", null).ok).toBe(false);
    expect(canClaimPayment("paid", null).ok).toBe(false);
    expect(canClaimPayment("sent", null).ok).toBe(false);
  });

  it("allows confirm from signed or payment_sent", () => {
    expect(canConfirmPayment("signed")).toBe(true);
    expect(canConfirmPayment("payment_sent")).toBe(true);
    expect(canConfirmPayment("paid")).toBe(false);
    expect(canConfirmPayment("sent")).toBe(false);
  });

  it("allows reject only from payment_sent", () => {
    expect(canRejectPaymentClaim("payment_sent")).toBe(true);
    expect(canRejectPaymentClaim("signed")).toBe(false);
    expect(canRejectPaymentClaim("paid")).toBe(false);
  });

  it("treats payment_sent as already signed for canSign", () => {
    expect(canSign("payment_sent", null).ok).toBe(false);
  });
});

describe("locked status transitions", () => {
  it("allows signed → payment_sent → paid and reject back to signed", () => {
    expect(allowedLockedTransition("signed", "payment_sent")).toBe(true);
    expect(allowedLockedTransition("payment_sent", "paid")).toBe(true);
    expect(allowedLockedTransition("signed", "paid")).toBe(true);
    expect(allowedLockedTransition("payment_sent", "signed")).toBe(true);
  });

  it("blocks regressions to draft/sent/void", () => {
    expect(allowedLockedTransition("signed", "draft")).toBe(false);
    expect(allowedLockedTransition("signed", "sent")).toBe(false);
    expect(allowedLockedTransition("payment_sent", "void")).toBe(false);
    expect(allowedLockedTransition("paid", "signed")).toBe(false);
    expect(allowedLockedTransition("paid", "payment_sent")).toBe(false);
  });
});

describe("statusLabel", () => {
  it("shows awaiting confirmation for payment_sent", () => {
    expect(statusLabel("payment_sent")).toBe("Awaiting confirmation");
    expect(statusLabel("signed")).toBe("signed");
  });
});
