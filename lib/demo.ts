import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { logError } from "@/lib/logger";
import { DEMO_OWNER_EMAIL, shouldRotateDemoDocument } from "@/lib/internal";

/** Public demo job any stranger can open from the homepage. */
export const DEMO_PUBLIC_ID = "demo-acme";

export const DEMO_EMAIL = DEMO_OWNER_EMAIL;
const DEMO_UPI = "studionorth@okaxis";

const DEMO_SCOPE =
  "<p>Homepage + CMS, two weeks. Two rounds of revision. You send copy; we ship a static export.</p>";

/**
 * Idempotently seed the public demo document + UPI payout.
 * If the live /s/demo-acme link is already signed, rotate it onto a fresh unsigned copy
 * unless `keepDocumentId` is that same document (the visitor who just signed).
 */
export async function ensureDemoDocument(opts?: { keepDocumentId?: string | null }): Promise<void> {
  try {
    const admin = createSupabaseAdmin();

    const { data: existing } = await admin
      .from("documents")
      .select("id, status, signed_at, workspace_id, workspaces(payout_type, payout_value, plan)")
      .eq("public_id", DEMO_PUBLIC_ID)
      .is("deleted_at", null)
      .maybeSingle();

    if (existing) {
      const workspace = Array.isArray(existing.workspaces)
        ? existing.workspaces[0]
        : existing.workspaces;
      const needsPayout = !workspace?.payout_type || !workspace?.payout_value;
      const needsFreePlan = workspace && workspace.plan !== "free";
      if (needsPayout || needsFreePlan) {
        await admin
          .from("workspaces")
          .update({
            payout_type: "upi",
            payout_value: DEMO_UPI,
            plan: "free",
          })
          .eq("id", existing.workspace_id);
      }

      const rotate = shouldRotateDemoDocument({
        status: existing.status,
        documentId: existing.id,
        keepDocumentId: opts?.keepDocumentId ?? null,
        signedAt: existing.signed_at,
      });
      if (!rotate) return;

      const { error: archiveError } = await admin
        .from("documents")
        .update({ public_id: `archived-${existing.id}` })
        .eq("id", existing.id)
        .eq("public_id", DEMO_PUBLIC_ID);
      if (archiveError) {
        logError("demo.archive", archiveError);
        return;
      }

      const { data: client } = await admin
        .from("clients")
        .select("id")
        .eq("workspace_id", existing.workspace_id)
        .eq("email", "ops@acme.example")
        .maybeSingle();
      if (!client) {
        logError("demo.archive", new Error("demo client missing during rotate"));
        return;
      }
      await insertFreshDemoDocument(admin, existing.workspace_id, client.id);
      return;
    }

    const workspace = await createDemoWorkspace(admin);
    const client = await ensureDemoClient(admin, workspace.id);
    await insertFreshDemoDocument(admin, workspace.id, client.id);
  } catch (error) {
    logError("demo.ensure", error);
  }
}

type AdminClient = ReturnType<typeof createSupabaseAdmin>;

async function createDemoWorkspace(admin: AdminClient) {
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
        plan: "free",
        plan_status: "active",
      },
      { onConflict: "owner_id" },
    )
    .select("*")
    .single();
  if (wsError || !workspace) throw wsError ?? new Error("demo workspace");

  await admin
    .from("workspaces")
    .update({ payout_type: "upi", payout_value: DEMO_UPI, plan: "free" })
    .eq("id", workspace.id);

  return workspace;
}

async function ensureDemoClient(admin: AdminClient, workspaceId: string) {
  const { data: existingClient } = await admin
    .from("clients")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("email", "ops@acme.example")
    .maybeSingle();

  if (existingClient) return existingClient;

  const { data: inserted, error: clientError } = await admin
    .from("clients")
    .insert({ workspace_id: workspaceId, name: "Acme", email: "ops@acme.example" })
    .select("*")
    .single();
  if (clientError || !inserted) throw clientError ?? new Error("demo client");
  return inserted;
}

async function insertFreshDemoDocument(
  admin: AdminClient,
  workspaceId: string,
  clientId: string,
) {
  const line = { label: "Homepage + CMS", qty: 1, unit_amount: 120000 };
  const frozen = buildFrozenPayload({
    title: "Acme site rebuild",
    scope_html: DEMO_SCOPE,
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
      workspace_id: workspaceId,
      client_id: clientId,
      public_id: DEMO_PUBLIC_ID,
      title: "Acme site rebuild",
      scope_html: DEMO_SCOPE,
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
}
