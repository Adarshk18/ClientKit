"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setBalanceDueAction } from "@/lib/actions/documents";
import { fieldClass, btnSecondary } from "@/lib/ui";

export function BalanceDueForm({ documentId, current }: { documentId: string; current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save(next: string | null) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setBalanceDueAction(documentId, next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <label className="block text-sm">
        Expect the balance by (optional)
        <input
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${fieldClass} max-w-[14rem]`}
        />
      </label>
      <p className="mt-1 text-xs text-muted">Only used to remind you to follow up once the date has passed.</p>
      <div className="mt-2 flex gap-2">
        <button type="button" disabled={pending} className={btnSecondary} onClick={() => save(value || null)}>
          Save date
        </button>
        {current ? (
          <button
            type="button"
            disabled={pending}
            className={btnSecondary}
            onClick={() => {
              setValue("");
              save(null);
            }}
          >
            Clear
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      {saved ? <p className="mt-2 text-sm text-muted">Saved.</p> : null}
    </div>
  );
}
