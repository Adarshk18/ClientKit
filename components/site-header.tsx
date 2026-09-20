import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { btnPrimary, btnGhost } from "@/lib/ui";

export function SiteHeader({ showCta = true }: { showCta?: boolean }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <Wordmark />
        <nav className="flex flex-wrap items-center gap-1">
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
            <Link href="/signup" className={btnPrimary}>
              Get started
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-[13px] text-muted">
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
