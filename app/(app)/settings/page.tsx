import { requireWorkspace } from "@/lib/auth";
import { signedLogoUrl } from "@/lib/storage";
import { updatePayoutAction, updateWorkspaceAction, uploadLogoAction } from "@/lib/actions/settings";
import { signOutEverywhereAction } from "@/lib/actions/auth";
import { LogoMark } from "@/components/logo-mark";
import { SubmitButton } from "@/components/submit-button";
import { btnDanger, btnPrimary, fieldClass } from "@/lib/ui";

export default async function SettingsPage() {
  const { workspace } = await requireWorkspace();
  const logo = await signedLogoUrl(workspace.logo_url);
  const field = fieldClass;

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
          <p className="text-sm text-muted">Missing logo uses your initials.</p>
        </div>
        <form action={uploadLogoAction} className="space-y-3">
          <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="text-sm" />
          <SubmitButton className={btnPrimary} pendingLabel="Uploading…">
            Upload logo
          </SubmitButton>
        </form>
        <form action={updateWorkspaceAction} className="space-y-4">
          <label className="block text-sm">
            Workspace name
            <input name="name" required defaultValue={workspace.name} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Currency
              <input name="currency" defaultValue={workspace.currency} maxLength={3} className={field} />
            </label>
            <label className="text-sm">
              Country
              <input name="country" defaultValue={workspace.country} maxLength={2} className={field} />
            </label>
          </div>
          <SubmitButton className={btnPrimary}>Save brand</SubmitButton>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl">Payout</h2>
        <p className="text-sm text-muted">
          After a client signs, they pay you directly. Save one UPI VPA or a hosted payment URL you created
          (Razorpay Payment Link, PayPal.me, or a Dodo link on your own account).
        </p>
        <form action={updatePayoutAction} className="space-y-4">
          <label className="block text-sm">
            Method
            <select name="payout_type" defaultValue={workspace.payout_type ?? "upi"} className={field}>
              <option value="upi">UPI VPA</option>
              <option value="url">Hosted payment URL</option>
            </select>
          </label>
          <label className="block text-sm">
            VPA or https URL
            <input
              name="payout_value"
              required
              defaultValue={workspace.payout_value ?? ""}
              className={field}
              placeholder="name@okaxis or https://…"
            />
          </label>
          <SubmitButton className={btnPrimary}>Save payout</SubmitButton>
        </form>
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
