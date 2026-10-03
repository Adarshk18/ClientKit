import { daysPhrase, firstName, moneyText, tidy } from "@/lib/tools/format";

export type Situation = "proposal_quiet" | "waiting_on_client" | "advance_unpaid" | "payment_overdue" | "after_delivery";
export type Relationship = "new" | "regular" | "company";
export type LadderAction = "none" | "close_file" | "pause_work";

export type LadderInput = {
  situation: Situation;
  channel: "whatsapp" | "email";
  relationship: Relationship;
  clientName: string;
  yourName: string;
  project: string;
  daysSince: number;
  amount: number;
  currency: string;
  reference: string;
  howToPay: string;
  deadline: string;
  action: LadderAction;
};

export type LadderStep = {
  step: 1 | 2 | 3 | 4;
  label: string;
  when: string;
  subject: string;
  body: string;
};

export const SITUATIONS: { value: Situation; label: string; needsAmount: boolean }[] = [
  { value: "proposal_quiet", label: "I sent a proposal and they went quiet", needsAmount: false },
  { value: "waiting_on_client", label: "I am waiting on their feedback or files", needsAmount: false },
  { value: "advance_unpaid", label: "They have not paid the advance", needsAmount: true },
  { value: "payment_overdue", label: "Their payment is late", needsAmount: true },
  { value: "after_delivery", label: "I delivered and they stopped replying", needsAmount: false },
];

export const DEFAULT_LADDER: LadderInput = {
  situation: "payment_overdue",
  channel: "whatsapp",
  relationship: "regular",
  clientName: "Priya",
  yourName: "Aarav",
  project: "website redesign",
  daysSince: 7,
  amount: 30000,
  currency: "INR",
  reference: "",
  howToPay: "UPI ID aarav@okaxis",
  deadline: "",
  action: "none",
};

const STEP_LABELS = ["Polite nudge", "Friendly reminder", "Clear deadline", "Last message"] as const;

function gaps(rel: Relationship): string[] {
  if (rel === "company") return ["Send now", "About 5 working days later", "About 5 working days after that", "About a week after that"];
  if (rel === "new") return ["Send now", "3 days later", "3 to 4 days after that", "5 days after that"];
  return ["Send now", "2 to 3 days later", "3 days after that", "4 to 5 days after that"];
}

