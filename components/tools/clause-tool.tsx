"use client";

import { useMemo, useState } from "react";
import { NumberField, Segmented, SelectField, TextArea, TextField, Toggle } from "@/components/tools/fields";
import { OutputBlock } from "@/components/tools/output-block";
import { useToolCurrency } from "@/components/tools/use-tool-currency";
import { DEFAULT_CLAUSE, generateClauses, type ClauseInput, type ExtraRoundPricing, type LatePayment, type Refund, type Strictness } from "@/lib/tools/clauses";
import { TOOL_CURRENCIES } from "@/lib/tools/format";

const OUT_OF_SCOPE_CHIPS = ["Hosting and domain", "Stock assets", "Copywriting", "Ongoing support", "Extra pages", "Anything not listed above"];

const HOW_TO_SAY: Record<string, string> = {
  scope: "Here is what the project covers and what it does not. Tell me if you want to add anything before you sign.",
  revisions: "The fee includes the revision rounds below. If you need more later, I will quote the extra round before I start it.",
  payment: "Here are the payment terms. Let me know if anything needs a tweak before you sign.",
};

export function ClauseTool() {
  const [currency, setCurrency] = useToolCurrency(DEFAULT_CLAUSE.currency);
  const [state, setState] = useState<Omit<ClauseInput, "currency">>(() => {
    const { currency: _c, ...rest } = DEFAULT_CLAUSE;
    void _c;
    return rest;
  });
  const set = <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => setState((s) => ({ ...s, [key]: value }));
  const result = useMemo(() => generateClauses({ ...state, currency }), [state, currency]);

  function addChip(chip: string) {
    const lines = state.outOfScope.split(/\r?\n/).map((l) => l.trim());
    if (lines.includes(chip)) return;
    set("outOfScope", [...lines.filter(Boolean), chip].join("\n"));
  }

  return (
    <section aria-labelledby="tool-heading" className="mt-6 grid gap-6 lg:grid-cols-5">
      <h2 id="tool-heading" className="sr-only">
        Clause maker
      </h2>
      <a href="#tool-output" className="text-[13px] font-medium text-stamp underline underline-offset-2 lg:hidden">
        Jump to your terms
      </a>
      <form className="space-y-6 lg:col-span-2" onSubmit={(e) => e.preventDefault()} aria-label="Clause details">
        <Segmented
          label="Wording"
          value={state.strictness}
          onChange={(v: Strictness) => set("strictness", v)}
          options={[
            { value: "friendly", label: "Friendly" },
            { value: "standard", label: "Standard" },
            { value: "strict", label: "Strict" },
          ]}
        />

        <fieldset className="space-y-4">
          <legend className="font-serif text-[1.1rem] font-medium">Scope</legend>
          <TextField label="Project name" value={state.project} onChange={(v) => set("project", v)} />
          <TextArea label="Deliverables (one per line)" rows={4} value={state.deliverables} onChange={(v) => set("deliverables", v)} />
          <div>
            <TextArea label="Not included (one per line)" rows={3} value={state.outOfScope} onChange={(v) => set("outOfScope", v)} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OUT_OF_SCOPE_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => addChip(c)}
                  className="min-h-9 border border-line bg-cream px-2.5 text-[12px] hover:bg-paper"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>
          <TextField label="Timeline" value={state.timeline} onChange={(v) => set("timeline", v)} />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-[1.1rem] font-medium">Revisions</legend>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Included rounds" value={state.revisionRounds} onChange={(v) => set("revisionRounds", v)} max={20} />
            <NumberField label="Feedback window (days)" value={state.feedbackDays} onChange={(v) => set("feedbackDays", v)} min={1} max={60} />
          </div>
          <TextField label="What counts as one round" value={state.roundMeaning} onChange={(v) => set("roundMeaning", v)} />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Extra rounds cost"
              value={state.extraPricing}
              onChange={(v: ExtraRoundPricing) => set("extraPricing", v)}
              options={[
                { value: "fixed", label: "A fixed price" },
                { value: "hourly", label: "An hourly rate" },
                { value: "quote", label: "Quoted case by case" },
              ]}
            />
            {state.extraPricing !== "quote" ? (
              <NumberField label="Amount" value={state.extraAmount} onChange={(v) => set("extraAmount", v)} />
            ) : null}
          </div>
          <TextField label="What is not a revision" value={state.notRevisions} onChange={(v) => set("notRevisions", v)} />
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-serif text-[1.1rem] font-medium">Payment</legend>
          <div className="grid grid-cols-2 gap-4">
            <NumberField label="Total fee" value={state.fee} onChange={(v) => set("fee", v)} />
            <SelectField label="Currency" value={currency} onChange={setCurrency} options={TOOL_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </div>
          <NumberField label="Advance percent (0 for none)" value={state.advancePercent} onChange={(v) => set("advancePercent", v)} max={100} />
          <TextField label="Balance due" value={state.balanceDue} onChange={(v) => set("balanceDue", v)} />
          <TextField label="How to pay" value={state.howToPay} onChange={(v) => set("howToPay", v)} />
          <SelectField
            label="If a payment is late"
            value={state.latePayment}
            onChange={(v: LatePayment) => set("latePayment", v)}
            options={[
              { value: "none", label: "Say nothing" },
              { value: "pause", label: "Pause work until paid" },
            ]}
          />
          <NumberField label="Quote valid for (days)" value={state.validDays} onChange={(v) => set("validDays", v)} max={180} />
          <SelectField
            label="Advance refunds"
            value={state.refund}
            onChange={(v: Refund) => set("refund", v)}
            options={[
              { value: "none", label: "Leave out" },
              { value: "non_refundable", label: "Non-refundable once work starts" },
              { value: "refundable_before_start", label: "Refundable before work starts" },
            ]}
            hint="Wording on refunds varies by place. Check it before you use it."
          />
          <Toggle label="Taxes (such as GST) are extra if applicable" checked={state.taxesExtra} onChange={(v) => set("taxesExtra", v)} />
        </fieldset>
        <p className="text-[12px] leading-4 text-muted">Nothing is saved. Everything stays in this browser tab.</p>
      </form>

      <div id="tool-output" className="scroll-mt-16 space-y-4 lg:col-span-3" aria-live="polite">
        {result.problems.length > 0 ? (
          <div className="border border-line bg-paper p-3 text-[14px] leading-6 text-danger">
            {result.problems.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ) : null}
        {result.clauses.map((c, i) => (
          <div key={c.id} className="space-y-1">
            <OutputBlock title={`${i + 1}. ${c.title}`} text={c.plain} />
            <p className="text-[13px] text-muted">How to say it: &quot;{HOW_TO_SAY[c.id]}&quot;</p>
          </div>
        ))}
        <OutputBlock title="All three together" badge="Paste under a Terms heading" text={result.fullText} download="proposal-terms.txt" />
      </div>
    </section>
  );
}
