"use client";

import { useState, useTransition } from "react";
import { startPlanCheckoutAction } from "@/lib/actions/billing";
import { Spinner } from "@/components/spinner";
import { track } from "@/components/track";
import { FOUNDER_CAP, PLAN_PRICES } from "@/lib/plans";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { Plan } from "@/lib/types";

export function CheckoutButtons({ current, founderOpen = true }: { current: Plan; founderOpen?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start(plan: Exclude<Plan, "free">) {
    startTransition(async () => {
      setError(null);
      track("checkout_start", { meta: { plan } });
      const result = await startPlanCheckoutAction(plan);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.data.url;
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="border border-danger/30 bg-[#f8e8e4] px-3 py-2 text-sm text-danger">{error}</p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(PLAN_PRICES) as Array<Exclude<Plan, "free">>).map((plan) => {
          const info = PLAN_PRICES[plan];
          const active = current === plan;
          return (
            <div key={plan} className={`border p-4 ${active ? "border-ink bg-cream" : "border-line bg-cream/60"}`}>
              <p className="text-[12px] text-stamp">{info.label}</p>
              <p className="mt-2 font-serif text-3xl">${info.usd}<span className="text-base">/mo</span></p>
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
                      : `Choose ${info.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
