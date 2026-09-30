import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { formatPlanPrice } from "@/lib/billing-regions";
import { FOUNDER_CAP, SENT_LIMITS } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ: proposals, e-signatures, UPI and payment links",
  description:
    "Straight answers about Client Kit: how clients sign, how UPI and payment links work, what the free plan includes, and what Client Kit does not do.",
  path: "/faq",
});

const usd = (plan: "founder" | "solo" | "busy") => formatPlanPrice(plan, "US");
const inr = (plan: "founder" | "solo" | "busy") => formatPlanPrice(plan, "IN");

/** One list drives both the visible answers and the FAQPage structured data. */
const faqs: { q: string; a: string }[] = [
  {
    q: "What is Client Kit?",
    a: "Client Kit puts a freelance proposal, the client's e-signature, and the payment on one link. You write the job, send the link, the client signs it, and then pays you directly by UPI or your own payment link.",
  },
  {
    q: "Is the free plan really free?",
    a: `Yes. The free plan sends ${SENT_LIMITS.free} jobs a month, never expires, and does not ask for a card. Only sending counts: drafts, resends, and nudges are free. The count resets every 30 days. Paid plans only raise the send limit.`,
  },
  {
    q: "Do you take a cut of client payments?",
    a: "No. Client Kit makes money only from the monthly subscription, and the free plan costs nothing. The client pays you directly, so the only fees are whatever your own UPI app or payment provider charges.",
  },
  {
    q: "How does the client pay me?",
    a: "After signing, the client sees your UPI QR code or a button that opens your own hosted payment link (for example Stripe, PayPal, or Razorpay). The money goes straight to you. The client then taps \"I've paid\", and you confirm once you see it in your account.",
  },
  {
    q: "What if the client says they paid?",
    a: "The job shows that the client says they paid. Check your UPI app or payment provider. If the money is there, click Confirm received. If it is not, click Not received. Client Kit never sees the transfer, so you are the one who confirms.",
  },
  {
    q: "Does the client need an account?",
    a: "No. The client opens your link, reads the proposal, types their name and email, ticks a box to sign, and pays. There is no signup or password for them.",
  },
  {
    q: "Can I ask for a deposit instead of the full amount?",
    a: "Yes. Each job has a deposit percent from 0 to 100. The client page shows the amount due now, and that is what the client pays.",
  },
  {
    q: "Does Client Kit hold or process the money?",
    a: "No. Job money never goes through Client Kit. There is no escrow and no payout to wait for. You save one UPI ID or one https payment link, and the client pays that directly.",
  },
  {
    q: "What do the paid plans cost?",
    a: `Founder is ${usd("founder")}/mo for ${SENT_LIMITS.founder} sent jobs a month. Solo is ${usd("solo")}/mo for ${SENT_LIMITS.solo}. Busy is ${usd("busy")}/mo with no send limit.`,
  },
  {
    q: "What is the Founder plan?",
    a: `Founder is ${usd("founder")}/mo for the first ${FOUNDER_CAP} workspaces only. After that, new accounts take Solo at ${usd("solo")}/mo.`,
  },
  {
    q: "Is there pricing in INR for India?",
    a: `Yes. In India the plans are ${inr("founder")} (Founder), ${inr("solo")} (Solo), and ${inr("busy")} (Busy) a month. Most other countries see US dollars, and a few (such as the UK, EU, Canada, and Australia) see fixed prices in their own currency. You can change the country on the pricing page.`,
  },
  {
    q: "Can I get paid by UPI?",
    a: "Yes. Save your UPI ID (like name@okaxis) in settings and the client gets a QR code to scan with any UPI app. For jobs priced in INR, the amount is filled in for them.",
  },
  {
    q: "I am not in India. Can I still use it?",
    a: "Yes. Save a payment link you already use, such as a Stripe, PayPal, or Razorpay link, and the client pays you there. Jobs can be priced in your own currency.",
  },
  {
    q: "What happens if I hit my send limit?",
    a: "You can keep writing drafts, but you cannot send a new job until the count resets or you move to a bigger plan. Jobs you already sent keep working.",
  },
  {
    q: "What happens if my subscription payment fails?",
    a: `You get a 3-day grace period. After that the workspace moves to the free plan (${SENT_LIMITS.free} sends a month) until billing is fixed. Your proposals and history stay.`,
  },
  {
    q: "Can I cancel?",
    a: `Yes, anytime. Sign in to the Dodo customer portal (customer.dodopayments.com) with the email you paid with and cancel there. If you cancel at the next billing date, you keep your paid plan until the end of the period you paid for, then your workspace goes back to the free plan (${SENT_LIMITS.free} sends a month). Your proposals and history stay.`,
  },
  {
    q: "Is this a qualified digital signature?",
    a: "No. It is a simple electronic signature with a hashed snapshot, IP, and timestamp. The page footer says so. It is not Aadhaar eSign or a digital signature certificate.",
  },
  {
    q: "Does Client Kit do invoicing or client portals?",
    a: "No. Client Kit is a proposal, a signature, and a deposit on one link. It does not do invoicing, time tracking, escrow, CRM, or client portals.",
  },
  {
    q: "Can Client Kit replace an all-in-one tool like HoneyBook or Bonsai?",
    a: "Only if all you need is the proposal, the signature, and getting paid. Client Kit does not do invoicing, a CRM, scheduling, or time tracking. If you rely on those, a bigger tool is a better fit.",
  },
  {
    q: "Can you add a calendar, CRM, or packages?",
    a: "No. That is a different product. Client Kit is three steps.",
  },
  {
    q: "Can I send the link on WhatsApp?",
    a: "Yes. Open the job, use WhatsApp or copy the message. The client does not create an account.",
  },
  {
    q: "What if they viewed it and went quiet?",
    a: "Click Nudge client. We email them once an hour max. Duplicate a finished job when the next one is the same shape.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <JsonLd data={faqStructuredData} />
      <SiteHeader />
      <article className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="font-serif text-3xl">FAQ</h1>
        <dl className="mt-10 space-y-8 text-sm leading-6">
          {faqs.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1 text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-10 border-t border-line pt-6 text-sm leading-6">
          Want to see it as a client would?{" "}
          <Link href="/s/demo-acme" className="font-medium text-stamp underline decoration-line underline-offset-4">
            Open the live demo
          </Link>
          . Or{" "}
          <Link href="/pricing" className="underline decoration-line underline-offset-4">
            see pricing
          </Link>
          .
        </p>
      </article>
      <SiteFooter />
    </div>
  );
}
