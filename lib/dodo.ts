import DodoPayments from "dodopayments";
import { assertDodoKeyMatchesEnvironment, dodoEnvironment, requireEnv } from "@/lib/env";
import type { Plan } from "@/lib/types";

let cached: DodoPayments | null = null;

export function getDodoClient(): DodoPayments {
  if (cached) return cached;
  const bearerToken = requireEnv("DODO_PAYMENTS_API_KEY");
  const environment = dodoEnvironment();
  assertDodoKeyMatchesEnvironment(bearerToken, environment);
  cached = new DodoPayments({
    bearerToken,
    environment,
    webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY,
  });
  return cached;
}

export function dodoProductId(plan: Exclude<Plan, "free">): string {
  const key =
    plan === "founder"
      ? "DODO_PRODUCT_FOUNDER"
      : plan === "solo"
        ? "DODO_PRODUCT_SOLO"
        : "DODO_PRODUCT_BUSY";
  return requireEnv(key);
}

export function verifyDodoWebhook(
  rawBody: string,
  headers: {
    "webhook-id": string;
    "webhook-signature": string;
    "webhook-timestamp": string;
  },
): unknown {
  if (!headers["webhook-id"] || !headers["webhook-signature"] || !headers["webhook-timestamp"]) {
    throw new Error("Missing webhook signature headers");
  }
  const client = getDodoClient();
  return client.webhooks.unwrap(rawBody, { headers });
}

export type DodoWebhookPayload = {
  business_id?: string;
  type: string;
  timestamp?: string;
  data: {
    payload_type?: string;
    subscription_id?: string;
    customer_id?: string;
    customer?: {
      customer_id?: string;
      email?: string;
      name?: string;
    };
    product_id?: string;
    status?: string;
    metadata?: Record<string, string | number | boolean | null>;
    payment_id?: string;
  };
};
