import { describe, expect, it } from "vitest";
import { bucketByDay, estimateMrr } from "@/lib/admin-metrics";
import { isAnalyticsEventName } from "@/lib/analytics-events";
import { isAdminEmail } from "@/lib/admin";

describe("estimateMrr", () => {
  it("sums founder*9 + solo*12 + busy*29", () => {
    expect(estimateMrr({ founder: 2, solo: 1, busy: 1 })).toBe(2 * 9 + 12 + 29);
    expect(estimateMrr({ founder: 0, solo: 0, busy: 0 })).toBe(0);
  });
});

describe("bucketByDay", () => {
  it("buckets events into UTC days", () => {
    const now = new Date("2026-09-22T12:00:00.000Z");
    const rows = [
      { created_at: "2026-09-22T01:00:00.000Z", name: "page_view" },
      { created_at: "2026-09-22T02:00:00.000Z", name: "cta_click" },
      { created_at: "2026-09-21T23:00:00.000Z", name: "page_view" },
    ];
    const buckets = bucketByDay(rows, ["page_view", "cta_click"], 3, now);
    expect(buckets).toHaveLength(3);
    const day22 = buckets.find((b) => b.day === "2026-09-22");
    const day21 = buckets.find((b) => b.day === "2026-09-21");
    expect(day22?.counts.page_view).toBe(1);
    expect(day22?.counts.cta_click).toBe(1);
    expect(day21?.counts.page_view).toBe(1);
  });
});

describe("isAnalyticsEventName", () => {
  it("allowlists known names and rejects others", () => {
    expect(isAnalyticsEventName("page_view")).toBe(true);
    expect(isAnalyticsEventName("cta_click")).toBe(true);
    expect(isAnalyticsEventName("hack")).toBe(false);
  });
});

describe("isAdminEmail", () => {
  it("matches case-insensitively against ADMIN_EMAILS", () => {
    const prev = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "Owner@Example.com, other@x.test";
    expect(isAdminEmail("owner@example.com")).toBe(true);
    expect(isAdminEmail("other@x.test")).toBe(true);
    expect(isAdminEmail("nope@x.test")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });
});
