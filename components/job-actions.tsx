"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteDraftAction,
  duplicateDocumentAction,
  markPaidAction,
  nudgeClientAction,
  resendDocumentAction,
  sendDocumentAction,
  voidDocumentAction,
} from "@/lib/actions/documents";
import { btnDanger, btnPrimary, btnSecondary } from "@/lib/ui";
import type { DocStatus } from "@/lib/types";

export function JobActions({
  documentId,
  status,
  publicId,
}: {
  documentId: string;
  status: DocStatus;
  publicId: string;
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
        {status === "sent" || status === "viewed" || status === "signed" ? (
          <button
            type="button"
            disabled={pending}
            className={btnSecondary}
            onClick={() => run(() => nudgeClientAction(documentId))}
          >
            {pending ? "Sending…" : "Nudge client"}
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
        {(status === "signed" || status === "paid") && (
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
