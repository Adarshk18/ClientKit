import Link from "next/link";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 text-ink no-underline">
      <span className="grid h-7 w-7 place-items-center bg-stamp font-serif text-[11px] leading-none text-paper" aria-hidden>
        CK
      </span>
      <span className="font-serif text-[17px] leading-none tracking-tight">Client Kit</span>
    </Link>
  );
}
