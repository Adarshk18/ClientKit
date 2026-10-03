"use client";

import { sessionAttr, useSessionStatus } from "@/components/use-session";
import { SENT_LIMITS } from "@/lib/plans";

/**
 * The line above the home h1. The server HTML says the free plan line. Signed-in visitors get a short
 * signed-in line in the same spot instead, so the h1 below does not move.
 */
export function FreePlanBadge() {
  const status = useSessionStatus();
  return (
    <p data-session={sessionAttr(status)} className="text-[13px] font-medium text-stamp">
      {status === "signed-in"
        ? "You are signed in."
        : `Free plan: ${SENT_LIMITS.free} sends a month, never expires, no card.`}
    </p>
  );
}
