import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/admin-emails";
import {
  DEMO_OWNER_EMAIL,
  founderIpsFromAnalytics,
  hasInternalDeviceCookie,
  isInternalEmail,
  shouldExcludeAnalyticsEvent,
  shouldRotateDemoDocument,
} from "@/lib/internal";

describe("isInternalEmail", () => {
  it("treats demo and admin emails as internal", () => {
    const prev = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "dev.adarsh286@gmail.com";
    expect(isInternalEmail(DEMO_OWNER_EMAIL)).toBe(true);
    expect(isInternalEmail("seed@clientkit.dev")).toBe(true);
    expect(isInternalEmail("dev.adarsh286@gmail.com")).toBe(true);
    expect(isInternalEmail("DEV.ADARSH286@GMAIL.COM")).toBe(true);
    expect(isInternalEmail("customer@studio.test")).toBe(false);
    expect(isInternalEmail(null)).toBe(false);
    expect(isAdminEmail("dev.adarsh286@gmail.com")).toBe(true);
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });
});

describe("hasInternalDeviceCookie", () => {
  it("detects ck_internal=1 in a cookie header", () => {
    expect(hasInternalDeviceCookie("ck_internal=1")).toBe(true);
    expect(hasInternalDeviceCookie("foo=bar; ck_internal=1; baz=1")).toBe(true);
    expect(hasInternalDeviceCookie("ck_internal=0")).toBe(false);
    expect(hasInternalDeviceCookie("not_ck_internal=1")).toBe(false);
    expect(hasInternalDeviceCookie("")).toBe(false);
    expect(hasInternalDeviceCookie(null)).toBe(false);
  });
});

describe("shouldRotateDemoDocument", () => {
  const now = new Date("2026-09-25T12:00:00.000Z");

  it("leaves unsigned demos in place", () => {
    expect(
      shouldRotateDemoDocument({
        status: "sent",
        documentId: "d1",
        keepDocumentId: null,
        signedAt: null,
        now,
      }),
    ).toBe(false);
    expect(
      shouldRotateDemoDocument({
        status: "viewed",
        documentId: "d1",
        keepDocumentId: null,
        signedAt: null,
        now,
      }),
    ).toBe(false);
  });

  it("keeps the signed copy for the visitor who just signed", () => {
    expect(
      shouldRotateDemoDocument({
        status: "signed",
        documentId: "d1",
        keepDocumentId: "d1",
        signedAt: "2026-09-22T02:55:24.000Z",
        now,
      }),
    ).toBe(false);
  });

  it("rotates a used demo for a new visitor", () => {
    expect(
      shouldRotateDemoDocument({
        status: "signed",
        documentId: "d1",
        keepDocumentId: null,
        signedAt: "2026-09-22T02:55:24.000Z",
        now,
      }),
    ).toBe(true);
    expect(
      shouldRotateDemoDocument({
        status: "payment_sent",
        documentId: "d1",
        keepDocumentId: "other",
        signedAt: "2026-09-22T02:55:24.000Z",
        now,
      }),
    ).toBe(true);
  });

  it("rotates a locked demo for a visitor with no cookie", () => {
    expect(
      shouldRotateDemoDocument({
        status: "signed",
        documentId: "d1",
        keepDocumentId: null,
        signedAt: "2026-09-25T11:59:00.000Z",
        now,
      }),
    ).toBe(true);
  });
});

describe("analytics exclusion", () => {
  const internal = new Set(["ws-demo"]);

  it("collects IPs from internal workspaces and drops matching anonymous traffic", () => {
    const rows = [
      { workspace_id: "ws-demo", ip: "1.1.1.1" },
      { workspace_id: "ws-real", ip: "8.8.8.8" },
      { workspace_id: null, ip: "1.1.1.1" },
      { workspace_id: null, ip: "9.9.9.9" },
    ];
    const ips = founderIpsFromAnalytics(rows, internal);
    expect([...ips]).toEqual(["1.1.1.1"]);
    expect(shouldExcludeAnalyticsEvent(rows[0]!, internal, ips)).toBe(true);
    expect(shouldExcludeAnalyticsEvent(rows[1]!, internal, ips)).toBe(false);
    expect(shouldExcludeAnalyticsEvent(rows[2]!, internal, ips)).toBe(true);
    expect(shouldExcludeAnalyticsEvent(rows[3]!, internal, ips)).toBe(false);
  });
});
