import type { Plan, PlanStatus } from "@/lib/types";
import { GRACE_DAYS } from "@/lib/plans";

export function planFromProductId(productId: string | undefined): Plan | null {
  if (!productId) return null;
  const map: Record<string, Plan> = {};
  const founder = process.env.DODO_PRODUCT_FOUNDER;
  const solo = process.env.DODO_PRODUCT_SOLO;
  const busy = process.env.DODO_PRODUCT_BUSY;
  if (founder) map[founder] = "founder";
  if (solo) map[solo] = "solo";
  if (busy) map[busy] = "busy";
  return map[productId] ?? null;
}

export function workspacePatchFromSubscription(input: {
  type: string;
  productId?: string;
  subscriptionId?: string;
  customerId?: string;
  metadata?: Record<string, string | number | boolean | null>;
  status?: string;
  /** Dodo `cancel_at_next_billing_date` and `next_billing_date` from the subscription payload. */
  cancelAtPeriodEnd?: boolean;
  nextBillingDate?: string;
}): {
  plan?: Plan;
  plan_status?: PlanStatus;
  dodo_customer_id?: string;
  dodo_subscription_id?: string;
  grace_until?: string | null;
} | null {
  const metadataPlan = input.metadata?.plan;
  const plan =
    (typeof metadataPlan === "string" && ["founder", "solo", "busy"].includes(metadataPlan)
      ? (metadataPlan as Plan)
      : null) ?? planFromProductId(input.productId);

  const patch: {
    plan?: Plan;
    plan_status?: PlanStatus;
    dodo_customer_id?: string;
    dodo_subscription_id?: string;
    grace_until?: string | null;
  } = {};

  // Paid-through date for a cancellation. Only a cancel-at-period-end with a future date keeps paid access;
  // cancel now, expired, or no date means the workspace drops to Free right away.
  const paidThrough = (): string | null => {
    if (!input.cancelAtPeriodEnd || !input.nextBillingDate) return null;
    const end = new Date(input.nextBillingDate);
    return Number.isNaN(end.getTime()) || end.getTime() <= Date.now() ? null : end.toISOString();
  };

  if (input.subscriptionId) patch.dodo_subscription_id = input.subscriptionId;
  if (input.customerId) patch.dodo_customer_id = input.customerId;

  switch (input.type) {
    case "subscription.active":
    case "subscription.renewed":
      if (plan) patch.plan = plan;
      patch.plan_status = "active";
      patch.grace_until = null;
      break;
    case "subscription.updated": {
      if (plan) patch.plan = plan;
      const status = (input.status ?? "").toLowerCase();
      if (status === "active") {
        patch.plan_status = "active";
        patch.grace_until = null;
      } else if (status === "on_hold" || status === "past_due") {
        patch.plan_status = "past_due";
        patch.grace_until = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      } else if (status === "cancelled" || status === "canceled" || status === "expired") {
        patch.plan_status = "canceled";
        patch.grace_until = paidThrough();
      }
      break;
    }
    case "subscription.on_hold":
      patch.plan_status = "past_due";
      patch.grace_until = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      break;
    case "subscription.failed":
      return patch;
    case "subscription.cancelled":
      patch.plan_status = "canceled";
      patch.grace_until = paidThrough();
      break;
    case "subscription.expired":
      patch.plan_status = "canceled";
      patch.grace_until = null;
      break;
    case "payment.succeeded":
      if (plan) patch.plan = plan;
      patch.plan_status = "active";
      patch.grace_until = null;
      break;
    case "payment.failed":
      patch.plan_status = "past_due";
      patch.grace_until = new Date(Date.now() + GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      break;
    default:
      return Object.keys(patch).length ? patch : null;
  }

  return patch;
}
