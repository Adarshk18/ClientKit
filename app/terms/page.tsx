import { SiteFooter, SiteHeader } from "@/components/site-header";

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 text-sm leading-7">
        <h1 className="font-serif text-3xl">Terms</h1>
        <div className="mt-8 space-y-4 text-ink">
          <p>
            Client Kit is software that helps you send a proposal, collect a simple electronic signature, and point
            your client at a payout method you control.
          </p>
          <p>
            Signatures on Client Kit are simple electronic signatures. They are not digital signature certificates,
            not Aadhaar eSign, and not qualified eIDAS signatures. We are not a law firm. Nothing here is legal
            advice.
          </p>
          <p>
            Job payments go to you, not to us. We do not hold client funds, take a cut of job payments, or operate
            escrow. You are responsible for taxes, invoices, and your own payment provider account.
          </p>
          <p>SaaS fees for Client Kit itself are billed through Dodo Payments on a monthly plan.</p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
