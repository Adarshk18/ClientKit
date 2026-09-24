"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteDraftAction,
  duplicateDocumentAction,
  markPaidAction,
  nudgeClientAction,
  rejectPaymentClaimAction,
  resendDocumentAction,
  sendDocumentAction,
  voidDocumentAction,
} from "@/lib/actions/documents";
import { Spinner } from "@/components/spinner";
import { btnDanger, btnPrimary, btnSecondary } from "@/lib/ui";
import type { DocStatus } from "@/lib/types";

export function JobActions({
  documentId,
  status,
  publicId,
  paymentReference,
}: {
  documentId: string;
  status: DocStatus;
  publicId: string;
  paymentReference?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, next?: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      if (next) router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {status === "payment_sent" ? (
        <div className="rounded-sm border border-line bg-cream p-3 text-sm">
          <p className="text-stamp font-medium">Client says they paid — awaiting confirmation</p>
          {paymentReference ? (
            <p className="mt-1">
              Reference: <span className="font-mono">{paymentReference}</span>
            </p>
          ) : (
            <p className="mt-1 text-muted">No reference ID was provided.</p>
          )}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {status === "draft" ? (
          <>
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() => run(() => sendDocumentAction(documentId))}
            >
              Send
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnDanger}
              onClick={() => run(() => deleteDraftAction(documentId), "/jobs")}
            >
              Delete draft
            </button>
          </>
        ) : null}
        {status === "sent" || status === "viewed" || status === "signed" || status === "payment_sent" ? (
          <button
            type="button"
            disabled={pending}
            className={btnSecondary}
            onClick={() => run(() => nudgeClientAction(documentId))}
          >
            {pending ? <Spinner label="Sending" /> : "Nudge client"}
          </button>
        ) : null}
        {status === "sent" || status === "viewed" ? (
          <>
            <button
              type="button"
              disabled={pending}
              className={btnSecondary}
              onClick={() => run(() => resendDocumentAction(documentId))}
            >
              Resend email
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnDanger}
              onClick={() => run(() => voidDocumentAction(documentId))}
            >
              Void
            </button>
          </>
        ) : null}
        {status === "signed" ? (
          <button
            type="button"
            disabled={pending}
            className={btnPrimary}
            onClick={() => run(() => markPaidAction(documentId))}
          >
            Mark paid
          </button>
        ) : null}
        {status === "payment_sent" ? (
          <>
            <button
              type="button"
              disabled={pending}
              className={btnPrimary}
              onClick={() => run(() => markPaidAction(documentId))}
            >
              {pending ? <Spinner label="Saving" /> : "Confirm received"}
            </button>
            <button
              type="button"
              disabled={pending}
              className={btnSecondary}
              onClick={() => run(() => rejectPaymentClaimAction(documentId))}
            >
              Not received
            </button>
          </>
        ) : null}
        {status === "void" || status === "expired" ? (
          <button
            type="button"
            disabled={pending}
            className={btnDanger}
            onClick={() => run(() => deleteDraftAction(documentId), "/jobs")}
          >
            Delete
          </button>
        ) : null}
        {(status === "signed" || status === "payment_sent" || status === "paid") && (
          <a href={`/s/${publicId}/pdf`} className={btnSecondary}>
            Download signed PDF
          </a>
        )}
        {appUrl && status !== "draft" && status !== "void" ? (
          <button
            type="button"
            className={btnSecondary}
            onClick={() => navigator.clipboard.writeText(`${appUrl}/s/${publicId}`)}
          >
            Copy link
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          className={btnSecondary}
          onClick={() => {
            startTransition(async () => {
              const result = await duplicateDocumentAction(documentId);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.push(`/jobs/${result.data.id}/edit`);
            });
          }}
        >
          Duplicate
        </button>
      </div>
    </div>
  );
}
