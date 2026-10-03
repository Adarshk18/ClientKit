import Link from "next/link";
import { FollowUpTool } from "@/components/tools/follow-up-tool";
import { Example, H2, H3, P, UL } from "@/components/tools/example";
import { ToolShell } from "@/components/tools/tool-shell";
import { pageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools/content";
import { DEFAULT_LADDER, generateLadder, type LadderInput } from "@/lib/tools/follow-up-ladder";

const tool = getTool("client-follow-up-message-generator");

export const metadata = pageMetadata({
  title: { absolute: tool.title },
  description: tool.description,
  path: tool.path,
});

function step(n: 1 | 2 | 3 | 4, input: Partial<LadderInput>) {
  return generateLadder({ ...DEFAULT_LADDER, ...input }).steps[n - 1]!;
}

export default function Page() {
  const proposal1 = step(1, { situation: "proposal_quiet", project: "brand website", clientName: "Meera", relationship: "new", daysSince: 4 });
  const proposal2 = step(2, { situation: "proposal_quiet", project: "brand website", clientName: "Meera", relationship: "new", daysSince: 8 });
  const mid = step(3, { situation: "waiting_on_client", project: "app screens", clientName: "Arjun", daysSince: 6, action: "pause_work", deadline: "Friday" });
  const advance = step(2, { situation: "advance_unpaid", project: "website redesign", amount: 30000, daysSince: 3 });
  const overdueWa = step(2, { situation: "payment_overdue", amount: 30000, daysSince: 10, reference: "invoice 114" });
  const overdueEmail = step(3, { situation: "payment_overdue", channel: "email", amount: 30000, daysSince: 14, relationship: "company", deadline: "next Friday", action: "pause_work" });
  const closing = step(4, { situation: "proposal_quiet", project: "brand website", clientName: "Meera", relationship: "regular", daysSince: 21, action: "close_file" });

  return (
    <ToolShell tool={tool}>
      <FollowUpTool />

      <H2>Follow-up message examples by situation</H2>
      <H3>After you send a proposal</H3>
      <Example title="Step 1, WhatsApp" text={proposal1.body} />
      <Example title="Step 2, WhatsApp" text={proposal2.body} />
      <H3>When a client goes quiet mid-project</H3>
      <Example title="Step 3, WhatsApp, with a date and a pause" text={mid.body} />
      <H3>When the advance has not arrived</H3>
      <Example title="Step 2, WhatsApp" text={advance.body} />
      <H3>When payment is overdue</H3>
      <Example title="Step 2, WhatsApp" text={overdueWa.body} />
      <Example title="Step 3, email to a company" subject={overdueEmail.subject} text={overdueEmail.body} />
      <H3>The final &quot;closing the loop&quot; message</H3>
      <Example title="Step 4, WhatsApp" text={closing.body} />

      <H2>Polite vs firm: what actually changes</H2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left text-[14px] leading-6">
          <thead>
            <tr className="border-b border-line text-muted">
              <th scope="col" className="py-2 pr-3 font-medium"> </th>
              <th scope="col" className="py-2 pr-3 font-medium">Polite</th>
              <th scope="col" className="py-2 font-medium">Firm</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className="border-b border-line">
              <th scope="row" className="py-2 pr-3 font-medium">Opening line</th>
              <td className="py-2 pr-3">Checking you saw my last message.</td>
              <td className="py-2">This is still open and I need an answer.</td>
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="py-2 pr-3 font-medium">The ask</th>
              <td className="py-2 pr-3">One question, easy to answer.</td>
              <td className="py-2">One clear action.</td>
            </tr>
            <tr className="border-b border-line">
              <th scope="row" className="py-2 pr-3 font-medium">Deadline</th>
              <td className="py-2 pr-3">None, or &quot;when you can&quot;.</td>
              <td className="py-2">A date.</td>
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-3 font-medium">What happens next</th>
              <td className="py-2 pr-3">Nothing is said.</td>
              <td className="py-2">What you will do, only if you really will.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>WhatsApp or email?</H2>
      <P>
        A simple rule: use WhatsApp when you want speed and already chat with the person. Use email when you want a paper
        trail, or when you are dealing with a large company. For important money, do both: a short WhatsApp message that
        points to the email.
      </P>

      <H2>How many follow-ups before you stop?</H2>
      <P>
        Guides differ. For late invoices,{" "}
        <a className="underline underline-offset-2" href="https://duely.in/articles/late-payment-follow-up-email-templates" target="_blank" rel="noopener noreferrer nofollow">
          Duely
        </a>{" "}
        suggests a friendly reminder 1 to 3 days after the due date, then 7 to 10 days, 14 to 21 days, and a final
        notice at 30 or more days, and says most freelancers send three to five reminders.{" "}
        <a className="underline underline-offset-2" href="https://heymonsoon.com/tools/payment-reminder-templates" target="_blank" rel="noopener noreferrer nofollow">
          Monsoon
        </a>{" "}
        uses day 7, day 15 and day 30. Both are written for invoices and sell reminder tools, so treat them as examples
        of common rhythms, not rules.
      </P>
      <P>
        This tool gives four steps with gaps of a few days, because a proposal or an advance that has gone quiet is
        usually less formal than an overdue invoice. The last message closes the loop politely so that you can move on
        and they can restart whenever they want.
      </P>

      <H2>Stop it happening next time</H2>
      <P>
        Most chasing starts because the advance was never part of the deal. Put it in the proposal and ask for it right
        after the yes, with a{" "}
        <Link className="underline underline-offset-2" href="/tools/advance-payment-request-message-generator">
          clear advance request
        </Link>
        . Write what happens if a payment is late into your{" "}
        <Link className="underline underline-offset-2" href="/tools/freelance-proposal-clause-generator">
          proposal terms
        </Link>{" "}
        before work starts. In{" "}
        <Link className="underline underline-offset-2" href="/">
          Client Kit, the one link proposal, e-sign and payment tool
        </Link>
        , the client signs and sees the advance on the same page, and your dashboard lists the jobs that need a nudge.
        You write and send the message yourself. See the{" "}
        <Link className="underline underline-offset-2" href="/s/demo-acme">
          demo
        </Link>
        .
      </P>
      <UL items={["If a large sum is unpaid, get proper advice. This tool is not legal advice and it does not write threats."]} />
    </ToolShell>
  );
}
