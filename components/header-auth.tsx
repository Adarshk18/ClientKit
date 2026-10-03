"use client";

import Link from "next/link";
import { TrackedLink } from "@/components/track";
import { useSessionStatus, sessionAttr } from "@/components/use-session";
import { DASHBOARD_HREF } from "@/lib/session-cta";
import { btnGhost, btnNav } from "@/lib/ui";

/**
 * Right-hand side of the marketing header. The server HTML is "Log in" and "Get started". Once the session
 * check says the visitor is signed in, a single "Dashboard" link replaces them.
 *
 * The signed-out buttons are never removed from layout: when signed in they stay in the same grid cell as an
 * invisible, inert spacer, so the header keeps exactly the same width and nothing around it moves.
 * Where the signed-out "Get started" is hidden on phones (home page), "Dashboard" is hidden there too, because
 * the hero already has the "Go to dashboard" button and a wider link would push "Pricing" sideways.
 */
export function HeaderAuth({ showCta, mobileCta }: { showCta: boolean; mobileCta: boolean }) {
  const status = useSessionStatus();
  const signedIn = status === "signed-in";

  return (
    <div data-session={sessionAttr(status)} className="inline-grid">
      <div
        className={`col-start-1 row-start-1 flex items-center justify-end gap-0.5 sm:gap-1${signedIn ? " invisible" : ""}`}
        aria-hidden={signedIn || undefined}
        inert={signedIn}
      >
        <Link href="/login" className={btnGhost} tabIndex={signedIn ? -1 : undefined}>
          Log in
        </Link>
        {showCta ? (
          <TrackedLink
            href="/signup"
            className={`${btnNav}${mobileCta ? "" : " max-sm:hidden"}`}
            meta={{ cta: "header_get_started" }}
          >
            Get started
          </TrackedLink>
        ) : null}
      </div>
      {signedIn ? (
        <TrackedLink
          href={DASHBOARD_HREF}
          className={`col-start-1 row-start-1 justify-self-end ${btnNav}${mobileCta ? "" : " max-sm:hidden"}`}
          meta={{ cta: "header_dashboard" }}
        >
          Dashboard
        </TrackedLink>
      ) : null}
    </div>
  );
}
