import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { TrackedLink } from "@/components/track";
import { btnNav, btnGhost } from "@/lib/ui";

export function SiteHeader({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm landscape-short:static">
      <div className="ck-safe-header mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 sm:min-h-12 sm:px-4 sm:py-2 landscape-short:min-h-10 landscape-short:py-1">
        <Wordmark />
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-0.5 sm:gap-1">
          <Link href="/about" className={btnGhost}>
            About
          </Link>
          <Link href="/pricing" className={btnGhost}>
            Pricing
          </Link>
          <Link href="/login" className={btnGhost}>
            Log in
          </Link>
          {showCta ? (
            <TrackedLink href="/signup" className={btnNav} meta={{ cta: "header_get_started" }}>
              Get started
            </TrackedLink>
          ) : null}
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
        <p className="flex flex-wrap gap-4">
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/faq" className="hover:text-ink">
            FAQ
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
