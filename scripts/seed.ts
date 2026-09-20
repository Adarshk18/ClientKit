import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function hash(payload: unknown): string {
  const json = JSON.stringify(payload);
  return createHash("sha256").update(json).digest("hex");
}

async function main() {
  const email = process.env.SEED_EMAIL ?? "demo@clientkit.dev";
  const password = process.env.SEED_PASSWORD ?? "demo-password-change-me";

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Studio North" },
  });

  let user = created.user;
  if (createError || !user) {
    const { data: list } = await admin.auth.admin.listUsers();
    user = list.users.find((item) => item.email === email) ?? null;
    if (!user) {
      throw createError ?? new Error("Could not create or find demo user");
    }
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
        payout_value: "studionorth@okaxis",
        plan: "solo",
        plan_status: "active",
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();
  if (wsError || !workspace) throw wsError ?? new Error("workspace");

  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({ workspace_id: workspace.id, name: "Acme", email: "ops@acme.example" })
    .select("*")
    .single();
  if (clientError || !client) throw clientError ?? new Error("client");

  const publicId = "demoAcmeSiteRebuild123";
  const line = { label: "Homepage + CMS", qty: 1, unit_amount: 120000 };
  const payload = {
    title: "Acme site rebuild",
    scope_html: "<p>Homepage + CMS, two weeks.</p>",
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
  };

  await admin.from("documents").delete().eq("public_id", publicId);

  const { data: doc, error: docError } = await admin
    .from("documents")
    .insert({
      workspace_id: workspace.id,
      client_id: client.id,
      public_id: publicId,
      title: payload.title,
      scope_html: payload.scope_html,
      currency: "USD",
      subtotal: 120000,
      deposit_percent: 50,
      deposit_amount: 60000,
      amount_due: 60000,
      remainder_amount: 60000,
      status: "sent",
      sent_at: new Date().toISOString(),
      frozen_hash: hash(payload),
    })
    .select("*")
    .single();
  if (docError || !doc) throw docError ?? new Error("document");

  await admin.from("line_items").insert({
    document_id: doc.id,
    label: line.label,
    qty: line.qty,
    unit_amount: line.unit_amount,
    sort_order: 0,
  });

  console.log("Seeded demo workspace");
  console.log(`  login: ${email} / ${password}`);
  console.log(`  public: ${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/s/${publicId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
