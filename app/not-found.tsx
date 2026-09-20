import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { btnPrimary } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="font-serif text-3xl">Not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          That page or document does not exist, or the link is still a draft.
        </p>
        <Link href="/" className={`${btnPrimary} mt-8 w-fit`}>
          Back to Client Kit
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
