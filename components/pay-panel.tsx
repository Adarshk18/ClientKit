"use client";

import { useState, useTransition } from "react";
import { markPaymentSentAction } from "@/lib/actions/sign";
import { CopyButton } from "@/components/copy-button";
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
}: {
  publicId: string;
  amountDue: number;
  currency: string;
  payoutType: "upi" | "url" | null;
  payoutValue: string | null;
  workspaceName: string;
  title: string;
  alreadySent: boolean;
}) {
  const [sent, setSent] = useState(alreadySent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!payoutType || !payoutValue) {
    return (
      <p className="text-sm text-muted">
        This freelancer has not added a payout method yet. You can still sign. They will follow up for payment.
      </p>
    );
  }

  if (payoutType === "upi") {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          Pay {formatMoney(amountDue, currency)} to{" "}
          <span className="font-medium">{workspaceName}</span> via UPI.
        </p>
        <div className="flex flex-col items-start gap-4 sm:flex-row">
          <UpiQr
            vpa={payoutValue}
            payeeName={workspaceName}
            amountMinor={amountDue}
            currency={currency}
            note={title}
          />
          <div>
            <p className="font-mono text-lg">{payoutValue}</p>
            <div className="mt-2">
              <CopyButton value={payoutValue} label="Copy VPA" />
            </div>
          </div>
        </div>
        {sent ? (
          <p className="text-sm text-stamp">Marked as payment sent. The freelancer will confirm when it arrives.</p>
        ) : (
          <button
            type="button"
            disabled={pending}
            className={btnSecondary}
            onClick={() => {
              startTransition(async () => {
                const result = await markPaymentSentAction(publicId);
                if (!result.ok) setError(result.error);
                else setSent(true);
              });
            }}
          >
            {pending ? "Saving…" : "I’ve sent the payment"}
          </button>
        )}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        Pay {formatMoney(amountDue, currency)} using the freelancer’s payment link. Client Kit does not take this
        money.
      </p>
      <a
        href={payoutValue}
        target="_blank"
        rel="noopener noreferrer"
        className={btnPrimary}
        onClick={() => {
          startTransition(async () => {
            await markPaymentSentAction(publicId);
            setSent(true);
          });
        }}
      >
        Pay {formatMoney(amountDue, currency)}
      </a>
      {sent ? (
        <p className="text-sm text-stamp">Payment link opened. The freelancer will mark this paid when it lands.</p>
      ) : null}
    </div>
  );
}
