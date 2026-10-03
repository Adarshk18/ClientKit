import { formatMoney } from "@/lib/money";

export const MAX_REVISION_ROUNDS = 20;

export type RevisionTerms = {
  included: number;
  /** Price of one extra round in minor units. null means "quoted before the work starts". */
  extra_price: number | null;
};

/** Read the two document columns. Returns null when the document has no revision clause. */
export function revisionTermsFrom(doc: {
  revisions_included?: number | null;
  revision_extra_price?: number | null;
}): RevisionTerms | null {
  const included = doc.revisions_included;
  if (included === null || included === undefined || !Number.isInteger(included) || included < 0) return null;
  const price = doc.revision_extra_price;
  return {
    included,
    extra_price: typeof price === "number" && Number.isInteger(price) && price > 0 ? price : null,
  };
}

/** Plain-language clause the client reads before signing. */
export function revisionClause(terms: RevisionTerms, currency: string): string[] {
  const rounds =
    terms.included === 0
      ? "This price does not include any rounds of revisions."
      : terms.included === 1
        ? "This price includes 1 round of revisions."
        : `This price includes ${terms.included} rounds of revisions.`;
  const lines = [rounds, "A round means one set of feedback, sent together."];
  if (terms.extra_price) {
    lines.push(
      terms.included === 0
        ? `Each round of changes costs ${formatMoney(terms.extra_price, currency)}.`
        : `Each extra round costs ${formatMoney(terms.extra_price, currency)}.`,
    );
  } else {
    lines.push(
      terms.included === 0
        ? "Changes are quoted before any extra work starts."
        : "Extra rounds are quoted before any extra work starts.",
    );
  }
  return lines;
}

export function revisionSummary(terms: RevisionTerms, currency: string): string {
  return revisionClause(terms, currency).join(" ");
}
