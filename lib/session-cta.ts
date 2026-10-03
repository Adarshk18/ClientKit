/**
 * Pure helpers for the session-aware marketing CTAs. No "use client" here so tests and server code can import it.
 *
 * Marketing pages are static: the server HTML is always the signed-out version. After load the browser asks
 * /api/session whether the visitor is signed in, and the CTAs swap. Any error means signed out.
 */

export type SessionStatus = "unknown" | "signed-in" | "signed-out";

/** Where a signed-in visitor goes from marketing pages. */
export const DASHBOARD_HREF = "/jobs";
export const SESSION_ENDPOINT = "/api/session";
export const SESSION_TIMEOUT_MS = 2500;

export type CtaTarget = { href: string; label: string };

/**
 * Supabase keeps the session in cookies named sb-<project>-auth-token (or sb-<project>-auth-token.0, .1 when
 * chunked). No such cookie means the visitor is certainly signed out, so we skip the network call.
 */
export const AUTH_COOKIE_PATTERN = "(?:^|;\\s*)sb-[^=;]*-auth-token(?:\\.\\d+)?=";

export function hasAuthCookieHint(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  return new RegExp(AUTH_COOKIE_PATTERN).test(cookieHeader);
}

/** Signed-in swaps in the signed-in target. Unknown and signed-out always keep the server-rendered one. */
export function pickCta<T>(status: SessionStatus, signedOut: T, signedIn: T): T {
  return status === "signed-in" ? signedIn : signedOut;
}

type FetchLike = (
  input: string,
  init?: { credentials?: "same-origin"; cache?: "no-store"; signal?: AbortSignal },
) => Promise<{ ok: boolean; json: () => Promise<unknown> }>;

/** Resolves to "signed-in" or "signed-out". Never throws and never stays pending longer than the timeout. */
export async function checkSession(opts: {
  cookie: string | null | undefined;
  fetchImpl: FetchLike;
  timeoutMs?: number;
}): Promise<Exclude<SessionStatus, "unknown">> {
  if (!hasAuthCookieHint(opts.cookie)) return "signed-out";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? SESSION_TIMEOUT_MS);
  try {
    const res = await opts.fetchImpl(SESSION_ENDPOINT, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return "signed-out";
    const body = (await res.json()) as { signedIn?: unknown } | null;
    return body && body.signedIn === true ? "signed-in" : "signed-out";
  } catch {
    return "signed-out";
  } finally {
    clearTimeout(timer);
  }
}
