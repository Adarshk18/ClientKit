"use client";

import { useEffect, useSyncExternalStore } from "react";
import { checkSession, hasAuthCookieHint, type SessionStatus } from "@/lib/session-cta";

/**
 * One shared session check for every CTA on the page. The server (and the first client render) always says
 * "unknown", which renders the signed-out HTML. After mount we look for a Supabase session cookie, ask
 * /api/session when there is one, and swap the CTAs when the answer is signed in.
 */
let status: SessionStatus = "unknown";
let lastHint: boolean | null = null;
let inflight = false;
const listeners = new Set<() => void>();

function set(next: SessionStatus) {
  if (next === status) return;
  status = next;
  listeners.forEach((l) => l());
}

function refresh() {
  if (typeof document === "undefined") return;
  const hint = hasAuthCookieHint(document.cookie);
  if (hint === lastHint && status !== "unknown") return;
  if (inflight && hint === lastHint) return;
  lastHint = hint;
  if (!hint) {
    set("signed-out");
    return;
  }
  inflight = true;
  void checkSession({ cookie: document.cookie, fetchImpl: (url, init) => fetch(url, init) }).then((result) => {
    inflight = false;
    // Ignore a stale answer if the cookie changed while the request was running.
    if (hasAuthCookieHint(document.cookie) !== hint) return;
    set(result);
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSessionStatus(): SessionStatus {
  const current = useSyncExternalStore(
    subscribe,
    () => status,
    () => "unknown" as SessionStatus,
  );
  useEffect(() => {
    refresh();
  }, []);
  return current;
}

/** Value for the data-session attribute. CSS hides "pending" items for returning visitors only (see globals.css). */
export function sessionAttr(s: SessionStatus): "pending" | "ready" {
  return s === "unknown" ? "pending" : "ready";
}
