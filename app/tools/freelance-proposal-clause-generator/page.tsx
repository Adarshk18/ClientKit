import Link from "next/link";
import { ClauseTool } from "@/components/tools/clause-tool";
import { Example, H2, H3, P, UL } from "@/components/tools/example";
import { ToolShell } from "@/components/tools/tool-shell";
import { pageMetadata } from "@/lib/seo";
import { DEFAULT_CLAUSE, generateClauses, type ClauseInput } from "@/lib/tools/clauses";
import { getTool } from "@/lib/tools/content";

const tool = getTool("freelance-proposal-clause-generator");

export const metadata = pageMetadata({
  title: { absolute: tool.title },
  description: tool.description,
  path: tool.path,
});

function clause(id: "scope" | "revisions" | "payment", input: Partial<ClauseInput>) {
  return generateClauses({ ...DEFAULT_CLAUSE, ...input }).clauses.find((c) => c.id === id)!.plain;
}

export default function Page() {
  const oneRound = clause("revisions", { revisionRounds: 1, extraPricing: "hourly", extraAmount: 1500, strictness: "friendly" });
  const twoRounds = clause("revisions", { revisionRounds: 2, extraPricing: "fixed", extraAmount: 3000 });
  const paidExtra = clause("revisions", { revisionRounds: 0, extraPricing: "fixed", extraAmount: 2000, strictness: "strict" });
  const unlimited =
    "Revisions are unlimited for 14 days after the first delivery. After that, the project is closed and any further changes are charged at ₹1,500 per hour. I will confirm the hours in writing before I start.";

  const website = clause("scope", {});
  const logo = clause("scope", {
    project: "Logo for a cafe",
    deliverables: "Three logo concepts\nOne chosen logo, refined\nFinal files: PNG, SVG and PDF",
    outOfScope: "Brand guidelines\nPackaging design\nSigns and printing",
    timeline: "10 days from the date the advance is received",
  });
  const video = clause("scope", {
    project: "YouTube video edit",
    deliverables: "One edited video up to 10 minutes\nColour correction and audio clean-up\nOne thumbnail",
    outOfScope: "Filming\nMotion graphics beyond a simple title\nStock footage and music licences",
    timeline: "5 working days from the date the footage is received",
  });

  const split5050 = clause("payment", { fee: 60000, advancePercent: 50, balanceDue: "on delivery", latePayment: "none", validDays: 14 });
  const usd = clause("payment", { currency: "USD", fee: 2400, advancePercent: 30, balanceDue: "within 7 days of delivery", howToPay: "a payment link I will send", latePayment: "pause" });
  const upfront = clause("payment", { fee: 8000, advancePercent: 100, latePayment: "none", validDays: 7 });
  const threeWay =
    "The total fee is ₹90,000. It is paid in three parts: 30% (₹27,000) when you accept this proposal, 40% (₹36,000) when the first full draft is delivered, and 30% (₹27,000) on final delivery. I start each stage once the payment for it is received.";
  const monthly =
    "The fee is ₹25,000 per month for ongoing work. It is paid in advance on or before the 1st of each month by UPI. If a month's payment has not arrived by the 5th, I may pause work until it is received.";

  return (
    <ToolShell tool={tool}>
      <ClauseTool />

      <H2>Revision clause examples</H2>
      <H3>One round, extra rounds by the hour</H3>
      <Example title="Friendly wording" text={oneRound} />
      <H3>Two rounds, fixed price for an extra round</H3>
      <Example title="Standard wording" text={twoRounds} />
      <H3>No rounds included, every round paid</H3>
      <Example title="Strict wording" text={paidExtra} />
      <H3>Unlimited with a time limit</H3>
      <Example title="Time-boxed wording" text={unlimited} />

      <H2>Scope and out-of-scope examples</H2>
      <P>A good scope clause lists what you will deliver and what you will not. These three are short worked examples.</P>
      <H3>A website</H3>
      <Example title="Scope" text={website} />
      <H3>A logo</H3>
      <Example title="Scope" text={logo} />
      <H3>A video edit</H3>
      <Example title="Scope" text={video} />

      <H2>Payment terms examples</H2>
      <H3>50/50 in rupees</H3>
      <Example title="Payment terms" text={split5050} />
      <H3>30/40/30 in three parts</H3>
      <Example title="Payment terms" text={threeWay} />
      <H3>100% upfront for a small job</H3>
      <Example title="Payment terms" text={upfront} />
      <H3>Monthly in advance</H3>
      <Example title="Payment terms" text={monthly} />
      <H3>Dollars</H3>
      <Example title="Payment terms" text={usd} />

      <H2>How many revisions should a freelancer include?</H2>
      <P>
        There is no standard. Two rounds is a common starting point, so it is a sensible default if you are not sure.
        Include fewer for small jobs where feedback is quick, and more for complex work with several people giving
        input. What matters more than the number is that you say what counts as one round and what an extra round
        costs. Without that, &quot;a few small changes&quot; can run on for weeks.
      </P>

      <H2>Revision or new request? How to tell</H2>
      <UL
        items={[
          "A revision changes something you already delivered so it matches the brief you agreed.",
          "A new request adds something that was not in the brief: a new page, a new feature, a new direction.",
          "If the client changes their mind about something they approved earlier, treat it as new work and quote it.",
          "When unsure, ask: could I have done this from the original brief? If not, it is a new request.",
        ]}
      />

      <H2>Proposal terms vs a full contract</H2>
      <P>
        These clauses cover the basics for a small project: what you will do, how many rounds of changes are included,
        and how you get paid. They do not cover who owns the work, confidentiality, liability, or ending the project
        early. For large or unusual projects, or where those matter, use a full contract and have a lawyer check it.
        This tool is not legal advice.
      </P>

      <H2>Put the terms where the client must read them</H2>
      <P>
        A clause only helps if the client has seen it before saying yes. In{" "}
        <Link className="underline underline-offset-2" href="/">
          Client Kit, the one link proposal, e-sign and payment tool
        </Link>
        , you set the revision rounds and the price of an extra round when you write the job. The client sees them on the
        proposal before they sign, and what they agreed is stored with their signature. Pair it with a{" "}
        <Link className="underline underline-offset-2" href="/tools/advance-payment-request-message-generator">
          clear advance request
        </Link>{" "}
        and, if they go quiet, a{" "}
        <Link className="underline underline-offset-2" href="/tools/client-follow-up-message-generator">
          follow-up that stays polite
        </Link>
        . See the{" "}
        <Link className="underline underline-offset-2" href="/s/demo-acme">
          demo proposal
        </Link>
        .
      </P>
    </ToolShell>
  );
}
