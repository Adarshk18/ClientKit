import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { PricingTable } from "@/components/pricing-table";
import { TrackPageView, TrackedLink } from "@/components/track";
import { PlanPrice } from "@/components/plan-price";
import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";
import { pageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { btnPrimary } from "@/lib/ui";

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

export default function MarketingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={structuredData} />
      <TrackPageView />
      <SiteHeader mobileCta={false} />

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="ck-page-pad grid items-start gap-6 py-5 sm:gap-12 sm:py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
          <div className="lg:col-span-5">
            <p className="text-[13px] font-medium text-stamp">
              Free plan: {SENT_LIMITS.free} sends a month, never expires, no card.
            </p>
            <h1 className="mt-2 font-serif text-[2rem] font-medium leading-[1.15] tracking-tight sm:mt-3 sm:text-[2.75rem]">
              Send a proposal. Your client signs and pays you.
            </h1>
            <p className="mt-3 max-w-[40ch] text-[15px] leading-6 text-muted sm:mt-5 sm:text-[16px] sm:leading-7">
              One link does it all. Your client reads the proposal, e-signs it, and pays you directly by UPI or your
              own payment link. Client Kit takes no cut.
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:flex-wrap sm:items-center sm:gap-5">
              <TrackedLink
                href="/s/demo-acme"
                className={btnPrimary}
                event="demo_open"
                meta={{ cta: "hero_see_demo" }}
              >
                See the demo
              </TrackedLink>
              <TrackedLink
                href="/signup"
                className="flex min-h-11 items-center justify-center text-[13px] font-medium text-ink underline decoration-line underline-offset-4 hover:text-stamp sm:inline-flex"
                meta={{ cta: "hero_get_started" }}
              >
                Or start free
              </TrackedLink>
            </div>
            <ol
              data-strip
              className="mt-3 grid grid-cols-3 gap-3 border-y border-line py-3 text-[13px] leading-5 sm:mt-4 sm:max-w-md"
            >
              {["Send the link", "Client signs", "You get paid by UPI"].map((step, i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="font-serif text-base leading-5 tabular-nums text-stamp">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-7">
            {/* One link for the whole demo block, so a tap anywhere on the card or the caption opens the demo. */}
            <TrackedLink
              href="/s/demo-acme"
              className="group block rounded-sm no-underline focus-visible:outline-2 focus-visible:outline-offset-4"
              event="demo_open"
              meta={{ cta: "open_demo" }}
            >
              <div className="border border-line bg-cream transition-colors group-hover:border-ink/40 group-focus-visible:border-ink/40">
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <span className="text-[12px] text-muted">/s/demo-acme</span>
                  <span className="text-[12px] text-stamp">Awaiting signature</span>
                </div>
                <div className="px-5 py-6 sm:px-7">
                  <p className="font-serif text-xl text-ink">Acme site rebuild</p>
                  <p className="mt-1 text-[13px] text-muted">Studio North for Acme · due in 14 days</p>
                  <p className="mt-5 max-w-[46ch] text-sm leading-6 text-ink">
                    Homepage, CMS, and two rounds of revision. You send copy. We ship a static export you can host
                    anywhere.
                  </p>
                  <dl className="mt-6 border-t border-line pt-4 text-sm text-ink">
                    <div className="flex justify-between py-1.5">
                      <dt>Homepage + CMS</dt>
                      <dd>$1,200</dd>
                    </div>
                    <div className="flex justify-between py-1.5 font-medium">
                      <dt>Due now (50%)</dt>
                      <dd>$600</dd>
                    </div>
                  </dl>
                  <span className="mt-6 block h-11 w-full bg-ink text-center text-[13px] font-medium leading-[2.75rem] text-paper group-hover:bg-ink/90">
                    Open demo and sign
                  </span>
                </div>
              </div>
              <p className="mt-3 max-w-[48ch] text-[13px] leading-5 text-muted sm:mt-4">
                Try it as a client would: type a fake name, sign, then see the UPI step. No account needed.{" "}
                <span className="font-medium text-stamp underline decoration-line underline-offset-4">Open the demo</span>
              </p>
            </TrackedLink>
          </div>
        </section>

        <section className="grid gap-8 border-t border-line py-8 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:gap-16 lg:py-16">
          <div>
            <h2 className="font-serif text-2xl">What Client Kit is</h2>
            <ul className="mt-6 space-y-2 text-sm leading-6">
              <li>A proposal your client reads on one link</li>
              <li>An e-signature the client adds on that same page</li>
              <li>The client pays you directly by UPI or your own payment link</li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-2xl">What it isn’t</h2>
            <ul className="mt-6 space-y-2 text-sm leading-6 text-muted">
              <li>Not invoicing software</li>
              <li>Not time tracking</li>
              <li>Not escrow. It never holds your client’s money</li>
              <li>Not a CRM or pipeline</li>
            </ul>
          </div>
        </section>

        <section className="border-t border-line py-8 sm:py-12 lg:py-16">
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

        <section className="border-t border-line py-8 sm:py-12 lg:py-16">
          <h2 className="font-serif text-2xl">Why I built it this way</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            I kept sending a Google Doc, then a separate payment link, then chasing both. The all-in-one tools I tried
            fixed that by adding a lot more than I needed. Client Kit is built around four choices instead.
          </p>
          <ul className="mt-8 max-w-2xl space-y-5 text-sm leading-6">
            <li>
              <strong className="text-ink">The money goes straight to you.</strong> Big all-in-one tools route the
              client’s payment through their own processor, so fees come out of your job and the money can take days
              to reach you. Here the client pays your UPI or your own payment link. Client Kit never touches the money.
            </li>
            <li>
              <strong className="text-ink">No cut of the job.</strong> You pay a flat monthly fee for the software, or
              nothing on the free plan. Whatever the client pays is yours, minus only what your own UPI app or payment
              provider charges.
            </li>
            <li>
              <strong className="text-ink">The client does not make an account.</strong> They open one link, sign, and
              pay, on their phone if they like. Share it on WhatsApp. Nudge them if they stall.
            </li>
            <li>
              <strong className="text-ink">UPI is a first-class option.</strong> Save your UPI ID and the client gets a
              QR code and the exact amount. Freelancers outside India can use a payment link they already have.
            </li>
          </ul>
        </section>

        <section className="grid gap-8 border-t border-line py-8 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
          <div>
            <h2 className="font-serif text-2xl">Your side</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              A list of jobs with status. Filter unpaid. Resend the email. Void a link and send a new version.
              Download the signed PDF. Nothing else is supposed to live here.
            </p>
            <p className="mt-6 text-[12px] text-muted">A sample of your job list.</p>
            <ul className="mt-2 cursor-default select-none divide-y divide-line border-y border-line text-sm">
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

        <section id="pricing" className="border-t border-line py-8 sm:py-12 lg:py-16">
          <h2 className="font-serif text-2xl">Pricing</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
            You pay rent on the software. Clients pay you. The free plan sends {SENT_LIMITS.free} jobs a month and
            never expires. Paid plans only raise the monthly send limit.
          </p>
          <div className="mt-8">
            <PricingTable />
          </div>
        </section>

        <section className="border-t border-line py-8 sm:py-12 lg:py-16">
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
              <dt className="font-medium">What is Founder at <PlanPrice plan="founder" />?</dt>
              <dd className="mt-1 text-muted">
                Founder is <PlanPrice plan="founder" />/mo for the first 50 workspaces only. After that, new accounts pay
                Solo at <PlanPrice plan="solo" />.
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

        <section className="border-t border-line py-8 sm:py-12 lg:py-16">
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
