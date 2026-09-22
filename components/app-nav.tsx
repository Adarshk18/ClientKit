import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { Wordmark } from "@/components/wordmark";
import { LogoMark } from "@/components/logo-mark";

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
    <header className="border-b border-line">
      <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Wordmark href="/jobs" />
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden min-w-0 items-center gap-2 sm:flex">
            <LogoMark name={workspaceName} src={logoSrc} size="sm" />
            <span className="max-w-[10rem] truncate text-[13px] text-muted">{workspaceName}</span>
          </span>
        </div>
        <nav className="flex max-w-full flex-wrap items-center justify-end gap-0 text-[13px] sm:gap-1">
          <Link href="/jobs" className="inline-flex h-9 items-center px-2 hover:text-stamp sm:h-10 sm:px-3">
            Jobs
          </Link>
          <Link href="/settings" className="inline-flex h-9 items-center px-2 hover:text-stamp sm:h-10 sm:px-3">
            Settings
          </Link>
          <Link href="/settings/billing" className="inline-flex h-9 items-center px-2 hover:text-stamp sm:h-10 sm:px-3">
            Billing
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex h-9 items-center px-2 text-muted hover:text-ink sm:h-10 sm:px-3">
              Log out
            </button>
          </form>
        </nav>
      </div>
      <p className="sr-only">{email}</p>
    </header>
  );
}
