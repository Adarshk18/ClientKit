export const DOC_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "signed",
  "paid",
  "expired",
  "void",
] as const;

export type DocStatus = (typeof DOC_STATUSES)[number];

export const PLANS = ["free", "founder", "solo", "busy"] as const;
export type Plan = (typeof PLANS)[number];

export const PLAN_STATUSES = ["active", "past_due", "canceled", "read_only"] as const;
export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const PAYOUT_TYPES = ["upi", "url"] as const;
export type PayoutType = (typeof PAYOUT_TYPES)[number];

export type LineItemInput = {
  label: string;
  qty: number;
  unit_amount: number;
};

export type FrozenPayload = {
  title: string;
  scope_html: string;
  currency: string;
  line_items: { label: string; qty: number; unit_amount: number }[];
  subtotal: number;
  deposit_percent: number;
  deposit_amount: number;
  amount_due: number;
  remainder_amount: number;
  client_name: string;
  client_email: string;
  workspace_name: string;
};

export type WorkspaceRow = {
  id: string;
  owner_id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  country: string;
  payout_type: PayoutType | null;
  payout_value: string | null;
  plan: Plan;
  plan_status: PlanStatus;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  docs_sent_this_period: number;
  period_reset_at: string;
  grace_until: string | null;
};

export type ClientRow = {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
};

export type DocumentRow = {
  id: string;
  workspace_id: string;
  client_id: string;
  public_id: string;
  title: string;
  scope_html: string;
  currency: string;
  subtotal: number;
  deposit_percent: number;
  deposit_amount: number;
  amount_due: number;
  remainder_amount: number;
  status: DocStatus;
  expires_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  paid_at: string | null;
  payment_marked_by: string | null;
  payment_status: "unpaid" | "payment_sent" | "paid";
  frozen_payload: FrozenPayload | null;
  frozen_hash: string | null;
  deleted_at: string | null;
  version: number;
  supersedes_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LineItemRow = {
  id: string;
  document_id: string;
  label: string;
  qty: number;
  unit_amount: number;
  sort_order: number;
};

export type SignatureRow = {
  id: string;
  document_id: string;
  signer_name: string;
  signer_email: string;
  signed_at: string;
  ip: string | null;
  user_agent: string | null;
  document_hash: string;
};

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };
