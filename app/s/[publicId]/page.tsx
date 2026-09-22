import { notFound } from "next/navigation";
import { DEMO_PUBLIC_ID, ensureDemoDocument } from "@/lib/demo";
import { loadPublicDocument, recordPublicView } from "@/lib/public-document";
import { buildFrozenPayload, hashFrozenPayload } from "@/lib/hash";
import { formatMoney } from "@/lib/money";
import { sanitizeScopeHtml } from "@/lib/sanitize";
import { signedLogoUrl } from "@/lib/storage";
import { canPay, canSign, effectiveStatus } from "@/lib/document-state";
import { ErrorState } from "@/components/empty-state";
import { LogoMark } from "@/components/logo-mark";
import { PayPanel } from "@/components/pay-panel";
import { SignForm } from "@/components/sign-form";
import type { LineItemRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  if (publicId === DEMO_PUBLIC_ID) {
    await ensureDemoDocument();
  }
  const doc = await loadPublicDocument(publicId);
  if (!doc) notFound();

  void recordPublicView(publicId);

  const status = effectiveStatus(doc.status, doc.expires_at);
  const workspace = doc.workspaces;
  const client = doc.clients;
  const items: LineItemRow[] = (doc.line_items ?? [])
    .slice()
    .sort((a: LineItemRow, b: LineItemRow) => a.sort_order - b.sort_order);
  const logo = await signedLogoUrl(workspace.logo_url);
  const payload = buildFrozenPayload({
    title: doc.title,
    scope_html: doc.scope_html,
    currency: doc.currency,
    line_items: items.map((item) => ({
      label: item.label,
      qty: Number(item.qty),
      unit_amount: item.unit_amount,
    })),
    subtotal: doc.subtotal,
    deposit_percent: doc.deposit_percent,
    deposit_amount: doc.deposit_amount,
    amount_due: doc.amount_due,
    remainder_amount: doc.remainder_amount,
    client_name: client.name,
    client_email: client.email,
    workspace_name: workspace.name,
  });
  const hash = hashFrozenPayload(payload);
  const signable = canSign(status, doc.expires_at);
  const payable = canPay(status, doc.expires_at);

  if (status === "void") {
    return (
      <PublicShell>
        <ErrorState title="This link is no longer valid" body="The freelancer voided this document. Ask them for a new link." />
      </PublicShell>
    );
  }

  if (status === "expired") {
    return (
      <PublicShell>
        <ErrorState title="This document has expired" body="Signing and payment are closed. Ask the freelancer to send a new version." />
      </PublicShell>
    );
  }

  const signatures = Array.isArray(doc.signatures) ? doc.signatures : doc.signatures ? [doc.signatures] : [];
  const signature = signatures[0];

  return (
    <PublicShell>
      <header className="flex items-center gap-3">
        <LogoMark name={workspace.name} src={logo} />
        <div>
          <p className="text-[13px] text-muted">{workspace.name}</p>
          <h1 className="font-serif text-2xl leading-tight sm:text-3xl landscape-short:text-2xl">{doc.title}</h1>
        </div>
      </header>

      <p className="mt-2 text-sm text-muted">Prepared for {client.name}</p>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Scope</h2>
        <div
          className="prose mt-3 max-w-none text-[15px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeScopeHtml(doc.scope_html || "<p></p>") }}
        />
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl">Price</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No line items on this document.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span>
                  {item.label} × {item.qty}
                </span>
                <span>{formatMoney(Math.round(Number(item.qty) * item.unit_amount), doc.currency)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatMoney(doc.subtotal, doc.currency)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Due now{doc.deposit_percent === 0 || doc.deposit_percent === 100 ? "" : ` (${doc.deposit_percent}%)`}</span>
            <span>{formatMoney(doc.amount_due, doc.currency)}</span>
          </div>
          {doc.remainder_amount > 0 ? (
            <div className="flex justify-between text-muted">
              <span>Due later</span>
              <span>{formatMoney(doc.remainder_amount, doc.currency)}</span>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 border border-ink bg-cream p-4 sm:mt-10 sm:p-5 landscape-short:mt-4 landscape-short:p-3">
        {status === "paid" ? (
          <div>
            <h2 className="font-serif text-2xl">Paid</h2>
            <p className="mt-2 text-sm">
              {client.name} — signed + {formatMoney(doc.amount_due, doc.currency)} received.
            </p>
            <a href={`/s/${publicId}/pdf`} className="mt-4 inline-block text-sm underline decoration-line underline-offset-4">
              Download signed PDF
            </a>
          </div>
        ) : status === "signed" || payable.ok ? (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-2xl">Signed</h2>
              {signature ? (
                <p className="mt-1 text-sm text-muted">
                  {signature.signer_name} · {new Date(signature.signed_at).toISOString()}
                </p>
              ) : null}
              <a href={`/s/${publicId}/pdf`} className="mt-2 inline-block text-sm underline decoration-line underline-offset-4">
                Download signed PDF
              </a>
            </div>
            <div>
              <h3 className="font-serif text-xl">Pay</h3>
              <div className="mt-3">
                <PayPanel
                  publicId={publicId}
                  amountDue={doc.amount_due}
                  currency={doc.currency}
                  payoutType={workspace.payout_type}
                  payoutValue={workspace.payout_value}
                  workspaceName={workspace.name}
                  title={doc.title}
                  alreadySent={doc.payment_status === "payment_sent"}
                />
              </div>
            </div>
          </div>
        ) : signable.ok ? (
          <div>
            <h2 className="font-serif text-2xl">Sign</h2>
            <p className="mt-1 text-sm text-muted">Type your legal name. Then pay the amount due on this same page.</p>
            <div className="mt-4">
              <SignForm publicId={publicId} documentHash={hash} defaultEmail={client.email} />
            </div>
          </div>
        ) : (
          <p className="text-sm">{signable.reason}</p>
        )}
      </section>

      <footer className="mt-12 border-t border-line pt-4 text-xs text-muted">
        Simple electronic signature. Not a digital signature certificate.
        {hash ? ` Document hash ${hash.slice(0, 12)}…` : ""}
      </footer>
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-paper">
      <article className="ck-public-shell mx-auto w-full max-w-xl px-4 py-8 sm:py-14 landscape:max-w-3xl landscape-short:py-4">
        {children}
      </article>
    </div>
  );
}
