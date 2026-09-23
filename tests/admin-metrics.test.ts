import { describe, expect, it } from "vitest";
import {
  bucketByDay,
  buildDailySignups,
  estimateActiveMinutes,
  estimateMrr,
  formatActiveMinutes,
  istDayKey,
  istDayKeys,
} from "@/lib/admin-metrics";
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

describe("istDayKey", () => {
  it("maps UTC timestamps to Asia/Calcutta calendar days", () => {
    // 2026-09-21 20:30 UTC = 2026-09-22 02:00 IST
    expect(istDayKey("2026-09-21T20:30:00.000Z")).toBe("2026-09-22");
    // 2026-09-21 18:00 UTC = 2026-09-21 23:30 IST
    expect(istDayKey("2026-09-21T18:00:00.000Z")).toBe("2026-09-21");
  });
});

describe("istDayKeys", () => {
  it("returns newest-first civil days in IST", () => {
    const now = new Date("2026-09-22T06:00:00.000Z"); // 11:30 IST on Sep 22
    const keys = istDayKeys(3, now);
    expect(keys).toEqual(["2026-09-22", "2026-09-21", "2026-09-20"]);
  });
});

describe("estimateActiveMinutes", () => {
  it("returns 0 for no timestamps and 1 for a single stamp", () => {
    expect(estimateActiveMinutes([])).toBe(0);
    expect(estimateActiveMinutes([null, undefined])).toBe(0);
    expect(estimateActiveMinutes(["2026-09-22T10:00:00.000Z"])).toBe(1);
  });

  it("sums gaps capped at 5 minutes", () => {
    // 3 min + 10 min (capped to 5) + 2 min = 10
    const stamps = [
      "2026-09-22T10:00:00.000Z",
      "2026-09-22T10:03:00.000Z",
      "2026-09-22T10:13:00.000Z",
      "2026-09-22T10:15:00.000Z",
    ];
    expect(estimateActiveMinutes(stamps)).toBe(10);
  });

  it("dedupes identical timestamps", () => {
    expect(
      estimateActiveMinutes([
        "2026-09-22T10:00:00.000Z",
        "2026-09-22T10:00:00.000Z",
        "2026-09-22T10:04:00.000Z",
      ]),
    ).toBe(4);
  });
});

describe("formatActiveMinutes", () => {
  it("formats minutes and hours", () => {
    expect(formatActiveMinutes(0)).toBe("0m");
    expect(formatActiveMinutes(12)).toBe("12m");
    expect(formatActiveMinutes(60)).toBe("1h");
    expect(formatActiveMinutes(65)).toBe("1h 5m");
  });
});

describe("buildDailySignups", () => {
  it("groups workspaces by IST signup day and estimates activity", () => {
    const dayKeys = ["2026-09-22", "2026-09-21"];
    const daily = buildDailySignups({
      workspaces: [
        {
          id: "w1",
          name: "Acme",
          plan: "free",
          created_at: "2026-09-21T20:30:00.000Z", // IST Sep 22
          owner_id: "u1",
        },
        {
          id: "w2",
          name: "Beta",
          plan: "solo",
          created_at: "2026-09-21T10:00:00.000Z", // IST Sep 21
          owner_id: "u2",
        },
      ],
      docs: [
        {
          id: "d1",
          title: "Proposal",
          status: "draft",
          public_id: "pub1",
          workspace_id: "w1",
          signed_at: null,
          paid_at: null,
          sent_at: null,
          created_at: "2026-09-21T21:00:00.000Z",
          updated_at: "2026-09-21T21:10:00.000Z",
          deleted_at: null,
        },
      ],
      analytics: [
        {
          id: "a1",
          name: "session_ping",
          path: "/dashboard",
          created_at: "2026-09-21T21:05:00.000Z",
          workspace_id: "w1",
        },
      ],
      emails: new Map([
        ["u1", "a@example.com"],
        ["u2", null],
      ]),
      dayKeys,
    });

    expect(daily).toHaveLength(2);
    expect(daily[0]?.day).toBe("2026-09-22");
    expect(daily[0]?.accounts[0]?.email).toBe("a@example.com");
    expect(daily[0]?.accounts[0]?.activeMinutes).toBeGreaterThan(0);
    expect(daily[0]?.accounts[0]?.actionCount).toBeGreaterThan(0);
    expect(daily[1]?.day).toBe("2026-09-21");
    expect(daily[1]?.accounts[0]?.email).toBeNull();
    expect(daily[1]?.accounts[0]?.activeMinutes).toBe(0);
  });
});

describe("isAnalyticsEventName", () => {
  it("allowlists known names including session_ping and rejects others", () => {
    expect(isAnalyticsEventName("page_view")).toBe(true);
    expect(isAnalyticsEventName("cta_click")).toBe(true);
    expect(isAnalyticsEventName("session_ping")).toBe(true);
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
