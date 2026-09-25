"use client";

import { useEffect } from "react";
import { DEMO_DOC_COOKIE } from "@/lib/internal";

/** Remember which demo document this tab is on so a post-sign refresh is not rotated away. */
export function DemoSessionCookie({ documentId }: { documentId: string }) {
  useEffect(() => {
    const maxAge = 60 * 60 * 24;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${DEMO_DOC_COOKIE}=${encodeURIComponent(documentId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  }, [documentId]);
  return null;
}
