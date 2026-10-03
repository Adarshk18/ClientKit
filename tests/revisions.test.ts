import { describe, expect, it } from "vitest";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { revisionClause, revisionTermsFrom } from "@/lib/revisions";
import { documentInputSchema } from "@/lib/validators";
import { buildAgreedTerms } from "@/lib/agreed-terms";

const base = {
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
};

describe("revision terms", () => {
  it("leaves the frozen payload and hash of older documents untouched", () => {
    const old = buildFrozenPayload(base);
    expect("revisions" in old).toBe(false);
    expect(hashFrozenPayload(buildFrozenPayload({ ...base, revisions_included: null, revision_extra_price: null }))).toBe(
      hashFrozenPayload(old),
    );
  });

  it("puts the agreed revisions in the payload and changes the hash", () => {
    const withRev = buildFrozenPayload({ ...base, revisions_included: 2, revision_extra_price: 5000 });
    expect(withRev.revisions).toEqual({ included: 2, extra_price: 5000 });
    expect(hashFrozenPayload(withRev)).not.toBe(hashFrozenPayload(buildFrozenPayload(base)));
    expect(hashFrozenPayload(withRev)).not.toBe(
      hashFrozenPayload(buildFrozenPayload({ ...base, revisions_included: 3, revision_extra_price: 5000 })),
    );
    expect(buildAgreedTerms(withRev).revisions).toEqual({ included: 2, extra_price: 5000 });
    expect(buildAgreedTerms(buildFrozenPayload(base)).revisions).toBeUndefined();
  });

  it("reads columns safely", () => {
    expect(revisionTermsFrom({})).toBeNull();
    expect(revisionTermsFrom({ revisions_included: null })).toBeNull();
    expect(revisionTermsFrom({ revisions_included: -1 })).toBeNull();
    expect(revisionTermsFrom({ revisions_included: 2, revision_extra_price: null })).toEqual({ included: 2, extra_price: null });
    expect(revisionTermsFrom({ revisions_included: 2, revision_extra_price: 0 })).toEqual({ included: 2, extra_price: null });
    expect(revisionTermsFrom({ revisions_included: 0, revision_extra_price: 2500 })).toEqual({ included: 0, extra_price: 2500 });
  });

  it("writes plain wording for 0, 1 and many rounds, with and without a price", () => {
    expect(revisionClause({ included: 2, extra_price: 5000 }, "USD").join(" ")).toBe(
      "This price includes 2 rounds of revisions. A round means one set of feedback, sent together. Each extra round costs $50.00.",
    );
    expect(revisionClause({ included: 1, extra_price: null }, "USD").join(" ")).toContain("includes 1 round of revisions");
    expect(revisionClause({ included: 1, extra_price: null }, "USD").join(" ")).toContain("quoted before any extra work");
    expect(revisionClause({ included: 0, extra_price: 2500 }, "INR").join(" ")).toContain("does not include any rounds");
    expect(revisionClause({ included: 0, extra_price: 2500 }, "INR").join(" ")).toContain("Each round of changes costs");
    for (const terms of [{ included: 0, extra_price: null }, { included: 2, extra_price: 100 }]) {
      expect(revisionClause(terms, "USD").join(" ")).not.toContain("\u2014");
    }
  });

  it("validates the form fields and defaults to no clause", () => {
    const input = {
      client_name: "A", client_email: "a@b.co", title: "T", scope_html: "", currency: "usd",
      deposit_percent: 30, line_items: [],
    };
    const none = documentInputSchema.parse(input);
    expect(none.revisions_included).toBeNull();
    expect(documentInputSchema.safeParse({ ...input, revisions_included: 2, revision_extra_price: 5000 }).success).toBe(true);
    expect(documentInputSchema.safeParse({ ...input, revisions_included: 21 }).success).toBe(false);
    expect(documentInputSchema.safeParse({ ...input, revisions_included: 1.5 }).success).toBe(false);
    expect(documentInputSchema.safeParse({ ...input, revisions_included: Number.NaN }).success).toBe(false);
    expect(documentInputSchema.safeParse({ ...input, revisions_included: 2, revision_extra_price: -1 }).success).toBe(false);
  });
});
