"use client";

import { useState } from "react";
import { mailtoLink, whatsappLink } from "@/lib/tools/format";
import { btnSecondary } from "@/lib/ui";

const small =
  "inline-flex min-h-11 items-center justify-center rounded-sm border border-line bg-transparent px-3 text-[13px] font-medium text-ink hover:bg-cream";

/**
 * One generated message or clause. Copy, or open WhatsApp or the mail app with the text filled in.
 * Nothing is sent from here: the person presses send in their own app.
 */
export function OutputBlock({
  title,
  badge,
  subject,
  text,
  whatsapp = false,
  email = false,
  download,
}: {
  title: string;
  badge?: string;
  subject?: string;
  text: string;
  whatsapp?: boolean;
  email?: boolean;
  download?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(subject ? `Subject: ${subject}\n\n${text}` : text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function save() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = download ?? "terms.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="border border-line bg-cream p-3 sm:p-4" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-serif text-[1.05rem] font-medium">{title}</h3>
        {badge ? <span className="bg-paper px-2 py-0.5 text-[12px] text-muted">{badge}</span> : null}
      </div>
      {subject ? (
        <p className="mt-2 text-[13px] text-muted">
          Subject: <span className="text-ink">{subject}</span>
        </p>
      ) : null}
      <pre className="mt-2 whitespace-pre-wrap break-words bg-paper p-3 font-sans text-[14px] leading-6 text-ink">{text}</pre>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={`${btnSecondary} !w-auto`} onClick={copy} aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
        {whatsapp ? (
          <a className={small} href={whatsappLink(text)} target="_blank" rel="noopener noreferrer">
            Open in WhatsApp
          </a>
        ) : null}
        {email ? (
          <a className={small} href={mailtoLink(subject ?? "", text)}>
            Open in email
          </a>
        ) : null}
        {download ? (
          <button type="button" className={small} onClick={save}>
            Download .txt
          </button>
        ) : null}
      </div>
    </section>
  );
}
