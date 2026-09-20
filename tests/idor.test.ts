import { describe, expect, it } from "vitest";
import { assertWorkspaceOwns } from "@/lib/workspace";

describe("IDOR guard", () => {
  it("throws Not found when workspace ids differ", () => {
    expect(() => assertWorkspaceOwns("ws_a", "ws_b")).toThrow("Not found");
  });

  it("allows the matching workspace", () => {
    expect(() => assertWorkspaceOwns("ws_a", "ws_a")).not.toThrow();
  });
});
