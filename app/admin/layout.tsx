import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Wordmark } from "@/components/wordmark";
import { MarkInternalDevice } from "@/components/mark-internal-device";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <MarkInternalDevice />
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm landscape-short:static">
        <div className="ck-safe-header mx-auto flex min-h-11 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-1.5 sm:min-h-12 sm:px-4 sm:py-2 landscape-short:min-h-10 landscape-short:py-1">
          <div className="flex min-w-0 items-center gap-4">
            <Wordmark />
            <span className="text-[12px] uppercase tracking-wide text-stamp">Admin</span>
          </div>
          <nav className="flex max-w-full flex-wrap items-center gap-3 text-[13px]">
            <Link href="/admin" className="inline-flex min-h-11 items-center text-ink hover:text-stamp landscape-short:min-h-9">
              Overview
            </Link>
            <Link href="/jobs" className="inline-flex min-h-11 items-center text-muted hover:text-ink landscape-short:min-h-9">
              App
            </Link>
            <span className="max-w-[12rem] truncate text-muted">{user.email}</span>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
