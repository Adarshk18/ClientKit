import { requireWorkspace } from "@/lib/auth";
import { CheckoutButtons } from "@/components/checkout-buttons";
import { countFounderWorkspaces } from "@/lib/actions/billing";
import { FOUNDER_CAP, SENT_LIMITS, effectivePlanStatus } from "@/lib/plans";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { checkout, error } = await searchParams;
  const { workspace } = await requireWorkspace();
  const status = effectivePlanStatus(workspace);
  const limit = SENT_LIMITS[workspace.plan];
  const founderTaken = await countFounderWorkspaces();
  const founderLeft = Math.max(0, FOUNDER_CAP - founderTaken);

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Billing</h1>
        <p className="mt-1 text-sm text-muted">
          You pay Client Kit. Your clients pay you. We never take a cut of job payments.
        </p>
      </div>

      {checkout === "return" ? (
        <p className="border border-line bg-cream px-4 py-3 text-sm">
          If this page still shows the old plan, wait a moment and refresh. Access is granted only after a verified
          Dodo webhook — never from this return URL.
        </p>
      ) : null}
      {error ? (
        <p className="border border-danger/30 bg-[#f8e8e4] px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <section className="border border-line bg-cream p-5 text-sm">
        <p>
          Current plan: <strong className="capitalize">{workspace.plan}</strong> ({status.replace("_", " ")})
        </p>
        <p className="mt-1 text-muted">
          Sent this period: {workspace.docs_sent_this_period}
          {Number.isFinite(limit) ? ` / ${limit}` : " (unlimited)"}
        </p>
        {status === "past_due" ? (
          <p className="mt-2 text-[#7a4b12]">
            Payment failed. You have a 3-day grace window, then this workspace becomes read-only.
          </p>
        ) : null}
        {status === "read_only" ? (
          <p className="mt-2 text-danger">Read-only: you can view jobs but cannot send new ones until billing is fixed.</p>
        ) : null}
      </section>

      <p className="text-sm text-muted">
        Founder is $9/mo for the first {FOUNDER_CAP} workspaces ({founderLeft} left). After that, new accounts pay
        Solo at $12/mo.
      </p>
      <CheckoutButtons current={workspace.plan} founderOpen={founderLeft > 0 || workspace.plan === "founder"} />
    </div>
  );
}
