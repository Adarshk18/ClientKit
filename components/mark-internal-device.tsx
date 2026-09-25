"use client";

import { useEffect } from "react";
import { INTERNAL_DEVICE_COOKIE } from "@/lib/internal";

/** Marks this browser as the founder device so /admin traffic is excluded from product pulse. */
export function MarkInternalDevice() {
  useEffect(() => {
    const maxAge = 60 * 60 * 24 * 365;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${INTERNAL_DEVICE_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, []);
  return null;
}
