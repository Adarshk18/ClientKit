import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { PricingTable } from "@/components/pricing-table";
import { TrackPageView, TrackedLink } from "@/components/track";
import { formatPlanPrice } from "@/lib/billing-regions";
import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { btnPrimary, btnSecondary } from "@/lib/ui";
import { getVisitorCountry } from "@/lib/visitor-country";

export const metadata = pageMetadata({
  title: { absolute: "Client Kit: Freelance Proposals Clients Sign and Pay on One Link" },
  description: `Send a proposal, get it e-signed, and collect the deposit on one link. Clients pay your UPI or payment link directly. Free plan: ${SENT_LIMITS.free} sends a month.`,
  path: "/",
});

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      founder: { "@type": "Person", name: "Adarsh Sharma" },
      address: { "@type": "PostalAddress", addressCountry: "IN" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "One link for a freelance job: the client reads the proposal, e-signs it, and pays the freelancer directly by UPI or the freelancer's own payment link (Stripe, PayPal, Razorpay). Client Kit takes no cut of job payments.",
      publisher: { "@id": `${SITE_URL}/#org` },
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description: `${SENT_LIMITS.free} sent jobs per month, never expires`,
        },
        {
          "@type": "Offer",
          name: PLAN_PRICES.founder.label,
          price: String(PLAN_PRICES.founder.usd),
          priceCurrency: "USD",
          description: `First ${FOUNDER_CAP} workspaces only. ${SENT_LIMITS.founder} sent jobs per month`,
        },
        {
          "@type": "Offer",
          name: PLAN_PRICES.solo.label,
          price: String(PLAN_PRICES.solo.usd),
          priceCurrency: "USD",
          description: `${SENT_LIMITS.solo} sent jobs per month`,
        },
        {
          "@type": "Offer",
          name: PLAN_PRICES.busy.label,
          price: String(PLAN_PRICES.busy.usd),
          priceCurrency: "USD",
          description: "Unlimited sent jobs",
        },
      ],
    },
  ],
};

