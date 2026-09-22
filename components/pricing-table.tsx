"use client";

import { useState } from "react";
import { CountrySelect } from "@/components/country-select";
import { TrackedLink } from "@/components/track";
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

export function PricingTable({
  ctaHref = "/signup",
  initialCountry = "US",
}: {
  ctaHref?: string;
  initialCountry?: string;
}) {
  const [country, setCountry] = useState(initialCountry);
  const plans = ["founder", "solo", "busy"] as const;
  const details = planDetails(country);

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <CountrySelect value={country} onChange={setCountry} id="pricing-country" refreshOnChange />
      </div>
      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3 landscape:sm:grid-cols-3">
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
                href={ctaHref}
                className={`mt-8 w-full ${featured ? btnPrimary : btnSecondary}`}
                meta={{ cta: `pricing_${plan}`, plan, country }}
              >
                {featured ? "Start on Solo" : `Choose ${label}`}
              </TrackedLink>
            </div>
          );
        })}
      </div>
    </div>
  );
}
