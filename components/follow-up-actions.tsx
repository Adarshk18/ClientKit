"use client";

import { useState, useTransition } from "react";
import { markNudgedAction } from "@/lib/actions/documents";
import { mailtoHref, whatsappHref, type FollowUpMessage } from "@/lib/followups";
import { btnSecondary } from "@/lib/ui";

/**
 * Opens a prefilled WhatsApp or email, or copies the text. Client Kit does not send anything.
 * Tapping any of the three only records the time, so the job drops off the "needs a nudge" list for a bit.
 */
export function FollowUpActions({
  documentId,
  clientEmail,
  polite,
  firm,
  initialStep,
}: {
  documentId: string;
  clientEmail: string;
  polite: FollowUpMessage;
  firm: FollowUpMessage;
  initialStep: 1 | 2;
}) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const message = step === 1 ? polite : firm;

  function remember() {
    startTransition(async () => {
      const result = await markNudgedAction(documentId);
      if (result.ok) setDone(true);
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          className={btnSecondary}
          href={whatsappHref(message.text)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={remember}
        >
          Open in WhatsApp
        </a>
        <a className={btnSecondary} href={mailtoHref(clientEmail, message.subject, message.body)} onClick={remember}>
          Open in email
        </a>
        <button
          type="button"
          className={btnSecondary}
          onClick={async () => {
            await navigator.clipboard.writeText(message.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            remember();
          }}
        >
          {copied ? "Copied" : "Copy message"}
        </button>
      </div>
      <details className="group">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] text-stamp">
          Read or change the message ({step === 1 ? "polite first" : "firmer second"})
        </summary>
        <div className="mt-2 space-y-3">
          <div className="flex gap-4 text-[13px]" role="group" aria-label="Tone">
            <button
              type="button"
              aria-pressed={step === 1}
              onClick={() => setStep(1)}
              className={`min-h-11 border-b ${step === 1 ? "border-ink text-ink" : "border-transparent text-muted"}`}
            >
              Polite first
            </button>
            <button
              type="button"
              aria-pressed={step === 2}
              onClick={() => setStep(2)}
              className={`min-h-11 border-b ${step === 2 ? "border-ink text-ink" : "border-transparent text-muted"}`}
            >
              Firmer second
            </button>
          </div>
          <p
            className="whitespace-pre-line rounded-sm border border-line bg-white p-3 text-[13px] leading-relaxed"
            data-testid="followup-text"
          >
            {message.text}
          </p>
        </div>
      </details>
      <p className="text-xs text-muted">
        {done
          ? "Noted. This job stays off the list for 2 days. You send the message yourself."
          : "Client Kit does not send this. It opens in your app and you press send."}
      </p>
    </div>
  );
}
