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
        <div
          role="status"
          className="mt-4 border border-stamp border-l-4 bg-cream px-3 py-3 text-sm leading-6 text-ink"
        >
          <p className="font-medium text-stamp">Account created.</p>
          <p>Check your email and click the confirmation link, then log in here.</p>
        </div>
      ) : null}
      <p className="mt-2 text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-medium text-stamp underline decoration-line underline-offset-4">
          Create a free account
        </Link>
      </p>
      {error === "rate" ? (
        <p className="mt-3 text-sm text-danger" role="alert">Too many attempts. Try again later.</p>
      ) : error ? (
        <p className="mt-3 text-sm text-danger" role="alert">Could not sign in. Check email and password.</p>
      ) : null}
      <form action={signInAction} className="mt-6 space-y-4">
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
    </>
  );
}
