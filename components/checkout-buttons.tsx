"use client";

import { useState, useTransition } from "react";
import { startPlanCheckoutAction } from "@/lib/actions/billing";
import { CountrySelect } from "@/components/country-select";
import { Spinner } from "@/components/spinner";
import { track } from "@/components/track";
import { FOUNDER_CAP } from "@/lib/plans";
import { formatPlanPrice } from "@/lib/billing-regions";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { Plan } from "@/lib/types";

const PLAN_LABELS: Record<Exclude<Plan, "free">, string> = {
  founder: "Founder",
  solo: "Solo",
  busy: "Busy",
};

export function CheckoutButtons({
  current,
  founderOpen = true,
  initialCountry = "US",
}: {
  current: Plan;
  founderOpen?: boolean;
  initialCountry?: string;
}) {
  const [country, setCountry] = useState(initialCountry);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start(plan: Exclude<Plan, "free">) {
    startTransition(async () => {
      setError(null);
      track("checkout_start", { meta: { plan, country } });
      const result = await startPlanCheckoutAction(plan, country);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  return (
    <div className="space-y-4">
      <div className="max-w-xs">
        <CountrySelect value={country} onChange={setCountry} id="checkout-country" />
      </div>
      {error ? (
        <p className="border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      <p className="text-sm text-muted">
        Founder is {formatPlanPrice("founder", country)}/mo for the first {FOUNDER_CAP} workspaces. After that, new
        accounts pay Solo at {formatPlanPrice("solo", country)}/mo.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 landscape:sm:grid-cols-3">
        {(["founder", "solo", "busy"] as const).map((plan) => {
          const label = PLAN_LABELS[plan];
          const active = current === plan;
          return (
            <div key={plan} className={`ck-pricing-card border p-4 ${active ? "border-ink bg-cream" : "border-line bg-cream/60"}`}>
              <p className="text-[12px] text-stamp">{label}</p>
              <p className="mt-2 font-serif text-3xl">
                {formatPlanPrice(plan, country)}
                <span className="text-base">/mo</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                {plan === "founder"
                  ? `First ${FOUNDER_CAP} workspaces · 20 sent docs / month`
                  : plan === "solo"
                    ? "40 sent docs / month"
                    : "Unlimited docs"}
              </p>
              <button
                type="button"
                disabled={pending || active || (plan === "founder" && !founderOpen)}
                className={`mt-4 w-full ${active ? btnSecondary : btnPrimary}`}
                onClick={() => start(plan)}
              >
                {active
                  ? "Current plan"
                  : plan === "founder" && !founderOpen
                    ? "Founder full"
                    : pending
                      ? <Spinner label="Redirecting" />
                      : `Choose ${label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
