import { requireWorkspace } from "@/lib/auth";
import { CheckoutButtons } from "@/components/checkout-buttons";
import { countFounderWorkspaces } from "@/lib/actions/billing";
import { countrySelectValue } from "@/lib/billing-regions";
import { FOUNDER_CAP, SENT_LIMITS, effectivePlan, effectivePlanStatus } from "@/lib/plans";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { checkout, error } = await searchParams;
  const { workspace } = await requireWorkspace();
  const status = effectivePlanStatus(workspace);
  const plan = effectivePlan(workspace);
  const droppedToFree = plan === "free" && workspace.plan !== "free";
  const limit = SENT_LIMITS[plan];
  const founderTaken = await countFounderWorkspaces();
  const founderLeft = Math.max(0, FOUNDER_CAP - founderTaken);
  const initialCountry = countrySelectValue(workspace.country);

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
        <p className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <section className="border border-line bg-cream p-5 text-sm">
        <p>
          Current plan: <strong className="capitalize">{plan}</strong>
          {droppedToFree ? "" : ` (${status.replace("_", " ")})`}
        </p>
        <p className="mt-1 text-muted">
          Sent this period: {workspace.docs_sent_this_period}
          {Number.isFinite(limit) ? ` / ${limit}` : " (unlimited)"}
        </p>
        {droppedToFree && status === "canceled" ? (
          <p className="mt-2 text-muted">
            Your paid plan has ended, so this workspace is on the free plan ({SENT_LIMITS.free} sends a month). Your
            proposals and history stay. Pick a plan below to send more.
          </p>
        ) : null}
        {droppedToFree && status === "read_only" ? (
          <p className="mt-2 text-muted">
            Your last payment failed and the grace period ended, so this workspace is on the free plan (
            {SENT_LIMITS.free} sends a month). Your proposals and history stay. Update billing to get your plan back.
          </p>
        ) : null}
        {!droppedToFree && status === "canceled" ? (
          <p className="mt-2 text-muted">
            Your subscription is canceled. You keep your paid plan until the end of the period you paid for, then the
            workspace goes back to the free plan.
          </p>
        ) : null}
        {status === "past_due" && !droppedToFree ? (
          <p className="mt-2 text-[#7a4b12]">
            Payment failed. You have a 3-day grace window to keep your plan. After that this workspace moves to the
            free plan ({SENT_LIMITS.free} sends a month) until billing is fixed.
          </p>
        ) : null}
        {workspace.plan !== "free" ? (
          <p className="mt-3 text-muted">
            To cancel, sign in to the Dodo customer portal (customer.dodopayments.com) with the email you paid with and
            cancel your subscription there. Choose cancel at next billing date to keep your plan until the end of the
            period you paid for.
          </p>
        ) : null}
      </section>

      <CheckoutButtons
        current={plan}
        founderOpen={founderLeft > 0 || workspace.plan === "founder"}
        initialCountry={initialCountry}
      />
    </div>
  );
}
