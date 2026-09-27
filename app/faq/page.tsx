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
    q: "Do you take a cut of client payments?",
    a: "No. Clients pay you directly by UPI or your own payment link. Client Kit only charges for the software, and the free plan costs nothing.",
  },
  {
    q: "Is there a free plan?",
    a: `Yes. The free plan sends ${SENT_LIMITS.free} jobs a month and never expires. Paid plans only raise the monthly send limit.`,
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
    a: `Yes. In India the plans are ${inr("founder")} (Founder), ${inr("solo")} (Solo), and ${inr("busy")} (Busy) a month.`,
  },
  {
    q: "Is this a qualified digital signature?",
    a: "No. It is a simple electronic signature with a hashed snapshot, IP, and timestamp. The page footer says so.",
  },
  {
    q: "Can you add a calendar, CRM, or packages?",
    a: "No. That is a different product. Client Kit is three steps.",
  },
  {
    q: "Does Client Kit do invoicing or client portals?",
    a: "No. Client Kit is a proposal, a signature, and a deposit on one link. It does not do invoicing, time tracking, escrow, or client portals.",
  },
  {
    q: "What if the client says they paid?",
    a: "Check your UPI or payment link. Then click Mark paid. We do not see their transfer.",
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
      </article>
      <SiteFooter />
    </div>
  );
}