export function generateLadder(input: LadderInput): { steps: LadderStep[]; tips: string[] } {
  const name = firstName(input.clientName.trim() ? input.clientName : "there");
  const you = tidy(input.yourName) || "[your name]";
  const project = tidy(input.project) || "the project";
  const how = tidy(input.howToPay);
  const ref = tidy(input.reference);
  const refBit = ref ? ` (${ref})` : "";
  const amountStr = input.amount > 0 ? moneyText(input.amount, input.currency) : "[amount]";
  const deadline = tidy(input.deadline);
  const by = deadline ? `by ${deadline}` : "within the next few days";
  const sinceBit = `I have not heard back for ${daysPhrase(input.daysSince)}.`;
  const email = input.channel === "email";
  const company = input.relationship === "company";
  const hello = email ? (company ? `Dear ${name},` : `Hi ${name},`) : company ? `Hello ${name},` : `Hi ${name},`;
  const payBit = how ? (email ? ` Payment details: ${how}.` : ` You can pay via ${how}.`) : "";

  const stop: Record<LadderAction, { s3: string; s4: string }> = {
    none: {
      s3: deadline ? "I would like to settle this by then." : "I would like to settle this soon.",
      s4: "Please tell me today what the plan is so we can close this properly.",
    },
    close_file: {
      s3: "If I do not hear back by then, I will close the file for now.",
      s4: "I will close the file for now. If things change, message me and we can pick it up again.",
    },
    pause_work: {
      s3: "If I do not hear back by then, I will pause work until we have spoken.",
      s4: "I have paused work for now. Message me when you are ready and we will restart.",
    },
  };
  const act = stop[input.action];

  type Core = { s1: string; s2: string; s3: string; s4: string };
  let core: Core;

  switch (input.situation) {
    case "proposal_quiet":
      core = {
        s1: `I wanted to check that my proposal for ${project} reached you. Do you have any questions I can answer?`,
        s2: `Following up on my proposal for ${project}. Could you tell me if you would like to go ahead, change something, or pass for now? A short yes or no helps me plan my schedule.`,
        s3: `I can hold a slot for ${project} ${deadline ? `until ${deadline}` : "until the end of this week"}. Could you confirm ${by} whether you want to go ahead?`,
        s4: `I have not heard back, so I will assume the timing is not right for ${project}. ${
          input.action === "close_file" ? "I will close the file for now. " : ""
        }If things change, message me and we can pick it up again.`,
      };
      break;
    case "waiting_on_client":
      core = {
        s1: `I am waiting on your feedback or files for ${project} to move to the next step. Could you send them when you can?`,
        s2: `A quick reminder that I still need your feedback or files for ${project}. Without them I cannot continue. Could you send them ${by}?`,
        s3: `The timeline for ${project} depends on getting your input ${by}. ${
          input.action === "pause_work" ? "If I do not hear back by then, I will pause work and the delivery date will move." : "If it comes later, the delivery date will move."
        }`,
        s4: `I am closing the loop on ${project} for now. ${
          input.action === "pause_work" ? "Work is paused. " : ""
        }Message me whenever you are ready and we will restart.`,
      };
      break;
    case "advance_unpaid":
      core = {
        s1: `Just checking that you saw my message about the advance of ${amountStr} for ${project}.${payBit}`,
        s2: `The advance of ${amountStr} for ${project} is still pending, and I start work once it is received. Could you pay today, or tell me when to expect it?${payBit}`,
        s3: `I can hold your start date ${deadline ? `until ${deadline}` : "until the end of this week"}. Please pay the advance of ${amountStr} ${by}, or tell me a new date that works for you.`,
        s4: `I have not received the advance, so I am not able to start ${project}. ${
          input.action === "close_file" ? "I will close the file for now. " : ""
        }If you still want to go ahead, message me and we will set a new start date.`,
      };
      break;
    case "payment_overdue":
      core = {
        s1: `A friendly reminder that the payment of ${amountStr}${refBit} for ${project} is now due.${payBit} If you have already paid, please ignore this and send me the reference so I can match it.`,
        s2: `The payment of ${amountStr}${refBit} for ${project} is still open. Could you pay today, or tell me the date it will arrive?${payBit}`,
        s3: `Please pay ${amountStr}${refBit} ${by}.${payBit} ${act.s3}`,
        s4: `This is my last reminder about ${amountStr}${refBit} for ${project}. ${act.s4}`,
      };
      break;
    case "after_delivery":
      core = {
        s1: `I hope the ${project} files are working well for you. Have you had a chance to look them over? I would love your feedback.`,
        s2: `Following up on the ${project} files I delivered. Could you confirm that everything arrived and looks good?`,
        s3: `Could you confirm approval of ${project} ${by}? After that I will treat the project as complete.`,
        s4: `I am closing the file on ${project} as complete. If you need any changes, reply here and we can talk about them.`,
      };
      break;
  }

  const bodies = [core.s1, core.s2, core.s3, core.s4];
  const withSince = (i: number) => (i === 1 ? `${sinceBit} ` : "");

  const signOff = (i: number) => {
    if (!email) return i === 0 ? `Thanks, ${you}` : i === 3 ? `Thank you,\n${you}` : `Thanks,\n${you}`;
    return company ? `Kind regards,\n${you}` : i === 3 ? `Regards,\n${you}` : `Thanks,\n${you}`;
  };

  const subjectBase: Record<Situation, string[]> = {
    proposal_quiet: [`Checking in on my proposal for ${project}`, `Following up: ${project} proposal`, `${project}: can you confirm?`, `Closing the loop on ${project}`],
    waiting_on_client: [`Waiting on your input for ${project}`, `Reminder: input needed for ${project}`, `${project}: timeline depends on your reply`, `Pausing ${project} for now`],
    advance_unpaid: [`Advance for ${project}`, `Reminder: advance for ${project}`, `${project}: start date on hold`, `Advance not received for ${project}`],
    payment_overdue: [`Payment reminder for ${project}`, `Reminder: payment for ${project} is open`, `Payment needed ${by}: ${project}`, `Last reminder: payment for ${project}`],
    after_delivery: [`How are the ${project} files?`, `Following up on the ${project} files`, `Please confirm approval of ${project}`, `Closing ${project}`],
  };

  const gapList = gaps(input.relationship);
  const steps: LadderStep[] = bodies.map((text, i) => {
    const intro = i === 1 ? withSince(1) : "";
    const body = `${hello}\n\n${intro}${text}\n\n${signOff(i)}`.replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n");
    return {
      step: (i + 1) as 1 | 2 | 3 | 4,
      label: STEP_LABELS[i]!,
      when: gapList[i]!,
      subject: subjectBase[input.situation][i]!,
      body,
    };
  });

  const tips = [
    "Send one step at a time and wait for the gap shown before the next one. Do not send all four in a row.",
    "Keep each message on its own. Short messages get answered more often than long ones.",
    "If they reply at any step, stop the ladder and answer them.",
    "Client Kit never sends a message for you. These stay in your hands until you press send yourself.",
  ];
  return { steps, tips };
}

/** Where to start, based on how long the client has been quiet. This only words advice, nothing is stored. */
export function suggestStartStep(daysSince: number): { step: 1 | 2 | 3; text: string } {
  const d = Number.isFinite(daysSince) ? daysSince : 0;
  const quietLong = d >= 14;
  const quietMid = d >= 7;
  if (!quietMid) return { step: 1, text: "Start with step 1. A short, friendly check in is enough this early." };
  if (!quietLong) return { step: 2, text: "It has been about a week. If you have not sent a check in yet, start at step 1. If you have, send step 2." };
  return { step: 3, text: "It has been two weeks or more. If your earlier messages went unanswered, you can start at step 2 or 3." };
}
