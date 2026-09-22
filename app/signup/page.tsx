import { SiteFooter, SiteHeader } from "@/components/site-header";
import { SignupForm } from "@/components/signup-form";
import { TrackPageView } from "@/components/track";

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col">
      <TrackPageView name="signup_start" meta={{ page: "signup" }} />
      <SiteHeader showCta={false} />
      <main className="ck-auth-main mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-8 short-h:justify-start short-h:py-4 sm:py-12">
        <h1 className="font-serif text-3xl landscape-short:text-2xl">Create a workspace</h1>
        <SignupForm error={error} />
      </main>
      <SiteFooter />
    </div>
  );
}
