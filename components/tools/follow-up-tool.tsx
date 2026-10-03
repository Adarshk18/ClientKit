"use client";

import { useMemo, useState } from "react";
import { NumberField, Segmented, SelectField, TextField } from "@/components/tools/fields";
import { OutputBlock } from "@/components/tools/output-block";
import { useToolCurrency } from "@/components/tools/use-tool-currency";
import { TOOL_CURRENCIES, exampleAmountFor } from "@/lib/tools/format";
import {
  DEFAULT_LADDER,
  SITUATIONS,
  generateLadder,
  suggestStartStep,
  type LadderAction,
  type LadderInput,
  type Relationship,
  type Situation,
} from "@/lib/tools/follow-up-ladder";

type ChannelChoice = "whatsapp" | "email" | "both";

export function FollowUpTool() {
  const [channel, setChannel] = useState<ChannelChoice>("whatsapp");
  const [state, setState] = useState<Omit<LadderInput, "currency" | "channel">>(() => {
    const { currency: _c, channel: _ch, ...rest } = DEFAULT_LADDER;
    void _c;
    void _ch;
    return rest;
  });
  const set = <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => setState((s) => ({ ...s, [key]: value }));
  const [currency, setCurrency] = useToolCurrency(DEFAULT_LADDER.currency, (from, to) =>
    // Only swap the example amount if the visitor has not typed their own yet.
    setState((s) => (s.amount === DEFAULT_LADDER.amount ? { ...s, amount: exampleAmountFor(DEFAULT_LADDER.amount, to) } : s)),
  );

  const wa = useMemo(() => generateLadder({ ...state, currency, channel: "whatsapp" }), [state, currency]);
  const em = useMemo(() => generateLadder({ ...state, currency, channel: "email" }), [state, currency]);
  const needsAmount = SITUATIONS.find((s) => s.value === state.situation)?.needsAmount ?? false;
  const start = suggestStartStep(state.daysSince);

  return (
    <section aria-labelledby="tool-heading" className="mt-6 grid gap-6 lg:grid-cols-5">
      <h2 id="tool-heading" className="sr-only">
        Follow-up message maker
      </h2>
      <a href="#tool-output" className="text-[13px] font-medium text-stamp underline underline-offset-2 lg:hidden">
        Jump to your message
      </a>
      <form className="space-y-4 lg:col-span-2" onSubmit={(e) => e.preventDefault()} aria-label="Situation details">
        <SelectField
          label="What happened?"
          value={state.situation}
          onChange={(v: Situation) => set("situation", v)}
          options={SITUATIONS.map((s) => ({ value: s.value, label: s.label }))}
        />
        <Segmented
          label="Show me"
          value={channel}
          onChange={setChannel}
          options={[
            { value: "whatsapp", label: "WhatsApp" },
            { value: "email", label: "Email" },
            { value: "both", label: "Both" },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Client first name" value={state.clientName} onChange={(v) => set("clientName", v)} />
          <TextField label="Your name" value={state.yourName} onChange={(v) => set("yourName", v)} />
        </div>
        <TextField label="Project name" value={state.project} onChange={(v) => set("project", v)} />
        <NumberField
          label="Days since their last reply"
          value={state.daysSince}
          onChange={(v) => set("daysSince", v)}
          hint="Only used to word the messages and suggest where to start."
        />
        {needsAmount ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <NumberField label="Amount" value={state.amount} onChange={(v) => set("amount", v)} />
              <SelectField
                label="Currency"
                value={currency}
                onChange={setCurrency}
                options={TOOL_CURRENCIES.map((c) => ({ value: c, label: c }))}
              />
            </div>
            <TextField
              label="Invoice or reference number (optional)"
              value={state.reference}
              onChange={(v) => set("reference", v)}
              hint="You do not need an invoice. Leave it empty if you have none."
            />
            <TextField
              label="How to pay (optional)"
              value={state.howToPay}
              onChange={(v) => set("howToPay", v)}
              placeholder="UPI ID aarav@okaxis"
            />
          </>
        ) : null}
        <Segmented
          label="Your relationship"
          value={state.relationship}
          onChange={(v: Relationship) => set("relationship", v)}
          options={[
            { value: "new", label: "New client" },
            { value: "regular", label: "Regular client" },
            { value: "company", label: "Large company" },
          ]}
        />
        <SelectField
          label="If they do not reply, you will"
          value={state.action}
          onChange={(v: LadderAction) => set("action", v)}
          options={[
            { value: "none", label: "Nothing in particular" },
            { value: "close_file", label: "Close the file" },
            { value: "pause_work", label: "Pause work" },
          ]}
          hint="Only pick something you will really do."
        />
        <TextField
          label="Deadline for the last messages (optional)"
          hint="If you leave it empty, the messages say by the end of this week."
          value={state.deadline}
          onChange={(v) => set("deadline", v)}
          placeholder="Friday, or a date like 18 Oct"
        />
        <p className="text-[12px] leading-4 text-muted">Nothing is saved. Everything stays in this browser tab.</p>
      </form>

      <div id="tool-output" className="scroll-mt-16 space-y-4 lg:col-span-3" aria-live="polite">
        <div className="border border-line bg-paper p-3 text-[14px] leading-6">
          <p className="font-medium">{start.text}</p>
          <p className="text-muted">Four messages, from polite to firm. Send one, wait for the gap, then send the next.</p>
        </div>
        {wa.steps.map((s, i) => {
          const e = em.steps[i]!;
          return (
            <div key={s.step} className="space-y-3 border-l-2 border-line pl-3 sm:pl-4">
              <h3 className="font-serif text-[1.1rem] font-medium">
                Step {s.step}: {s.label}
              </h3>
              <p className="text-[13px] text-muted">{s.when}</p>
              {channel !== "email" ? (
                <OutputBlock title={`Step ${s.step} on WhatsApp`} text={s.body} whatsapp />
              ) : null}
              {channel !== "whatsapp" ? (
                <OutputBlock title={`Step ${s.step} by email`} subject={e.subject} text={e.body} email />
              ) : null}
            </div>
          );
        })}
        <div className="border border-line p-3 sm:p-4">
          <h3 className="font-serif text-[1.05rem] font-medium">Before you send</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px] leading-6">
            <li>Check if they already replied.</li>
            {needsAmount ? <li>Check if they already paid. Look in your bank or UPI app.</li> : null}
            <li>Ask one question per message.</li>
            <li>Keep a copy of what you sent and when.</li>
            {wa.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
