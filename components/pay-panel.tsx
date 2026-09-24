"use client";

import { useState, useTransition } from "react";
import { markPaymentSentAction } from "@/lib/actions/sign";
import { CopyButton } from "@/components/copy-button";
import { Spinner } from "@/components/spinner";
import { UpiQr } from "@/components/upi-qr";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { formatMoney } from "@/lib/money";

export function PayPanel({
  publicId,
  amountDue,
  currency,
  payoutType,
  payoutValue,
  workspaceName,
  title,
  alreadySent,
  paymentReference,
}: {
  publicId: string;
  amountDue: number;
  currency: string;
  payoutType: "upi" | "url" | null;
  payoutValue: string | null;
  workspaceName: string;
  title: string;
  alreadySent: boolean;
  paymentReference?: string | null;
}) {
  const [sent, setSent] = useState(alreadySent);
  const [savedReference, setSavedReference] = useState(paymentReference ?? "");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function claimPayment() {
    startTransition(async () => {
      const result = await markPaymentSentAction(publicId, {
        reference: reference || undefined,
        note: note || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSavedReference(reference.trim());
      setSent(true);
    });
  }

  if (!payoutType || !payoutValue) {
    return (
      <p className="text-sm text-muted">
        This freelancer has not added a payout method yet. You can still sign. They will follow up for payment.
      </p>
    );
  }

  const claimForm = sent ? (
    <div className="rounded-sm border border-line bg-white p-3 space-y-1">
      <p className="text-sm text-stamp font-medium">Waiting for freelancer to confirm</p>
      <p className="text-sm text-muted">
        You marked this as paid. Client Kit never holds the funds — they will confirm when it arrives.
      </p>
      {savedReference ? (
        <p className="text-sm">
          Reference: <span className="font-mono">{savedReference}</span>
        </p>
      ) : null}
    </div>
  ) : (
    <div className="space-y-3 rounded-sm border border-line bg-white p-3">
      <div>
        <label htmlFor="pay-ref" className="block text-[12px] text-muted">
          UPI / reference ID <span className="text-muted">(optional)</span>
        </label>
        <input
          id="pay-ref"
          type="text"
          maxLength={120}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="e.g. UPI txn ID"
          className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
      <div>
        <label htmlFor="pay-note" className="block text-[12px] text-muted">
          Note <span className="text-muted">(optional)</span>
        </label>
        <input
          id="pay-note"
          type="text"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything the freelancer should know"
          className="mt-1 w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        />
      </div>
      <button type="button" disabled={pending} className={btnPrimary} onClick={claimPayment}>
        {pending ? <Spinner label="Saving" /> : "I've paid"}
      </button>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );

  if (payoutType === "upi") {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Pay {formatMoney(amountDue, currency)} to{" "}
          <span className="font-medium">{workspaceName}</span> via UPI.
        </p>
        <div className="flex flex-col items-start gap-4 min-[480px]:flex-row landscape:flex-row">
          <UpiQr
            vpa={payoutValue}
            payeeName={workspaceName}
            amountMinor={amountDue}
            currency={currency}
            note={title}
          />
          <div>
            <p className="break-all font-mono text-base sm:text-lg">{payoutValue}</p>
            <div className="mt-2">
              <CopyButton value={payoutValue} label="Copy VPA" />
            </div>
          </div>
        </div>
        {claimForm}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Pay {formatMoney(amountDue, currency)} using the freelancer&apos;s payment link. Client Kit does not take this
        money.
      </p>
      <a
        href={payoutValue}
        target="_blank"
        rel="noopener noreferrer"
        className={btnSecondary}
      >
        Open payment link · {formatMoney(amountDue, currency)}
      </a>
      {claimForm}
    </div>
  );
}
