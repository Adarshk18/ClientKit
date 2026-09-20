"use client";

import { useState } from "react";
import { btnSecondary } from "@/lib/ui";

export function SharePanel({
  publicId,
  clientName,
  title,
  workspaceName,
}: {
  publicId: string;
  clientName: string;
  title: string;
  workspaceName: string;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/s/${publicId}`;
  const message = `Hi ${clientName}, ${workspaceName} sent you “${title}”. Review, sign, and pay on this page (no account needed): ${link}`;

  async function copy(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1600);
  }

  return (
    <div className="border border-line bg-cream p-4">
      <h2 className="font-serif text-lg">Send this on WhatsApp</h2>
      <p className="mt-1 text-sm text-muted">
        Suites make the client open a portal. This is one message. They tap, sign, pay you.
      </p>
      <p className="mt-3 break-all font-mono text-[12px] text-muted">{link}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btnSecondary} onClick={() => copy("link", link)}>
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
        <button type="button" className={btnSecondary} onClick={() => copy("msg", message)}>
          {copied === "msg" ? "Copied" : "Copy message"}
        </button>
        <a
          className={btnSecondary}
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </div>
    </div>
  );
}
