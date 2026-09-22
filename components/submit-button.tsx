"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/spinner";

export function SubmitButton({
  children,
  className,
  pendingLabel = "Working",
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? <Spinner label={pendingLabel} className="h-4 w-4" /> : children}
    </button>
  );
}
