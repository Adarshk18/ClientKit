import Link from "next/link";
import { signInAction, signInWithGoogle } from "@/lib/actions/auth";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { GoogleMark } from "@/components/google-mark";
import { SubmitButton } from "@/components/submit-button";
import { btnPrimary, btnSecondary, fieldClass } from "@/lib/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; check_email?: string }>;
}) {
  const { error, check_email } = await searchParams;
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader showCta={false} />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <h1 className="font-serif text-3xl">Log in</h1>
        {check_email ? (
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
      </main>
      <SiteFooter />
    </div>
  );
}
