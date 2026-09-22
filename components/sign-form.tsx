"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signDocumentAction } from "@/lib/actions/sign";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, fieldClass } from "@/lib/ui";
import type { ActionResult } from "@/lib/types";

const initial: ActionResult | null = null;

export function SignForm({
  publicId,
  documentHash,
  defaultEmail,
}: {
  publicId: string;
  documentHash: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(signDocumentAction, initial);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="public_id" value={publicId} />
      <input type="hidden" name="document_hash" value={documentHash} />
      {state && !state.ok ? (
        <p className="border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm">
        Legal name
        <input
          name="signer_name"
          required
          minLength={2}
          className={`${fieldClass} h-11`}
          autoComplete="name"
        />
      </label>
      <label className="block text-sm">
        Email
        <input
          name="signer_email"
          type="email"
          required
          defaultValue={defaultEmail}
          className={`${fieldClass} h-11`}
          autoComplete="email"
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input name="agree" type="checkbox" required className="mt-0.5 h-5 w-5 shrink-0" />
        <span>I agree to the scope and amounts on this page, and I intend this as my electronic signature.</span>
      </label>
      <SubmitButton className={`${btnPrimary} h-11 w-full`} pendingLabel="Signing…">
        Sign
      </SubmitButton>
      <p className="text-xs text-muted">
        Simple electronic signature. Not a digital signature certificate.
      </p>
    </form>
  );
}
