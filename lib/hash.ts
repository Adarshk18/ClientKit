import { createHash } from "node:crypto";
import type { FrozenPayload } from "@/lib/types";

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function hashFrozenPayload(payload: FrozenPayload): string {
  return sha256(stableStringify(payload));
}

export function buildFrozenPayload(input: {
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
}): FrozenPayload {
  return {
    title: input.title,
    scope_html: input.scope_html,
    currency: input.currency,
    line_items: input.line_items.map((item) => ({
      label: item.label,
      qty: Number(item.qty),
      unit_amount: item.unit_amount,
    })),
    subtotal: input.subtotal,
    deposit_percent: input.deposit_percent,
    deposit_amount: input.deposit_amount,
    amount_due: input.amount_due,
    remainder_amount: input.remainder_amount,
    client_name: input.client_name,
    client_email: input.client_email,
    workspace_name: input.workspace_name,
  };
}