export default async function MarketingPage() {
  const country = await getVisitorCountry();
  const soloPrice = formatPlanPrice("solo", country);
  const founderPrice = formatPlanPrice("founder", country);

  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={structuredData} />
      <TrackPageView />
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="ck-page-pad grid items-start gap-8 py-8 sm:gap-12 sm:py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="lg:col-span-5">
            <p className="text-[13px] font-medium text-stamp">
              Free plan: {SENT_LIMITS.free} sends a month, never expires.
            </p>
            <h1 className="mt-3 font-serif text-[2.1rem] font-medium leading-[1.15] tracking-tight sm:text-[2.75rem]">
              Send a proposal. Your client signs and pays you.
            </h1>
            <p className="mt-4 max-w-[40ch] text-[16px] leading-7 text-muted sm:mt-5">
              One link does it all. Your client reads the proposal, e-signs it, and pays you directly by UPI or your
              own payment link. Client Kit takes no cut.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:items-center">
              <TrackedLink
                href="/s/demo-acme"
                className={btnPrimary}
                event="demo_open"
                meta={{ cta: "hero_see_demo" }}
              >
                See the demo
              </TrackedLink>
              <TrackedLink href="/signup" className={btnSecondary} meta={{ cta: "hero_get_started" }}>
                Start free
              </TrackedLink>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              No card needed.{" "}
              <Link href="/login" className="underline decoration-line underline-offset-4 hover:text-ink">
                I already have an account
              </Link>
            </p>
          </div>

          <div className="lg:col-span-7">
            <div className="border border-line bg-cream">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="text-[12px] text-muted">/s/demo-acme</span>
                <span className="text-[12px] text-stamp">Awaiting signature</span>
              </div>
              <div className="px-5 py-6 sm:px-7">
                <p className="font-serif text-xl">Acme site rebuild</p>
                <p className="mt-1 text-[13px] text-muted">Studio North for Acme · due in 14 days</p>
                <p className="mt-5 max-w-[46ch] text-sm leading-6">
                  Homepage, CMS, and two rounds of revision. You send copy. We ship a static export you can host
                  anywhere.
                </p>
                <dl className="mt-6 border-t border-line pt-4 text-sm">
                  <div className="flex justify-between py-1.5">
                    <dt>Homepage + CMS</dt>
                    <dd>$1,200</dd>
                  </div>
                  <div className="flex justify-between py-1.5 font-medium">
                    <dt>Due now (50%)</dt>
                    <dd>$600</dd>
                  </div>
                </dl>
                <TrackedLink
                  href="/s/demo-acme"
                  className="mt-6 block h-10 w-full bg-ink text-center text-[13px] font-medium leading-10 text-paper hover:bg-ink/90"
                  event="demo_open"
                  meta={{ cta: "open_demo" }}
                >
                  Open demo and sign
                </TrackedLink>
              </div>
            </div>
            <p className="mt-4 max-w-[48ch] text-[13px] leading-5 text-muted">
              Try the live demo: type a fake name, sign, then see the UPI step. After they pay, your list does not
              grow a pipeline. It just reads <span className="text-ink">Acme: signed, $600 received.</span>
            </p>
          </div>
        </section>

        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="font-serif text-2xl">How a job moves</h2>
          <ol className="mt-8 max-w-xl space-y-8">
            <li className="grid grid-cols-[2rem_1fr] gap-4">
              <p className="font-serif text-xl tabular-nums text-stamp">1</p>
              <div>
                <h3 className="font-serif text-xl">You write it</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Client name, scope, line items, deposit percent, expiry. Save a draft or send. Sending emails the
                  client a private link.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[2rem_1fr] gap-4">
              <p className="font-serif text-xl tabular-nums text-stamp">2</p>
              <div>
                <h3 className="font-serif text-xl">They sign on that page</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Legal name, a checkbox, a hash of the frozen document. We store IP, time, and a PDF. Not a
                  certificate. The footer says so.
                </p>
              </div>
            </li>
            <li className="grid grid-cols-[2rem_1fr] gap-4">
              <p className="font-serif text-xl tabular-nums text-stamp">3</p>
              <div>
                <h3 className="font-serif text-xl">They pay you</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  UPI QR from your VPA, or a new tab to the payment URL you already use. You click Mark paid when
                  you see the money.
                </p>
              </div>
            </li>
          </ol>
        </section>

        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="font-serif text-2xl">What people are leaving suites over right now</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            August–September 2026 reviews keep repeating the same four problems. Client Kit is built around those,
            not around a CRM.
          </p>
          <ul className="mt-8 max-w-2xl space-y-5 text-sm leading-6">
            <li>
              <strong className="text-ink">They hold your client’s money.</strong> Card payouts on the big tools take
              2–3 business days; ACH a week. Disputes can freeze funds. Here the client pays your UPI or your own
              payment link. We never touch the job money.
            </li>
            <li>
              <strong className="text-ink">They tax the invoice.</strong> Processing on a $5,000 job is over $140 on
              top of a $36–$129/mo plan. We charge software rent. Zero cut of the job.
            </li>
            <li>
              <strong className="text-ink">The client has to make an account.</strong> Portals kill momentum on mobile.
              Our client opens one link, signs, pays. Share it on WhatsApp. Nudge if they stall.
            </li>
            <li>
              <strong className="text-ink">India is an afterthought.</strong> New Stripe accounts are blocked for many
              Indian founders; UPI is not a first-class button. UPI VPA + QR is a first-class payout method here.
            </li>
          </ul>
        </section>

        <section className="grid gap-10 border-t border-line py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div>
            <h2 className="font-serif text-2xl">Your side</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              A list of jobs with status. Filter unpaid. Resend the email. Void a link and send a new version.
              Download the signed PDF. Nothing else is supposed to live here.
            </p>
            <ul className="mt-6 divide-y divide-line border border-line bg-cream text-sm">
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  Acme site rebuild
                  <span className="mt-0.5 block text-[12px] text-muted">Acme: signed, $600 received</span>
                </span>
                <span className="text-[12px] text-stamp">paid</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  Brand kit, April
                  <span className="mt-0.5 block text-[12px] text-muted">Rina · $900 due now</span>
                </span>
                <span className="text-[12px]">viewed</span>
              </li>
              <li className="flex items-center justify-between gap-3 px-4 py-3">
                <span>
                  Wedding stills
                  <span className="mt-0.5 block text-[12px] text-muted">Draft · not sent</span>
                </span>
                <span className="text-[12px] text-muted">draft</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-2xl">What we refuse to add</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              If you need these, you need a different product. Asking for them is how this becomes expensive.
            </p>
            <ul className="mt-6 space-y-2 text-sm leading-6">
              <li>Pipeline / CRM / leads inbox</li>
              <li>Calendar booking or Zoom</li>
              <li>Tasks, time tracking, client portal</li>
              <li>AI that writes the proposal</li>
              <li>QuickBooks, team seats, white-label</li>
              <li>Holding your client’s money</li>
            </ul>
          </div>
        </section>

        <section id="pricing" className="border-t border-line py-12 lg:py-16">
          <h2 className="font-serif text-2xl">Pricing</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            You pay rent on the software. Clients pay you. The free plan sends {SENT_LIMITS.free} jobs a month and
            never expires. Paid plans only raise the monthly send limit.
          </p>
          <div className="mt-8">
            <PricingTable initialCountry={country} />
          </div>
        </section>

        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="font-serif text-2xl">Questions we actually get</h2>
          <dl className="mt-8 max-w-2xl space-y-6 text-sm leading-6">
            <div>
              <dt className="font-medium">Do you take a cut of the client’s payment?</dt>
              <dd className="mt-1 text-muted">No. They pay your UPI or your hosted link. We never see the card.</dd>
            </div>
            <div>
              <dt className="font-medium">Is there a free plan?</dt>
              <dd className="mt-1 text-muted">
                Yes. The free plan sends {SENT_LIMITS.free} jobs a month and never expires. Paid plans only raise the
                monthly send limit.
              </dd>
            </div>
            <div>
              <dt className="font-medium">What is Founder at {founderPrice}?</dt>
              <dd className="mt-1 text-muted">
                Founder is {founderPrice}/mo for the first 50 workspaces only. After that, new accounts pay Solo at{" "}
                {soloPrice}.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Is the signature legally a digital certificate?</dt>
              <dd className="mt-1 text-muted">
                No. Simple electronic signature: name, intent, IP, time, document hash. Not Aadhaar, not eIDAS
                qualified.
              </dd>
            </div>
            <div>
              <dt className="font-medium">Can it sync to my other tools?</dt>
              <dd className="mt-1 text-muted">No. That is how this becomes a suite. Download the PDF if you need a file.</dd>
            </div>
          </dl>
          <p className="mt-6 text-sm">
            <Link href="/faq" className="underline decoration-line underline-offset-4">
              Full FAQ
            </Link>
          </p>
        </section>

        <section className="border-t border-line py-12 lg:py-16">
          <h2 className="font-serif text-3xl">Send the next job on one link.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted">
            Create a workspace, write a document, copy the URL. That is the product.
          </p>
          <TrackedLink href="/signup" className={`${btnPrimary} mt-6`} meta={{ cta: "footer_get_started" }}>
            Get started
          </TrackedLink>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
