"use client";

import Link from "next/link";
import { signInAction, signInWithGoogle } from "@/lib/actions/auth";
import { GoogleMark } from "@/components/google-mark";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, fieldClass } from "@/lib/ui";

export function LoginForm({
  error,
  checkEmail,
}: {
  error?: string;
  checkEmail?: string;
}) {
  return (
    <>
      {checkEmail ? (
        <p className="mt-3 text-sm text-stamp">Check your email to confirm the account, then log in.</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">Could not sign in. Check email and password.</p> : null}
      <form action={signInAction} className="mt-8 space-y-4">
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
            autoComplete="current-password"
          />
        </label>
        <SubmitButton className={`${btnPrimary} w-full`} pendingLabel="Signing in…">
          Log in
        </SubmitButton>
      </form>
      <form action={signInWithGoogle} className="mt-3">
        <SubmitButton className={`${btnSecondary} w-full gap-2.5`} pendingLabel="Redirecting…">
          <GoogleMark />
          Continue with Google
        </SubmitButton>
      </form>
      <p className="mt-8 text-sm text-muted">
        No account?{" "}
        <Link href="/signup" className="text-ink underline decoration-line underline-offset-4">
          Sign up
        </Link>
      </p>
    </>
  );
}
