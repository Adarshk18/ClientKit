"use client";

import { useMemo, useState } from "react";
import { NumberField, Segmented, SelectField, TextField, Toggle } from "@/components/tools/fields";
import { OutputBlock } from "@/components/tools/output-block";
import { useToolCurrency } from "@/components/tools/use-tool-currency";
import { DEFAULT_ADVANCE, generateAdvanceMessages, type AdvanceInput } from "@/lib/tools/advance-message";
import { moneyText } from "@/lib/tools/format";
import { TOOL_CURRENCIES } from "@/lib/tools/format";

export function AdvanceTool() {
  const [currency, setCurrency] = useToolCurrency(DEFAULT_ADVANCE.currency);
  const [state, setState] = useState<Omit<AdvanceInput, "currency">>(() => {
    const { currency: _c, ...rest } = DEFAULT_ADVANCE;
    void _c;
    return rest;
  });
  const set = <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => setState((s) => ({ ...s, [key]: value }));

  const input: AdvanceInput = { ...state, currency };
  const result = useMemo(() => generateAdvanceMessages(input), [input.channel, input.tone, input.style, input.clientName, input.yourName, input.project, input.fee, input.currency, input.advanceType, input.advanceValue, input.balanceDue, input.howToPay, input.start, input.mentionProposal, input.firstProject, input.askUtr, input.proformaLine]); // eslint-disable-line react-hooks/exhaustive-deps

  const email = input.channel === "email";

  return (
    <section aria-labelledby="tool-heading" className="mt-6 grid gap-6 lg:grid-cols-5">
      <h2 id="tool-heading" className="sr-only">
        Advance payment message maker
      </h2>
      <a href="#tool-output" className="text-[13px] font-medium text-stamp underline underline-offset-2 lg:hidden">
        Jump to your message
      </a>
      <form className="space-y-4 lg:col-span-2" onSubmit={(e) => e.preventDefault()} aria-label="Message details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <Segmented
            label="Where will you send it?"
            value={state.channel}
            onChange={(v) => set("channel", v)}
            options={[
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
            ]}
          />
          <Segmented
            label="Tone"
            value={state.tone}
            onChange={(v) => set("tone", v)}
            options={[
              { value: "friendly", label: "Friendly" },
              { value: "professional", label: "Professional" },
              { value: "firm", label: "Firm" },
            ]}
          />
        </div>
        <Segmented
          label="Language style"
          value={state.style}
          onChange={(v) => set("style", v)}
          options={[
            { value: "simple", label: "Simple English" },
            { value: "indian", label: "Indian business English" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Client first name" value={state.clientName} onChange={(v) => set("clientName", v)} placeholder="Priya" />
          <TextField label="Your name" value={state.yourName} onChange={(v) => set("yourName", v)} placeholder="Aarav" />
        </div>
        <TextField label="Project name" value={state.project} onChange={(v) => set("project", v)} placeholder="website redesign" />
        <div className="grid grid-cols-2 gap-4">
          <NumberField label="Total fee" value={state.fee} onChange={(v) => set("fee", v)} />
          <SelectField
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={TOOL_CURRENCIES.map((c) => ({ value: c, label: c }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SelectField
            label="Advance is"
            value={state.advanceType}
            onChange={(v) => set("advanceType", v)}
            options={[
              { value: "percent", label: "A percent of the fee" },
              { value: "fixed", label: "A fixed amount" },
            ]}
          />
          <NumberField
            label={state.advanceType === "percent" ? "Advance percent" : "Advance amount"}
            value={state.advanceValue}
            onChange={(v) => set("advanceValue", v)}
          />
        </div>
        <TextField
          label="When is the balance due?"
          value={state.balanceDue}
          onChange={(v) => set("balanceDue", v)}
          placeholder="on delivery"
          hint="For example: on delivery, on approval, within 7 days of delivery."
        />
        <TextField
          label="How should they pay?"
          value={state.howToPay}
          onChange={(v) => set("howToPay", v)}
          placeholder="UPI ID aarav@okaxis"
          hint="A UPI ID, payment link or bank details. It is not checked, so type it carefully."
        />
        <TextField
          label="When does work start? (optional)"
          value={state.start}
          onChange={(v) => set("start", v)}
          placeholder="on Monday"
        />
        <fieldset>
          <legend className="text-[13px] font-medium">Add these lines if you want them</legend>
          <Toggle label="Mention the signed proposal" checked={state.mentionProposal} onChange={(v) => set("mentionProposal", v)} />
          <Toggle label="Mention it is our first project together" checked={state.firstProject} onChange={(v) => set("firstProject", v)} />
          <Toggle label="Ask them to send a screenshot or UTR after paying" checked={state.askUtr} onChange={(v) => set("askUtr", v)} />
          <Toggle
            label="Say a proforma invoice can be shared if their accounts team needs one"
            checked={state.proformaLine}
            onChange={(v) => set("proformaLine", v)}
          />
        </fieldset>
        <p className="text-[12px] leading-4 text-muted">Nothing is saved. Everything stays in this browser tab.</p>
      </form>

      <div id="tool-output" className="scroll-mt-16 space-y-4 lg:col-span-3" aria-live="polite">
        <div className="border border-line bg-paper p-3 text-[14px] leading-6">
          <p className="font-medium">
            {result.problems.length === 0 || result.advance > 0
              ? `Advance ${moneyText(result.advance, currency)}, balance ${moneyText(result.balance, currency)}`
              : "Add the details on the left"}
            {result.advance > 0 ? ` (${result.percent}% now)` : ""}
          </p>
          {result.problems.map((p) => (
            <p key={p} className="text-danger">
              {p}
            </p>
          ))}
        </div>
        {result.versions.map((v, i) => (
          <OutputBlock
            key={v.key}
            title={`${v.label} version`}
            badge={i === 0 ? "Your pick" : undefined}
            subject={email ? v.subject : undefined}
            text={v.body}
            whatsapp={!email}
            email={email}
          />
        ))}
        <div className="border border-line p-3 sm:p-4">
          <h3 className="font-serif text-[1.05rem] font-medium">Check before you send</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6">
            {result.checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
