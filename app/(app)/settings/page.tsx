import { requireWorkspace } from "@/lib/auth";
import { signedLogoUrl } from "@/lib/storage";
import { signOutEverywhereAction } from "@/lib/actions/auth";
import { LogoMark } from "@/components/logo-mark";
import { BrandForm, LogoUploadForm, PayoutForm } from "@/components/settings-forms";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger } from "@/lib/ui";

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  const logo = await signedLogoUrl(workspace.logo_url);

  return (
    <div className="max-w-xl space-y-12">
      <div>
        <h1 className="font-serif text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted">Brand and how clients pay you. Client Kit never holds job money.</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-serif text-xl">Brand</h2>
        <div className="flex items-center gap-3">
          <LogoMark name={workspace.name} src={logo} size="lg" />
          <p className="text-sm text-muted">PNG, JPEG, or WebP, under 1 MB. Missing logo uses your initials.</p>
        </div>
        <LogoUploadForm />
        <BrandForm name={workspace.name} currency={workspace.currency} country={workspace.country} />
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl">Payout</h2>
        <p className="text-sm text-muted">
          After a client signs, they pay you directly. Save one UPI VPA or a hosted payment URL you created
          (Razorpay Payment Link, PayPal.me, or a Dodo link on your own account).
        </p>
        <PayoutForm payoutType={workspace.payout_type} payoutValue={workspace.payout_value} />
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">Session</h2>
        <form action={signOutEverywhereAction}>
          <SubmitButton className={btnDanger} pendingLabel="Signing out…">
            Log out everywhere
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
