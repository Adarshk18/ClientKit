"use client";

import { btnPrimary } from "@/lib/ui";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-serif text-3xl">Something went wrong</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Try again. If this keeps happening, check your connection and env vars.
      </p>
      <button type="button" className={`${btnPrimary} mt-8 w-fit`} onClick={() => reset()}>
        Retry
      </button>
    </div>
  );
}
