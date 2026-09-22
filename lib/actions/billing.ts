"use server";

import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { dodoProductId, getDodoClient } from "@/lib/dodo";
import { appUrl } from "@/lib/env";
import { planCheckoutSchema } from "@/lib/validators";
import { assertSameOrigin } from "@/lib/request";
import { logError } from "@/lib/logger";
import { canPurchaseFounder, FOUNDER_CAP } from "@/lib/plans";
import {
  currencyForCountry,
  formatPlanPrice,
  isIndiaCountry,
  workspaceCountry,
} from "@/lib/billing-regions";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { ActionResult } from "@/lib/types";
import type { Plan } from "@/lib/types";

export async function startPlanCheckoutAction(
  plan: string,
  country?: string,
): Promise<ActionResult<{ url: string }>> {
  try {
    await assertSameOrigin();
    const parsed = planCheckoutSchema.safeParse(plan);
    if (!parsed.success) return { ok: false, error: "Unknown plan." };

    const { user, workspace } = await requireWorkspace();
    if (!user.email) return { ok: false, error: "Your account needs an email to bill." };

    const admin = createSupabaseAdmin();
    let billingCountry = workspaceCountry(workspace.country);

    if (country) {
      billingCountry = workspaceCountry(country);
      const billingCurrency = currencyForCountry(billingCountry);
      const { error: updateError } = await admin
        .from("workspaces")
        .update({ country: billingCountry, currency: billingCurrency })
        .eq("id", workspace.id);
      if (updateError) {
        logError("billing.persistCountry", updateError);
        return { ok: false, error: "Could not save billing country. Try again." };
      }
    }

    if (parsed.data === "founder") {
      const { count, error: countError } = await admin
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .eq("plan", "founder");
      if (countError) {
        logError("billing.founderCap", countError);
        return { ok: false, error: "Could not check Founder availability. Try Solo instead." };
      }
      if (!canPurchaseFounder(count ?? 0)) {
        return {
          ok: false,
          error: `Founder (${formatPlanPrice("founder", billingCountry)}) is limited to the first ${FOUNDER_CAP} workspaces. Choose Solo (${formatPlanPrice("solo", billingCountry)}).`,
        };
      }
    }

    const client = getDodoClient();
    const productId = dodoProductId(parsed.data);
    const isIndia = isIndiaCountry(billingCountry);

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

export async function redirectToCheckout(plan: Exclude<Plan, "free">, country?: string): Promise<void> {
  const result = await startPlanCheckoutAction(plan, country);
  if (result.ok) redirect(result.data.url);
  redirect(`/settings/billing?error=${encodeURIComponent(result.error)}`);
}

export async function countFounderWorkspaces(): Promise<number> {
  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from("workspaces")
    .select("id", { count: "exact", head: true })
    .eq("plan", "founder");
  if (error) {
    logError("billing.countFounder", error);
    return FOUNDER_CAP;
  }
  return count ?? 0;
}
