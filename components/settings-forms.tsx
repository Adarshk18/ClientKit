"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  updatePayoutAction,
  updateWorkspaceAction,
  uploadLogoAction,
} from "@/lib/actions/settings";
import { Spinner } from "@/components/spinner";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, fieldClass } from "@/lib/ui";
import type { ActionResult, PayoutType } from "@/lib/types";

const empty: ActionResult | null = null;

function PendingFileButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary} aria-busy={pending}>
      {pending ? <Spinner label="Uploading" /> : "Upload logo"}
    </button>
  );
}

export function LogoUploadForm() {
  const router = useRouter();
  const [state, action] = useActionState(uploadLogoAction, empty);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} className="space-y-3">
      {state && !state.ok ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-stamp">Logo saved.</p> : null}
      <input name="logo" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="text-sm" />
      <PendingFileButton />
    </form>
  );
}

export function BrandForm({
  name,
  currency,
  country,
}: {
  name: string;
  currency: string;
  country: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const result = await updateWorkspaceAction(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        router.refresh();
      }}
    >
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm">
        Workspace name
        <input name="name" required defaultValue={name} className={fieldClass} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Currency
          <input name="currency" defaultValue={currency} maxLength={3} className={fieldClass} />
        </label>
        <label className="text-sm">
          Country
          <input name="country" defaultValue={country} maxLength={2} className={fieldClass} />
        </label>
      </div>
      <SubmitButton className={btnPrimary}>Save brand</SubmitButton>
    </form>
  );
}

export function PayoutForm({
  payoutType,
  payoutValue,
}: {
  payoutType: PayoutType | null;
  payoutValue: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      action={async (formData) => {
        const result = await updatePayoutAction(formData);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        router.refresh();
      }}
    >
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <label className="block text-sm">
        Method
        <select name="payout_type" defaultValue={payoutType ?? "upi"} className={fieldClass}>
          <option value="upi">UPI VPA</option>
          <option value="url">Hosted payment URL</option>
        </select>
      </label>
      <label className="block text-sm">
        VPA or https URL
        <input
          name="payout_value"
          required
          defaultValue={payoutValue ?? ""}
          className={fieldClass}
          placeholder="name@okaxis or https://…"
        />
      </label>
      <SubmitButton className={btnPrimary}>Save payout</SubmitButton>
    </form>
  );
}

