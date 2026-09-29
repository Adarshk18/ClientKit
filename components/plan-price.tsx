"use client";

import { useVisitorCountry } from "@/components/use-visitor-country";
import { formatPlanPrice } from "@/lib/billing-regions";
import type { Plan } from "@/lib/types";

/** Inline price for running text on static pages. Renders US dollars in the HTML, then the visitor's currency. */
export function PlanPrice({ plan }: { plan: Exclude<Plan, "free"> }) {
  const { country } = useVisitorCountry();
  return <>{formatPlanPrice(plan, country)}</>;
}
