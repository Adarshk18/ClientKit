import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";

export type ToolSlug =
  | "advance-payment-request-message-generator"
  | "client-follow-up-message-generator"
  | "freelance-proposal-clause-generator";

export type Faq = { q: string; a: string };

export type ToolInfo = {
  slug: ToolSlug;
  path: string;
  /** Short name used in lists and breadcrumbs. */
  name: string;
  h1: string;
  title: string;
  description: string;
  /** One line shown on the hub page and in "related tools". */
  blurb: string;
  schemaDescription: string;
  intro: string;
  faqs: Faq[];
};

export const TOOL_DISCLOSURE = "Made by the team behind Client Kit, the one link proposal, e-sign and payment tool.";
export const NOTHING_STORED = "Nothing you type here is saved or sent anywhere. The result is built in your browser.";
export const NOT_LEGAL_ADVICE = "These are plain-English messages and terms, not legal or tax advice.";

export const ADVANCE_FAQS: Faq[] = [
  {
    q: "How do I ask a client for an advance payment politely?",
    a: "State it as part of the deal, not a favour. Give the amount, what it covers, how to pay, and when work starts. For example: \"To begin, I take a 50% advance of ₹30,000. Work starts once it is received.\"",
  },
  {
    q: "How much advance should a freelancer ask for?",
    a: "There is no fixed rule. A common range is 30% to 50% upfront, and 50% advance with 50% on delivery is common in India. Small jobs are often paid in full upfront, and long jobs are often split into milestones.",
  },
  {
    q: "Can I ask for advance payment on WhatsApp?",
    a: "Yes. WhatsApp is fine for the request, and it is fast. Also put the advance in your written proposal so both sides have it on record.",
  },
  {
    q: "What should an advance payment request message include?",
    a: "The project name, total fee, advance amount, balance and when it is due, how to pay (UPI ID or payment link), and what happens once you receive it.",
  },
  {
    q: "What if the client says they will pay everything at the end?",
    a: "Offer a smaller advance or split the work into milestones. Say you start once the first payment arrives. If they refuse any advance, you decide whether the risk is acceptable.",
  },
  {
    q: "Do I need to send an invoice for an advance payment?",
    a: "Not always. Some clients, especially companies with an accounts team, ask for a proforma or advance invoice before releasing money. Ask them what they need. Tax rules vary, so check with an accountant. Client Kit does not create invoices.",
  },
];

export const FOLLOWUP_FAQS: Faq[] = [
  {
    q: "How do I follow up with a client who is not responding?",
    a: "Send a short, friendly message that asks one clear question. If there is still no reply after a few days, send a clearer message with a date. End with a closing message that lets them restart later.",
  },
  {
    q: "How long should I wait before following up after sending a proposal?",
    a: "There is no fixed rule. Many freelancers wait a few days, then follow up again after about a week. Shorter for small jobs, longer for big company decisions.",
  },
  {
    q: "Is it okay to send a payment reminder on WhatsApp?",
    a: "Yes, especially in India and for smaller amounts or clients you already chat with. For large amounts or formal companies, email gives you a better record. Doing both is common.",
  },
  {
    q: "How many follow-up messages should I send before giving up?",
    a: "Guides differ. One common piece of advice is three to five reminders, getting gradually firmer. This tool gives four steps. The last one closes the loop politely so you can move on.",
  },
  {
    q: "How do I sound firm without being rude?",
    a: "State the facts, state what you need, and give a date. Skip anger, sarcasm and guilt. Example: \"Please confirm by Friday. If I do not hear back, I will pause the project.\"",
  },
  {
    q: "Can I pause work if a client does not pay or reply?",
    a: "That depends on what you agreed. It is best to write it in your proposal terms before work starts. Only say you will pause if you really will. This is not legal advice.",
  },
];

export const CLAUSE_FAQS: Faq[] = [
  {
    q: "How many revisions should I include in a freelance project?",
    a: "There is no standard. Two rounds is a common starting point. Fewer for small jobs, more for complex work. State what counts as a round and what it costs to add one.",
  },
  {
    q: "What is a revision, and what is a new request?",
    a: "A revision changes work you already delivered to match the agreed brief. A new request adds something that was not in the scope, like a new page or a new direction. New requests get a separate quote.",
  },
  {
    q: "What should freelance payment terms say?",
    a: "The total fee, the advance amount and when it is due, when the balance is due, how to pay, what happens if payment is late, and whether taxes are extra.",
  },
  {
    q: "Is a clause in a proposal legally binding once the client signs?",
    a: "A written agreement that both sides accept is generally treated as binding, but that depends on where you live and how it is worded. This tool gives plain-English terms, not legal advice. For large projects, get a lawyer to check.",
  },
  {
    q: "What is a scope creep clause?",
    a: "It says what is included, what is not, and that extra work is quoted and agreed in writing before you start it. It protects your time and the client's budget.",
  },
  {
    q: "Can I use these clauses in my proposal for free?",
    a: "Yes. The tool is free, needs no login, and you can copy the text into any proposal, in Google Docs, PDF or Client Kit.",
  },
];

