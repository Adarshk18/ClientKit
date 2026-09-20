import { SiteFooter, SiteHeader } from "@/components/site-header";
import { LoginForm } from "@/components/login-form";

export const dynamic = "force-dynamic";

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
        <LoginForm error={error} checkEmail={check_email} />
      </main>
      <SiteFooter />
    </div>
  );
}
