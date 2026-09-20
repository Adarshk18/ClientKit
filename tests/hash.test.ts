import { describe, expect, it } from "vitest";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { canSign, effectiveStatus } from "@/lib/document-state";

const payload = () =>
  buildFrozenPayload({
    title: "Acme",
    scope_html: "<p>Work</p>",
    currency: "USD",
    line_items: [{ label: "Site", qty: 1, unit_amount: 120000 }],
    subtotal: 120000,
    deposit_percent: 50,
    deposit_amount: 60000,
    amount_due: 60000,
    remainder_amount: 60000,
    client_name: "Acme",
    client_email: "ops@acme.example",
    workspace_name: "Studio North",
  });

describe("hashFrozenPayload", () => {
  it("is stable regardless of key insertion order", () => {
    const a = hashFrozenPayload(payload());
    const b = hashFrozenPayload(payload());
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it("changes when the amount changes", () => {
    const original = hashFrozenPayload(payload());
    const changed = hashFrozenPayload({ ...payload(), amount_due: 60001 });
    expect(changed).not.toBe(original);
  });
});

describe("signing gates", () => {
  it("rejects expired documents", () => {
    const expired = canSign("sent", new Date(Date.now() - 1000).toISOString());
    expect(expired.ok).toBe(false);
    expect(effectiveStatus("sent", new Date(Date.now() - 1000).toISOString())).toBe("expired");
  });

  it("rejects already signed", () => {
    expect(canSign("signed", null).ok).toBe(false);
  });

  it("allows sent documents that are still open", () => {
    expect(canSign("sent", new Date(Date.now() + 60_000).toISOString()).ok).toBe(true);
  });
});