export const TOOLS: ToolInfo[] = [
  {
    slug: "advance-payment-request-message-generator",
    path: "/tools/advance-payment-request-message-generator",
    name: "Advance payment request message maker",
    h1: "Advance payment request message maker for freelancers",
    title: "Advance Payment Request Message Maker for Freelancers",
    description:
      "Free tool. Fill in your project and amount, get a polite advance payment request for WhatsApp or email in seconds. UPI ready. No login needed.",
    blurb: "Fill in your project and fee. Get a polite advance request for WhatsApp or email, with the balance worked out.",
    schemaDescription: "Free tool that writes a polite advance payment request for freelancers to send by WhatsApp or email.",
    intro: "Fill in a few details. Get a message you can send in WhatsApp or email.",
    faqs: ADVANCE_FAQS,
  },
  {
    slug: "freelance-proposal-clause-generator",
    path: "/tools/freelance-proposal-clause-generator",
    name: "Freelance proposal clause maker",
    h1: "Freelance proposal clause maker: revisions, scope and payment terms",
    title: "Freelance Clause Maker: Revisions, Scope, Payment",
    description:
      "Free tool. Build plain-English revision limit, scope and payment terms clauses to paste into your freelance proposal. Rupee or dollar. No login.",
    blurb: "Answer a few questions. Get plain-English scope, revision limit and payment terms to paste into your proposal.",
    schemaDescription:
      "Free tool that builds plain-English scope, revision limit and payment terms clauses for a freelance proposal.",
    intro: "Answer a few questions. Get clear terms you can paste into your proposal.",
    faqs: CLAUSE_FAQS,
  },
  {
    slug: "client-follow-up-message-generator",
    path: "/tools/client-follow-up-message-generator",
    name: "Client follow-up message maker",
    h1: "Client follow-up message maker: from polite to firm",
    title: "Client Follow-Up Message Maker (Polite to Firm)",
    description:
      "Client gone quiet? Pick the situation, get a 4 step follow-up from polite to firm for WhatsApp or email. Free, no login, works without an invoice.",
    blurb: "Client gone quiet? Pick what happened and get four messages, from polite to firm, for WhatsApp or email.",
    schemaDescription:
      "Free tool that writes a four step follow-up for freelancers whose client has gone quiet, from polite to firm.",
    intro: "Pick what happened. Get a polite message first, then firmer ones if you need them.",
    faqs: FOLLOWUP_FAQS,
  },
];

export function getTool(slug: ToolSlug): ToolInfo {
  const t = TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool ${slug}`);
  return t;
}

/** Facts used in the closing call to action. Built from the plan constants so they cannot drift. */
export const CTA_FACTS = `Client Kit takes no cut. Free plan: ${SENT_LIMITS.free} sends a month, and it never expires.`;
export const FOUNDER_LINE = `Founder plan: $${PLAN_PRICES.founder.usd} a month for the first ${FOUNDER_CAP} workspaces.`;

export const CTA: Record<ToolSlug, { heading: string; body: string; secondaryLabel: string; secondaryHref: string; small: string }> = {
  "advance-payment-request-message-generator": {
    heading: "Skip the chasing. Put the advance on the proposal.",
    body: `With Client Kit, your client reads the scope, signs, and pays the advance to your UPI or your own payment link, all on one page. ${CTA_FACTS}`,
    secondaryLabel: "See what your client sees",
    secondaryHref: "/s/demo-acme",
    small: "Client Kit does not make invoices or hold money. Your client clicks \"I've paid\" and you confirm it.",
  },
  "freelance-proposal-clause-generator": {
    heading: "Make the terms part of what the client signs.",
    body: `Paste these clauses into a Client Kit proposal. Your client reads them, e-signs, and pays the advance to your UPI or payment link on the same page. The advance step and the revision limit are built in. ${CTA_FACTS}`,
    secondaryLabel: "See a sample proposal",
    secondaryHref: "/s/demo-acme",
    small: "Client Kit uses a simple electronic signature and does not make invoices or hold money. This is not legal advice.",
  },
  "client-follow-up-message-generator": {
    heading: "Fewer follow-ups. Get the yes and the advance in one go.",
    body: `Client Kit puts the proposal, the e-signature and the advance payment on one link. Your client signs and pays your UPI or payment link directly, so there is less to chase. ${CTA_FACTS}`,
    secondaryLabel: "Try the live demo",
    secondaryHref: "/s/demo-acme",
    small:
      "Client Kit never sends a follow-up on its own. It lists the jobs that need one and writes the message, and you press send. It does not make invoices.",
  },
};
