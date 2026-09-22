import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { logError } from "@/lib/logger";

/** Public demo job any stranger can open from the homepage. */
export const DEMO_PUBLIC_ID = "demo-acme";

const DEMO_EMAIL = "demo@clientkit.dev";
const DEMO_UPI = "studionorth@okaxis";

/**
 * Idempotently seed the public demo document + UPI payout.
 * Safe to call from the public /s/[id] route when id is DEMO_PUBLIC_ID.
 */
export async function ensureDemoDocument(): Promise<void> {
  try {
    const admin = createSupabaseAdmin();

    const { data: existing } = await admin
      .from("documents")
      .select("id, workspace_id, workspaces(payout_type, payout_value)")
      .eq("public_id", DEMO_PUBLIC_ID)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const workspace = Array.isArray(existing.workspaces)
        ? existing.workspaces[0]
        : existing.workspaces;
      if (!workspace?.payout_type || !workspace?.payout_value) {
        await admin
          .from("workspaces")
          .update({ payout_type: "upi", payout_value: DEMO_UPI })
          .eq("id", existing.workspace_id);
      }
      return;
    }

    const password = process.env.SEED_PASSWORD ?? "demo-password-change-me";
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Studio North" },
    });

    let user = created.user;
    if (createError || !user) {
      const { data: list } = await admin.auth.admin.listUsers();
      user = list.users.find((item) => item.email === DEMO_EMAIL) ?? null;
      if (!user) throw createError ?? new Error("Could not create or find demo user");
    }

    const { data: workspace, error: wsError } = await admin
      .from("workspaces")
      .upsert(
        {
          owner_id: user.id,
          name: "Studio North",
          currency: "USD",
          country: "US",
          payout_type: "upi",
          payout_value: DEMO_UPI,
          plan: "solo",
          plan_status: "active",
        },
        { onConflict: "owner_id" },
      )
      .select("*")
      .single();
    if (wsError || !workspace) throw wsError ?? new Error("demo workspace");

    await admin
      .from("workspaces")
      .update({ payout_type: "upi", payout_value: DEMO_UPI })
      .eq("id", workspace.id);

    const { data: existingClient } = await admin
      .from("clients")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("email", "ops@acme.example")
      .maybeSingle();

    let client = existingClient;
    if (!client) {
      const { data: inserted, error: clientError } = await admin
        .from("clients")
        .insert({ workspace_id: workspace.id, name: "Acme", email: "ops@acme.example" })
        .select("*")
        .single();
      if (clientError || !inserted) throw clientError ?? new Error("demo client");
      client = inserted;
    }

    const line = { label: "Homepage + CMS", qty: 1, unit_amount: 120000 };
    const frozen = buildFrozenPayload({
      title: "Acme site rebuild",
      scope_html:
        "<p>Homepage + CMS, two weeks. Two rounds of revision. You send copy; we ship a static export.</p>",
      currency: "USD",
      line_items: [line],
      subtotal: 120000,
      deposit_percent: 50,
      deposit_amount: 60000,
      amount_due: 60000,
      remainder_amount: 60000,
      client_name: "Acme",
      client_email: "ops@acme.example",
      workspace_name: "Studio North",
    });
    const frozenHash = hashFrozenPayload(frozen);

    const { data: doc, error: docError } = await admin
      .from("documents")
      .insert({
        workspace_id: workspace.id,
        client_id: client.id,
        public_id: DEMO_PUBLIC_ID,
        title: "Acme site rebuild",
        scope_html:
          "<p>Homepage + CMS, two weeks. Two rounds of revision. You send copy; we ship a static export.</p>",
        currency: "USD",
        subtotal: 120000,
        deposit_percent: 50,
        deposit_amount: 60000,
        amount_due: 60000,
        remainder_amount: 60000,
        status: "sent",
        sent_at: new Date().toISOString(),
        frozen_payload: frozen,
        frozen_hash: frozenHash,
        payment_status: "unpaid",
      })
      .select("*")
      .single();
    if (docError || !doc) throw docError ?? new Error("demo document");

    await admin.from("line_items").insert({
      document_id: doc.id,
      label: line.label,
      qty: line.qty,
      unit_amount: line.unit_amount,
      sort_order: 0,
    });
  } catch (error) {
    logError("demo.ensure", error);
  }
}
