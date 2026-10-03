"use client";

import { TrackedLink } from "@/components/track";
import { useSessionStatus, sessionAttr } from "@/components/use-session";
import { pickCta, type CtaTarget } from "@/lib/session-cta";

/**
 * A call to action that renders the signed-out version in the server HTML and swaps to the signed-in version
 * after the session check. Pass the same `className` for both states.
 */
export function SessionLink({
  signedOut,
  signedIn,
  className,
  meta,
  signedInMeta,
}: {
  signedOut: CtaTarget;
  signedIn: CtaTarget;
  className?: string;
  meta?: Record<string, unknown>;
  signedInMeta?: Record<string, unknown>;
}) {
  const status = useSessionStatus();
  const target = pickCta(status, signedOut, signedIn);
  const m = status === "signed-in" ? (signedInMeta ?? meta) : meta;
  return (
    <TrackedLink href={target.href} className={className} meta={m} session={sessionAttr(status)}>
      {target.label}
    </TrackedLink>
  );
}
