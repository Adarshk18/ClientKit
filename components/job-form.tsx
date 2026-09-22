"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  saveAsNewVersionAction,
  saveDraftAction,
  sendDocumentAction,
} from "@/lib/actions/documents";
import { computeAmounts, formatMoney, fromMinorUnits, parseMajorAmount, toMinorUnits } from "@/lib/money";
import { MAX_LINE_ITEMS } from "@/lib/sanitize";
import { btnPrimary, btnSecondary, fieldArea, fieldClass } from "@/lib/ui";

type Item = { label: string; qty: string; price: string };

export function JobForm({
  mode,
  documentId,
  defaultValues,
  workspaceCurrency,
}: {
  mode: "create" | "draft" | "sent";
  documentId?: string;
  workspaceCurrency: string;
  defaultValues?: {
    client_name: string;
    client_email: string;
    title: string;
    scope_html: string;
    currency: string;
    deposit_percent: number;
    expires_at: string;
    line_items: { label: string; qty: number; unit_amount: number }[];
  };
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [currency, setCurrency] = useState(defaultValues?.currency ?? workspaceCurrency);
  const [deposit, setDeposit] = useState(String(defaultValues?.deposit_percent ?? 100));
  const [items, setItems] = useState<Item[]>(
    defaultValues?.line_items.length
      ? defaultValues.line_items.map((item) => ({
          label: item.label,
          qty: String(item.qty),
          price: String(fromMinorUnits(item.unit_amount, defaultValues?.currency ?? workspaceCurrency)),
        }))
      : [{ label: "", qty: "1", price: "" }],
  );

  const parsedItems = useMemo(
    () =>
      items
        .filter((item) => item.label.trim())
        .map((item) => ({
          label: item.label.trim(),
          qty: Number(item.qty) || 0,
          unit_amount: toMinorUnits(parseMajorAmount(item.price) ?? 0, currency),
        })),
    [items, currency],
  );

  const amounts = computeAmounts(parsedItems, Number(deposit) || 0);

  function buildFormData(form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("line_items", JSON.stringify(parsedItems));
    fd.set("currency", currency);
    fd.set("deposit_percent", deposit);
    if (documentId) fd.set("document_id", documentId);
    const expires = fd.get("expires_at");
    if (typeof expires === "string" && expires) {
      fd.set("expires_at", new Date(expires).toISOString());
    }
    return fd;
  }

  function onSubmit(intent: "save" | "send" | "version") {
    return (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      const fd = buildFormData(event.currentTarget);
      startTransition(async () => {
        if (intent === "version") {
          const result = await saveAsNewVersionAction(null, fd);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/jobs/${result.data.id}`);
          router.refresh();
          return;
        }
        const saved = await saveDraftAction(null, fd);
        if (!saved.ok) {
          setError(saved.error);
          return;
        }
        if (intent === "send") {
          const sent = await sendDocumentAction(saved.data.id);
          if (!sent.ok) {
            setError(sent.error);
            router.push(`/jobs/${saved.data.id}`);
            return;
          }
        }
        router.push(`/jobs/${saved.data.id}`);
        router.refresh();
      });
    };
  }

  const field = fieldClass;

  return (
    <form ref={formRef} onSubmit={onSubmit(mode === "sent" ? "version" : "save")} className="space-y-8">
      {error ? (
        <p className="border border-danger/30 bg-[#f8e8e4] px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Client name
          <input name="client_name" required defaultValue={defaultValues?.client_name} className={field} />
        </label>
        <label className="text-sm">
          Client email
          <input
            name="client_email"
            type="email"
            required
            defaultValue={defaultValues?.client_email}
            className={field}
          />
        </label>
      </section>

      <label className="block text-sm">
        Title
        <input name="title" required defaultValue={defaultValues?.title} className={field} placeholder="Website redesign" />
      </label>

      <label className="block text-sm">
        Scope
        <textarea
          name="scope_html"
          rows={8}
          defaultValue={defaultValues?.scope_html ?? ""}
          className={fieldArea}
          placeholder="What you'll do, what's not included, and the timeline."
        />
        <span className="mt-1 block text-xs text-muted">HTML is sanitized. Scripts and iframes are stripped.</span>
      </label>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-lg">Line items</h2>
          <button
            type="button"
            className="text-sm text-stamp"
            onClick={() => {
              if (items.length >= MAX_LINE_ITEMS) return;
              setItems([...items, { label: "", qty: "1", price: "" }]);
            }}
          >
            Add line
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No line items. Add at least one before sending.</p>
        ) : null}
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <input
                className={`sm:col-span-6 ${field}`}
                placeholder="Label"
                value={item.label}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, label: e.target.value };
                  setItems(next);
                }}
              />
              <input
                className={`sm:col-span-2 ${field}`}
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, qty: e.target.value };
                  setItems(next);
                }}
              />
              <input
                className={`sm:col-span-3 ${field}`}
                placeholder="Price"
                value={item.price}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = { ...item, price: e.target.value };
                  setItems(next);
                }}
              />
              <button
                type="button"
                className="sm:col-span-1 mt-1 h-10 w-full text-sm text-muted sm:w-auto"
                onClick={() => setItems(items.filter((_, i) => i !== index))}
                aria-label="Remove line"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">
          Currency
          <input
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))}
            className={field}
            maxLength={3}
          />
        </label>
        <label className="text-sm">
          Deposit %
          <input
            type="number"
            min={0}
            max={100}
            value={deposit}
            onChange={(e) => setDeposit(e.target.value)}
            className={field}
          />
          <span className="mt-1 block text-xs text-muted">0% and 100% both collect the full amount now.</span>
        </label>
        <label className="text-sm">
          Expires
          <input name="expires_at" type="datetime-local" defaultValue={defaultValues?.expires_at} className={field} />
        </label>
      </section>

      <div className="border border-line bg-cream p-4 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(amounts.subtotal, currency)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Due now</span>
          <span>{formatMoney(amounts.amount_due, currency)}</span>
        </div>
        {amounts.remainder_amount > 0 ? (
          <div className="mt-1 flex justify-between text-muted">
            <span>Due later (not collected in v1)</span>
            <span>{formatMoney(amounts.remainder_amount, currency)}</span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === "sent" ? (
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Saving…" : "Void and save as new version"}
          </button>
        ) : (
          <>
            <button type="submit" disabled={pending} className={btnSecondary}>
              {pending ? "Saving…" : "Save draft"}
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() => {
                const form = formRef.current;
                if (!form) return;
                onSubmit("send")({
                  preventDefault() {},
                  currentTarget: form,
                } as React.FormEvent<HTMLFormElement>);
              }}
            >
              {pending ? "Sending…" : "Save and send"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
