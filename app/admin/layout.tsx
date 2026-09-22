import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { Wordmark } from "@/components/wordmark";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-full">
      <header className="border-b border-line">
        <div className="mx-auto flex min-h-14 max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
          <div className="flex items-center gap-4">
            <Wordmark />
            <span className="text-[12px] uppercase tracking-wide text-stamp">Admin</span>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-[13px]">
            <Link href="/admin" className="text-ink hover:text-stamp">
              Overview
            </Link>
            <Link href="/jobs" className="text-muted hover:text-ink">
              App
            </Link>
            <span className="text-muted">{user.email}</span>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
