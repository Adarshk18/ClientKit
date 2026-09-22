import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { Wordmark } from "@/components/wordmark";
import { LogoMark } from "@/components/logo-mark";

const navLink =
  "inline-flex min-h-11 items-center px-2.5 hover:text-stamp sm:px-3 landscape-short:min-h-9 landscape-short:px-2";

export function AppNav({
  workspaceName,
  logoSrc,
  email,
}: {
  workspaceName: string;
  logoSrc?: string | null;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm landscape-short:static">
      <div className="ck-safe-header mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-1.5 sm:min-h-12 sm:px-4 sm:py-2 landscape-short:min-h-10 landscape-short:py-1">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark href="/jobs" />
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden min-w-0 items-center gap-2 sm:flex">
            <LogoMark name={workspaceName} src={logoSrc} size="sm" />
            <span className="max-w-[10rem] truncate text-[13px] text-muted">{workspaceName}</span>
          </span>
        </div>
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-0 text-[13px] sm:gap-1">
          <Link href="/jobs" className={navLink}>
            Jobs
          </Link>
          <Link href="/settings" className={navLink}>
            Settings
          </Link>
          <Link href="/settings/billing" className={navLink}>
            Billing
          </Link>
          <form action={signOutAction}>
            <button type="submit" className={`${navLink} text-muted hover:text-ink`}>
              Log out
            </button>
          </form>
        </nav>
      </div>
      <p className="sr-only">{email}</p>
    </header>
  );
}
