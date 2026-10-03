"use client";

import { CountrySelect } from "@/components/country-select";
import { setVisitorCountry, useVisitorCountry } from "@/components/use-visitor-country";
import { TrackedLink } from "@/components/track";
import { SessionLink } from "@/components/session-link";
import { useSessionStatus } from "@/components/use-session";
import { DASHBOARD_HREF, pickCta } from "@/lib/session-cta";
import { FOUNDER_CAP, SENT_LIMITS } from "@/lib/plans";
import { formatPlanPrice } from "@/lib/billing-regions";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { Plan } from "@/lib/types";

function planDetails(country: string): Record<Exclude<Plan, "free">, { blurb: string; limit: string }> {
  const solo = formatPlanPrice("solo", country);
  return {
    founder: {
      blurb: `First ${FOUNDER_CAP} workspaces only. Then Solo at ${solo}.`,
      limit: `${SENT_LIMITS.founder} sent jobs / month`,
    },
    solo: { blurb: "Default plan.", limit: `${SENT_LIMITS.solo} sent jobs / month` },
    busy: { blurb: "When the calendar is full.", limit: "Unlimited sent jobs" },
  };
}

const PLAN_LABELS: Record<Exclude<Plan, "free">, string> = {
  founder: "Founder",
  solo: "Solo",
  busy: "Busy",
};

/**
 * The server HTML always shows US dollars so the page can be static. The visitor's country is read
 * after load (see use-visitor-country) and the prices swap in place. Card sizes do not depend on the
 * currency, so nothing moves.
 */
export function PricingTable({ ctaHref = "/signup" }: { ctaHref?: string }) {
  const { country } = useVisitorCountry();
  const plans = ["founder", "solo", "busy"] as const;
  const details = planDetails(country);
  const status = useSessionStatus();
  // Signed-in visitors go to the dashboard (Free) or the billing page (paid plans) instead of signup.
  const paidHref = pickCta(status, ctaHref, "/settings/billing");

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <CountrySelect value={country} onChange={setVisitorCountry} id="pricing-country" />
      </div>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <div className="ck-pricing-card bg-cream p-5 sm:p-6">
          <p className="text-[13px] text-stamp">Free</p>
          <p className="mt-3 font-serif text-3xl tabular-nums sm:text-4xl landscape-short:text-3xl">Free</p>
          <p className="mt-2 text-sm text-muted">Never expires.</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li>{SENT_LIMITS.free} sent jobs / month</li>
            <li>Proposal, sign, and pay on one link</li>
            <li>Signed PDF + audit log</li>
            <li>Payout to your UPI or payment URL</li>
          </ul>
          <SessionLink
            signedOut={{ href: ctaHref, label: "Start free" }}
            signedIn={{ href: DASHBOARD_HREF, label: "Go to dashboard" }}
            className={`mt-8 w-full ${btnSecondary}`}
            meta={{ cta: "pricing_free", plan: "free", country }}
            signedInMeta={{ cta: "pricing_dashboard", plan: "free", country }}
          />
        </div>
        {plans.map((plan) => {
          const featured = plan === "solo";
          const label = PLAN_LABELS[plan];
          return (
            <div
              key={plan}
              className={`ck-pricing-card bg-cream p-5 sm:p-6 ${featured ? "sm:relative sm:z-10 sm:ring-1 sm:ring-ink" : ""}`}
            >
              <p className="text-[13px] text-stamp">{label}</p>
              <p className="mt-3 font-serif text-3xl tabular-nums sm:text-4xl landscape-short:text-3xl">
                {formatPlanPrice(plan, country)}
                <span className="text-lg text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm text-muted">{details[plan].blurb}</p>
              <ul className="mt-6 space-y-2 text-sm">
                <li>{details[plan].limit}</li>
                <li>Proposal, sign, and pay on one link</li>
                <li>Signed PDF + audit log</li>
                <li>Payout to your UPI or payment URL</li>
              </ul>
              <TrackedLink
                href={paidHref}
                className={`mt-8 w-full ${featured ? btnPrimary : btnSecondary}`}
                meta={{ cta: `pricing_${plan}`, plan, country }}
              >
                {`Choose ${label}`}
              </TrackedLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
