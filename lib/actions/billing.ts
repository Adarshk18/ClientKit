"use server";

import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { dodoProductId, getDodoClient } from "@/lib/dodo";
import { appUrl } from "@/lib/env";
import { planCheckoutSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/request";
import { logError } from "@/lib/logger";
import type { ActionResult } from "@/lib/types";
import type { Plan } from "@/lib/types";

export async function startPlanCheckoutAction(plan: string): Promise<ActionResult<{ url: string }>> {
  try {
    await assertSameOrigin();
    const parsed = planCheckoutSchema.safeParse(plan);
    if (!parsed.success) return { ok: false, error: "Unknown plan." };

    const { user, workspace } = await requireWorkspace();
    if (!user.email) return { ok: false, error: "Your account needs an email to bill." };

    const client = getDodoClient();
    const productId = dodoProductId(parsed.data);
    const country = workspace.country.toUpperCase();
    const isIndia = country === "IN";

    const session = await client.checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: workspace.dodo_customer_id
        ? { customer_id: workspace.dodo_customer_id }
        : { email: user.email, name: workspace.name },
      return_url: `${appUrl()}/settings/billing?checkout=return`,
      metadata: {
        workspace_id: workspace.id,
        plan: parsed.data,
      },
      allowed_payment_method_types: isIndia
        ? ["upi_collect", "credit", "debit"]
        : ["credit", "debit"],
      billing_currency: isIndia ? "INR" : undefined,
      billing_address: isIndia ? { country: "IN" } : undefined,
      feature_flags: { redirect_immediately: true },
    });

    if (!session.checkout_url) {
      return { ok: false, error: "Checkout session did not return a URL. Try again." };
    }

    return { ok: true, data: { url: session.checkout_url } };
  } catch (error) {
    logError("billing.checkout", error);
    return { ok: false, error: "Could not start checkout. Check Dodo keys and product IDs." };
  }
}

export async function redirectToCheckout(plan: Exclude<Plan, "free">): Promise<void> {
  const result = await startPlanCheckoutAction(plan);
  if (result.ok) redirect(result.data.url);
  redirect(`/settings/billing?error=${encodeURIComponent(result.error)}`);
}
