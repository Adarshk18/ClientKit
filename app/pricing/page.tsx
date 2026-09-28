import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PricingTable } from "@/components/pricing-table";
import { TrackPageView } from "@/components/track";
import { formatPlanPrice } from "@/lib/billing-regions";
import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";
import { getVisitorCountry } from "@/lib/visitor-country";

export const metadata = pageMetadata({
  title: `Pricing: Free, Founder $${PLAN_PRICES.founder.usd}, Solo $${PLAN_PRICES.solo.usd}, Busy $${PLAN_PRICES.busy.usd}`,
  description: `Free plan with ${SENT_LIMITS.free} sends a month that never expires. Paid plans only raise your send limit. Clients pay you directly by UPI or your own payment link. No cut.`,
  path: "/pricing",
  socialTitle: "Client Kit pricing",
});

const pricingFaqs: { q: string; a: string }[] = [
  {
    q: "Is the free plan really free?",
    a: `Yes. ${SENT_LIMITS.free} sent jobs a month, no expiry, and no card to sign up. Drafts, resends, and nudges do not count toward the limit.`,
  },
  {
    q: "Do you take a cut of what my client pays?",
    a: "No. The client pays you directly by UPI or your own payment link. Client Kit only charges the subscription.",
  },
  {
    q: "What counts as a send?",
    a: "Sending a new job to a client. The count resets every 30 days. When you hit the limit you can keep writing drafts, and jobs you already sent keep working.",
  },
  {
    q: "What is the Founder plan?",
    a: `${formatPlanPrice("founder", "US")}/mo for ${SENT_LIMITS.founder} sent jobs a month, offered to the first ${FOUNDER_CAP} workspaces only. After that, new accounts take Solo at ${formatPlanPrice("solo", "US")}/mo.`,
  },
  {
    q: "Why are prices in rupees for me?",
    a: `Prices follow your country. India sees ${formatPlanPrice("founder", "IN")}, ${formatPlanPrice("solo", "IN")}, and ${formatPlanPrice("busy", "IN")} a month. Most other countries see US dollars, and a few see a fixed price in their own currency. Use the country menu above to switch.`,
  },
];

export default async function PricingPage() {
  const initialCountry = await getVisitorCountry();

  return (
    <div className="flex min-h-dvh flex-col">
      <TrackPageView meta={{ page: "pricing" }} />
      <SiteHeader />
      <main className="ck-page-pad mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        <p className="text-[13px] text-stamp">Pricing</p>
        <h1 className="mt-2 max-w-xl font-serif text-3xl">You pay for the software. Clients pay you.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
          No cut of job payments. The free plan sends {SENT_LIMITS.free} jobs a month and never expires. Paid plans
          only raise the monthly send limit. Prices are in INR for India.
        </p>
        <div className="mt-10">
          <PricingTable initialCountry={initialCountry} />
        </div>
        <p className="mt-8 max-w-xl text-[13px] leading-5 text-muted">
          Failed SaaS payments get a 3-day grace, then the workspace is read-only until billing is fixed. You can
          still open old jobs.
        </p>

        <section className="mt-12 border-t border-line pt-10">
          <h2 className="font-serif text-2xl">Pricing questions</h2>
          <dl className="mt-8 max-w-2xl space-y-6 text-sm leading-6">
            {pricingFaqs.map((f) => (
              <div key={f.q}>
                <dt className="font-medium">{f.q}</dt>
                <dd className="mt-1 text-muted">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm">
            <Link href="/faq" className="underline decoration-line underline-offset-4">
              Full FAQ
            </Link>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
