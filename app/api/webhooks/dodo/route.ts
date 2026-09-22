import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyDodoWebhook, type DodoWebhookPayload } from "@/lib/dodo";
import { workspacePatchFromSubscription } from "@/lib/billing-map";
import { sendSaasPaymentFailed } from "@/lib/email";
import { logError } from "@/lib/logger";
import { canPurchaseFounder } from "@/lib/plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  try {
    verifyDodoWebhook(rawBody, headers);
  } catch (error) {
    logError("dodo.webhook.verify", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: DodoWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as DodoWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const webhookId = headers["webhook-id"];
  const admin = createSupabaseAdmin();

  if (webhookId) {
    const { error } = await admin.from("processed_event_ids").insert({
      event_id: webhookId,
      event_type: payload.type,
    });
    if (error?.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (error) {
      logError("dodo.webhook.idempotency", error);
      return NextResponse.json({ error: "Could not record event" }, { status: 500 });
    }
  }

  try {
    await applyDodoEvent(payload);
  } catch (error) {
    logError("dodo.webhook.apply", error);
    if (webhookId) {
      await admin.from("processed_event_ids").delete().eq("event_id", webhookId);
    }
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function applyDodoEvent(payload: DodoWebhookPayload): Promise<void> {
  const data = payload.data ?? { payload_type: "Unknown" };
  const metadata = (data.metadata ?? {}) as Record<string, string | number | boolean | null>;
  const customerId = data.customer?.customer_id ?? data.customer_id;
  const patch = workspacePatchFromSubscription({
    type: payload.type,
    productId: data.product_id,
    subscriptionId: data.subscription_id,
    customerId,
    metadata,
    status: data.status,
  });
  if (!patch) return;

  const admin = createSupabaseAdmin();
  const workspaceId = typeof metadata.workspace_id === "string" ? metadata.workspace_id : null;

  let query = admin.from("workspaces").select("id, owner_id, plan_status");
  if (workspaceId) {
    query = query.eq("id", workspaceId);
  } else if (data.subscription_id) {
    query = query.eq("dodo_subscription_id", data.subscription_id);
  } else if (customerId) {
    query = query.eq("dodo_customer_id", customerId);
  } else {
    return;
  }

  const { data: workspace } = await query.maybeSingle();
  if (!workspace) return;

  if (patch.plan === "founder") {
    const { data: current } = await admin
      .from("workspaces")
      .select("plan")
      .eq("id", workspace.id)
      .maybeSingle();
    if (current?.plan !== "founder") {
      const { count, error: countError } = await admin
        .from("workspaces")
        .select("id", { count: "exact", head: true })
        .eq("plan", "founder");
      if (countError) {
        logError("dodo.webhook.founderCap", countError);
        delete patch.plan;
      } else if (!canPurchaseFounder(count ?? 0)) {
        // Checkout already charged Founder; grant Solo seat instead of exceeding the cohort.
        patch.plan = "solo";
        logError(
          "dodo.webhook.founderCap",
          new Error(`Founder cap reached; workspace ${workspace.id} granted solo`),
        );
      }
    }
  }

  await admin.from("workspaces").update(patch).eq("id", workspace.id);

  if (payload.type === "payment.failed" || payload.type === "subscription.on_hold") {
    const { data: owner } = await admin.auth.admin.getUserById(workspace.owner_id);
    if (owner.user?.email) {
      await sendSaasPaymentFailed({ to: owner.user.email });
    }
  }
}
