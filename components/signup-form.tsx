"use client";

import Link from "next/link";
import { signUpAction, signInWithGoogle } from "@/lib/actions/auth";
import { GoogleMark } from "@/components/google-mark";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, fieldClass } from "@/lib/ui";

export function SignupForm({ error }: { error?: string }) {
  return (
    <>
      <p className="mt-2 text-sm text-muted">
        $12/mo after you pick a plan. Sending jobs starts on the free allowance.
      </p>
      {error ? (
        <p className="mt-3 text-sm text-danger">Could not create the account. Try a different email.</p>
      ) : null}
      <form action={signUpAction} className="mt-8 space-y-4">
        <label className="block text-[13px]">
          Workspace name
          <input name="workspace_name" required className={fieldClass} placeholder="Studio North" />
        </label>
        <label className="block text-[13px]">
          Email
          <input name="email" type="email" required className={fieldClass} autoComplete="email" />
        </label>
        <label className="block text-[13px]">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            className={fieldClass}
            autoComplete="new-password"
          />
        </label>
        <SubmitButton className={`${btnPrimary} w-full`} pendingLabel="Creating…">
          Create account
        </SubmitButton>
      </form>
      <form action={signInWithGoogle} className="mt-3">
        <SubmitButton className={`${btnSecondary} w-full gap-2.5`} pendingLabel="Redirecting…">
          <GoogleMark />
          Continue with Google
        </SubmitButton>
      </form>
      <p className="mt-8 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline decoration-line underline-offset-4">
          Log in
        </Link>
      </p>
    </>
  );
}
