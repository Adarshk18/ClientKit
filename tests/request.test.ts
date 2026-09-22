import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-path";

describe("safeNextPath", () => {
  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/jobs")).toBe("/jobs");
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/settings/billing?checkout=return")).toBe(
      "/settings/billing?checkout=return",
    );
  });

  it("rejects open redirects", () => {
    expect(safeNextPath("//evil.example")).toBe("/jobs");
    expect(safeNextPath("/" + String.fromCharCode(92) + "evil.example")).toBe("/jobs");
    expect(safeNextPath("https://evil.example")).toBe("/jobs");
    expect(safeNextPath("/jobs/" + String.fromCharCode(92) + "@evil")).toBe("/jobs");
  });
});
