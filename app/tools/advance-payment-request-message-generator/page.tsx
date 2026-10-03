import Link from "next/link";
import { AdvanceTool } from "@/components/tools/advance-tool";
import { Example, H2, H3, P, UL } from "@/components/tools/example";
import { ToolShell } from "@/components/tools/tool-shell";
import { pageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools/content";
import { DEFAULT_ADVANCE, generateAdvanceMessages, type AdvanceInput } from "@/lib/tools/advance-message";

const tool = getTool("advance-payment-request-message-generator");

export const metadata = pageMetadata({
  title: { absolute: tool.title },
  description: tool.description,
  path: tool.path,
});

const base: AdvanceInput = DEFAULT_ADVANCE;

function pick(input: Partial<AdvanceInput>, key: "gentle" | "standard" | "firm") {
  const r = generateAdvanceMessages({ ...base, ...input });
  return r.versions.find((v) => v.key === key)!;
}

export default function Page() {
  const newClient = pick(
    { clientName: "Neha", yourName: "Rohan", project: "logo and brand kit", fee: 40000, advanceValue: 50, balanceDue: "when you approve the final files", howToPay: "UPI ID rohan@oksbi", firstProject: true },
    "gentle",
  );
  const emailExample = pick(
    { channel: "email", style: "indian", clientName: "Mr. Iyer", yourName: "Kavya", project: "annual report design", fee: 120000, advanceValue: 40, balanceDue: "within 7 days of delivery", howToPay: "UPI ID kavya@okicici, or bank transfer on request", proformaLine: true },
    "standard",
  );
  const repeat = pick(
    { clientName: "Sam", yourName: "Dev", project: "June video edits", fee: 18000, advanceValue: 30, balanceDue: "on delivery", mentionProposal: false, askUtr: false, howToPay: "UPI ID dev@okaxis" },
    "standard",
  );
  const atEnd =
    "Hi Priya,\n\nI understand you would like to pay at the end. For a project this size I take a part payment first. How about 30% now (₹18,000) and the rest on delivery? Work starts as soon as the first payment is in.\n\nThanks,\nAarav";


  return (
    <ToolShell tool={tool}>
      <AdvanceTool />

      <H2>Advance payment message examples</H2>
      <P>These are built with the same tool. Change the names and amounts above to make them yours.</P>
      <H3>WhatsApp message for a new client</H3>
      <Example title="WhatsApp, gentle version" text={newClient.body} />
      <H3>Email with a subject line</H3>
      <Example title="Email, standard version" subject={emailExample.subject} text={emailExample.body} />
      <H3>For a repeat client (shorter)</H3>
      <Example title="WhatsApp, standard version" text={repeat.body} />
      <H3>When the client wants to pay at the end</H3>
      <Example title="WhatsApp reply" text={atEnd} />

      <H2>What to include in an advance payment request</H2>
      <UL
        items={[
          "The amount, and the percent of the total it is, so nobody has to work it out.",
          "What it is for: the project name, so the payment is easy to match later.",
          "How to pay: a UPI ID, a payment link or bank details.",
          "What happens after: when work starts, and when the first deliverable is due.",
          "The balance: how much is left and when it is due.",
        ]}
      />

      <H2>How much advance should you ask for?</H2>
      <P>
        There is no rule. Many freelancers ask for 30% to 50% upfront, and 50% now with 50% on delivery is common in
        India. Small jobs are often paid in full before work starts. Longer jobs are often split into milestones, for
        example 40% to start, 30% halfway and 30% on delivery.
      </P>
      <P>
        Two Indian freelance guides describe the same pattern as common practice: Riffit&apos;s post{" "}
        <a
          className="underline underline-offset-2"
          href="https://www.riffit.in/blog/asking-for-50-percent-upfront-freelance"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          on asking for 50% upfront
        </a>{" "}
        and its guide to{" "}
        <a
          className="underline underline-offset-2"
          href="https://www.riffit.in/blog/freelance-invoice-payment-terms-india"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          freelance payment terms in India
        </a>
        . Both are written by an invoicing company, and they describe habits, not law. Pick what fits your work and
        your client, and put it in the proposal before work starts.
      </P>

      <H2>Tips for India: UPI, payment links and proforma invoices</H2>
      <UL
        items={[
          "Type your UPI ID with care. One wrong letter sends the money to someone else.",
          "Check your bank or UPI app for the money before you start. A screenshot from the client is not the same as money received.",
          "Ask for the UTR or a screenshot so you can match the payment.",
          "A proforma invoice is only needed if the client's accounts team asks for one. Tax rules differ, so check with an accountant. This is not tax advice.",
        ]}
      />
      <P>
        Client Kit does not make invoices or hold money. Your client pays you directly, then clicks &quot;I&apos;ve
        paid&quot;, and you confirm it once you see the money.
      </P>

      <H2>Get the advance on the same page as the signature</H2>
      <P>
        In <Link className="underline underline-offset-2" href="/">Client Kit, the one link proposal, e-sign and payment tool</Link>,
        you pick an advance of 0, 30, 40 or 50 percent when you write the job. After your client signs, they see your
        UPI QR or payment link for the advance amount. Once you confirm it, they can pay the balance the same way. See
        it on the{" "}
        <Link className="underline underline-offset-2" href="/s/demo-acme">
          demo proposal
        </Link>
        . Need terms for the proposal itself? Try the{" "}
        <Link className="underline underline-offset-2" href="/tools/freelance-proposal-clause-generator">
          clause maker
        </Link>
        .
      </P>
    </ToolShell>
  );
}
