import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { HeaderAuth } from "@/components/header-auth";
import { btnGhost } from "@/lib/ui";

/**
 * `mobileCta={false}` hides the filled "Get started" button below the sm breakpoint. The home page uses it
 * so the hero button is the one obvious tap on a phone.
 *
 * This is the one header for every marketing page. The server HTML is always the signed-out version, so it
 * stays static and cacheable; HeaderAuth swaps in "Dashboard" on the client for signed-in visitors.
 */
export function SiteHeader({
  showCta = true,
  mobileCta = true,
}: {
  showCta?: boolean;
  mobileCta?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm landscape-short:static">
      <div className="ck-safe-header mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 sm:min-h-12 sm:px-4 sm:py-2 landscape-short:min-h-10 landscape-short:py-1">
        <Wordmark />
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          <Link href="/s/demo-acme" className={`${btnGhost} max-sm:hidden`}>
            Demo
          </Link>
          <Link href="/pricing" className={btnGhost}>
            Pricing
          </Link>
          <Link href="/faq" className={`${btnGhost} max-[440px]:hidden`}>
            FAQ
          </Link>
          <Link href="/about" className={`${btnGhost} max-sm:hidden`}>
            About
          </Link>
          <HeaderAuth showCta={showCta} mobileCta={mobileCta} />
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="ck-safe-bottom mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[13px] text-muted">
        <p>Client Kit</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/s/demo-acme" className="py-1 hover:text-ink">
            Live demo
          </Link>
          <Link href="/pricing" className="py-1 hover:text-ink">
            Pricing
          </Link>
          <Link href="/tools" className="py-1 hover:text-ink">
            Free tools
          </Link>
          <Link href="/faq" className="py-1 hover:text-ink">
            FAQ
          </Link>
          <Link href="/about" className="py-1 hover:text-ink">
            About
          </Link>
          <Link href="/terms" className="py-1 hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="py-1 hover:text-ink">
            Privacy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
