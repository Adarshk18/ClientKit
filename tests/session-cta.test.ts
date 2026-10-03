import { describe, expect, it, vi } from "vitest";
import { checkSession, hasAuthCookieHint, pickCta, SESSION_ENDPOINT } from "@/lib/session-cta";
import { isProtectedPath } from "@/lib/supabase/middleware";

const out = { href: "/signup", label: "Start free" };
const inn = { href: "/jobs", label: "Go to dashboard" };

describe("hasAuthCookieHint", () => {
  it("sees a Supabase auth cookie, chunked or not", () => {
    expect(hasAuthCookieHint("a=1; sb-abcd-auth-token=xyz")).toBe(true);
    expect(hasAuthCookieHint("sb-abcd-auth-token.0=xyz; sb-abcd-auth-token.1=rest")).toBe(true);
  });
  it("ignores other cookies and empty input", () => {
    expect(hasAuthCookieHint("")).toBe(false);
    expect(hasAuthCookieHint(null)).toBe(false);
    expect(hasAuthCookieHint("ck_internal=1; theme=dark")).toBe(false);
    expect(hasAuthCookieHint("sb-abcd-auth-token-code-verifier=zzz")).toBe(false);
  });
});

describe("pickCta", () => {
  it("keeps the signed-out CTA until the visitor is known to be signed in", () => {
    expect(pickCta("unknown", out, inn)).toBe(out);
    expect(pickCta("signed-out", out, inn)).toBe(out);
    expect(pickCta("signed-in", out, inn)).toBe(inn);
  });
});

describe("checkSession", () => {
  const cookie = "sb-abcd-auth-token=xyz";
  const reply = (body: unknown, ok = true) => vi.fn().mockResolvedValue({ ok, json: async () => body });

  it("skips the network call when there is no session cookie", async () => {
    const fetchImpl = reply({ signedIn: true });
    expect(await checkSession({ cookie: "a=1", fetchImpl })).toBe("signed-out");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("returns signed-in only for signedIn: true", async () => {
    const fetchImpl = reply({ signedIn: true });
    expect(await checkSession({ cookie, fetchImpl })).toBe("signed-in");
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(SESSION_ENDPOINT);
    expect(await checkSession({ cookie, fetchImpl: reply({ signedIn: false }) })).toBe("signed-out");
    expect(await checkSession({ cookie, fetchImpl: reply({ signedIn: "yes" }) })).toBe("signed-out");
    expect(await checkSession({ cookie, fetchImpl: reply(null) })).toBe("signed-out");
  });
  it("falls back to signed-out on HTTP errors, network errors and timeouts", async () => {
    expect(await checkSession({ cookie, fetchImpl: reply({ signedIn: true }, false) })).toBe("signed-out");
    expect(await checkSession({ cookie, fetchImpl: vi.fn().mockRejectedValue(new Error("offline")) })).toBe("signed-out");
    const hang = vi.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise<never>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    expect(await checkSession({ cookie, fetchImpl: hang, timeoutMs: 10 })).toBe("signed-out");
  });
});

describe("session endpoint", () => {
  it("is reachable without a session so signed-out visitors get a plain answer", () => {
    expect(isProtectedPath("/api/session")).toBe(false);
    expect(isProtectedPath("/api/admin/export")).toBe(true);
  });
});
