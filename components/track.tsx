"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { AnalyticsEventName } from "@/lib/analytics-events";

/** Fire-and-forget analytics ping. Safe to call from click handlers. */
export function track(
  name: AnalyticsEventName,
  opts?: { path?: string; meta?: Record<string, unknown> },
): void {
  try {
    const path =
      opts?.path ??
      (typeof window !== "undefined" ? window.location.pathname : undefined);
    void fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, path, meta: opts?.meta }),
      keepalive: true,
    }).catch(() => {
      /* ignore network errors */
    });
  } catch {
    /* ignore */
  }
}

/** Mount once on a marketing page to record a page_view (or other view event). */
export function TrackPageView({
  name = "page_view",
  meta,
}: {
  name?: AnalyticsEventName;
  meta?: Record<string, unknown>;
}) {
  useEffect(() => {
    track(name, { meta });
    // meta is intentionally snapshot-at-mount; avoid re-firing on new object identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}

const SESSION_PING_MS = 2 * 60 * 1000;

/**
 * Logged-in app session tracker: one page_view on mount, then session_ping
 * every 2 minutes while the tab is visible. Mount only from app/(app)/layout.
 */
export function TrackAppSession() {
  useEffect(() => {
    track("page_view", { meta: { source: "app_session" } });

    const ping = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        track("session_ping");
      }
    };

    const id = window.setInterval(ping, SESSION_PING_MS);
    return () => window.clearInterval(id);
  }, []);

  return null;
}

type TrackedLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  event?: AnalyticsEventName;
  meta?: Record<string, unknown>;
};

/** Link that records a CTA / conversion click before navigating. */
export function TrackedLink({
  href,
  className,
  children,
  event = "cta_click",
  meta,
}: TrackedLinkProps) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track(event, { meta: { href, ...meta } })}
    >
      {children}
    </Link>
  );
}
