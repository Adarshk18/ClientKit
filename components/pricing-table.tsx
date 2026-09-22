import Link from "next/link";
import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { Plan } from "@/lib/types";

const DETAILS: Record<
  Exclude<Plan, "free">,
  { blurb: string; limit: string }
> = {
  founder: {
    blurb: `First ${FOUNDER_CAP} workspaces only. Then Solo at $12.`,
    limit: `${SENT_LIMITS.founder} sent jobs / month`,
  },
  solo: { blurb: "Default plan.", limit: `${SENT_LIMITS.solo} sent jobs / month` },
  busy: { blurb: "When the calendar is full.", limit: "Unlimited sent jobs" },
};

export function PricingTable({ ctaHref = "/signup" }: { ctaHref?: string }) {
  const plans = ["founder", "solo", "busy"] as const;
  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-3">
      {plans.map((plan) => {
        const info = PLAN_PRICES[plan];
        const featured = plan === "solo";
        return (
          <div key={plan} className={`bg-cream p-6 ${featured ? "sm:relative sm:z-10 sm:ring-1 sm:ring-ink" : ""}`}>
            <p className="text-[13px] text-stamp">{info.label}</p>
            <p className="mt-3 font-serif text-4xl tabular-nums">
              ${info.usd}
              <span className="text-lg text-muted">/mo</span>
            </p>
            <p className="mt-2 text-sm text-muted">{DETAILS[plan].blurb}</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li>{DETAILS[plan].limit}</li>
              <li>Proposal, sign, and pay on one link</li>
              <li>Signed PDF + audit log</li>
              <li>Payout to your UPI or payment URL</li>
            </ul>
            <Link href={ctaHref} className={`mt-8 w-full ${featured ? btnPrimary : btnSecondary}`}>
              {featured ? "Start on Solo" : `Choose ${info.label}`}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
