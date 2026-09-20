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
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <Wordmark href="/jobs" />
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden items-center gap-2 sm:flex">
            <LogoMark name={workspaceName} src={logoSrc} size="sm" />
            <span className="max-w-[12rem] truncate text-[13px] text-muted">{workspaceName}</span>
          </span>
        </div>
        <nav className="flex items-center gap-1 text-[13px]">
          <Link href="/jobs" className="inline-flex h-10 items-center px-3 hover:text-stamp">
            Jobs
          </Link>
          <Link href="/settings" className="inline-flex h-10 items-center px-3 hover:text-stamp">
            Settings
          </Link>
          <Link href="/settings/billing" className="inline-flex h-10 items-center px-3 hover:text-stamp">
            Billing
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="inline-flex h-10 items-center px-3 text-muted hover:text-ink">
              Log out
            </button>
          </form>
        </nav>
      </div>
      <p className="sr-only">{email}</p>
    </header>
  );
}
