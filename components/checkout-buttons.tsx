"use client";

import { useState, useTransition } from "react";
import { startPlanCheckoutAction } from "@/lib/actions/billing";
import { PLAN_PRICES } from "@/lib/plans";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import type { Plan } from "@/lib/types";

export function CheckoutButtons({ current }: { current: Plan }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function start(plan: Exclude<Plan, "free">) {
    startTransition(async () => {
      setError(null);
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
                {plan === "founder" ? "20 sent docs / month" : plan === "solo" ? "40 sent docs / month" : "Unlimited docs"}
              </p>
              <button
                type="button"
                disabled={pending || active}
                className={`mt-4 w-full ${active ? btnSecondary : btnPrimary}`}
                onClick={() => start(plan)}
              >
                {active ? "Current plan" : pending ? "Redirecting…" : `Choose ${info.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
