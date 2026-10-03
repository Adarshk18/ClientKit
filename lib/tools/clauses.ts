import { moneyText, round2, tidy } from "@/lib/tools/format";

export type Strictness = "friendly" | "standard" | "strict";
export type ExtraRoundPricing = "fixed" | "hourly" | "quote";
export type LatePayment = "none" | "pause";
export type Refund = "none" | "non_refundable" | "refundable_before_start";

export type ClauseInput = {
  strictness: Strictness;
  currency: string;
  project: string;
  deliverables: string;
  outOfScope: string;
  timeline: string;
  revisionRounds: number;
  roundMeaning: string;
  feedbackDays: number;
  extraPricing: ExtraRoundPricing;
  extraAmount: number;
  notRevisions: string;
  fee: number;
  advancePercent: number;
  balanceDue: string;
  howToPay: string;
  latePayment: LatePayment;
  taxesExtra: boolean;
  validDays: number;
  refund: Refund;
};

export type Clause = { id: "scope" | "revisions" | "payment"; title: string; lines: string[]; plain: string };

export type ClauseResult = {
  clauses: Clause[];
  fullText: string;
  problems: string[];
};

export const DEFAULT_CLAUSE: ClauseInput = {
  strictness: "standard",
  currency: "INR",
  project: "Website redesign for Studio Oak",
  deliverables: "Homepage design\nThree inner page designs\nMobile layouts for all four pages",
  outOfScope: "Copywriting\nLogo design\nHosting and maintenance",
  timeline: "3 weeks from the date the advance is received",
  revisionRounds: 2,
  roundMeaning: "one set of consolidated feedback from you, sent together in one message",
  feedbackDays: 5,
  extraPricing: "fixed",
  extraAmount: 3000,
  notRevisions: "New pages, a new design direction, or changes to work you have already approved",
  fee: 60000,
  advancePercent: 50,
  balanceDue: "within 7 days of delivery",
  howToPay: "UPI to aarav@okaxis",
  latePayment: "pause",
  taxesExtra: false,
  validDays: 14,
  refund: "none",
};

function listLines(text: string): string[] {
  return text
    .split(/\r?\n|;/)
    .map((l) => tidy(l.replace(/^[-*\d.)\s]+/, "")))
    .filter(Boolean);
}

function ordinalWord(n: number): string {
  const words = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[n] ?? String(n);
}

export function generateClauses(input: ClauseInput): ClauseResult {
  const problems: string[] = [];
  const project = tidy(input.project) || "the project";
  const deliverables = listLines(input.deliverables);
  const outOfScope = listLines(input.outOfScope);
  const timeline = tidy(input.timeline);
  const rounds = Number.isFinite(input.revisionRounds) ? Math.min(20, Math.max(0, Math.round(input.revisionRounds))) : 0;
  const feedbackDays = Number.isFinite(input.feedbackDays) ? Math.min(60, Math.max(1, Math.round(input.feedbackDays))) : 5;
  const meaning = tidy(input.roundMeaning) || "one set of consolidated feedback sent together";
  const notRev = tidy(input.notRevisions);
  const strict = input.strictness;
  const cur = input.currency;

  if (!deliverables.length) problems.push("List at least one deliverable so the scope clause has something to point to.");
  if (input.extraPricing !== "quote" && !(input.extraAmount > 0)) problems.push("Add the price for an extra round, or choose 'Quoted case by case'.");

  // Scope
  const scopeLines: string[] = [];
  scopeLines.push(
    strict === "friendly"
      ? `This proposal covers the following work for ${project}:`
      : `The scope of ${project} is limited to the following deliverables:`,
  );
  deliverables.forEach((d) => scopeLines.push(`- ${d}`));
  if (outOfScope.length) {
    scopeLines.push(strict === "friendly" ? "These things are not included, but I am happy to quote for them:" : "The following are not included:");
    outOfScope.forEach((d) => scopeLines.push(`- ${d}`));
  }
  if (timeline) scopeLines.push(`Timeline: ${timeline}.`);
  scopeLines.push(
    strict === "strict"
      ? "Any work outside this list is a change request. I will send a short written quote and start it only after you approve it."
      : strict === "friendly"
        ? "If you want something that is not on this list, just tell me. I will send a short quote and we can add it."
        : "Work outside this list is a change request. I will send a quote and start it once you approve it.",
  );

  // Revisions
  const revLines: string[] = [];
  const roundWord = rounds === 1 ? "round" : "rounds";
  const extraCost =
    input.extraPricing === "fixed" && input.extraAmount > 0
      ? moneyText(round2(input.extraAmount), cur)
      : input.extraPricing === "hourly" && input.extraAmount > 0
        ? `${moneyText(round2(input.extraAmount), cur)} per hour`
        : "";
  if (rounds === 0) {
    revLines.push("No revision rounds are included in the fee. Each round of changes after the first delivery is charged separately.");
    revLines.push(
      extraCost
        ? `A round costs ${extraCost}. I will confirm the price in writing before I begin.`
        : "I will quote the price of a round in writing before I begin it.",
    );
  } else {
    revLines.push(`The fee includes ${ordinalWord(rounds)} (${rounds}) ${roundWord} of revisions. A round means ${meaning}.`);
    const extra = extraCost ? `an extra round costs ${extraCost}` : "the price of an extra round is quoted before it starts";
    revLines.push(
      strict === "friendly"
        ? `If you need more than that, ${extra}, and I will tell you the price before I begin.`
        : `After the included ${roundWord}, ${extra}. I will confirm the price in writing before I begin the extra round.`,
    );
  }
  revLines.push(
    strict === "strict"
      ? `Please send feedback within ${feedbackDays} days of each delivery. If I do not hear back in that time, the round is treated as used and the work moves on to the next step.`
      : strict === "friendly"
        ? `Please try to send feedback within ${feedbackDays} days of each delivery so we stay on schedule.`
        : `Please send feedback within ${feedbackDays} days of each delivery. Later feedback may move the delivery date.`,
  );
  if (notRev) {
    revLines.push(`These are not revisions and are treated as new work: ${notRev.charAt(0).toLowerCase()}${notRev.slice(1)}.`);
  }

  // Payment
  const payLines: string[] = [];
  const fee = Number.isFinite(input.fee) && input.fee > 0 ? round2(input.fee) : 0;
  if (!fee) problems.push("Enter the total fee so the payment clause can show amounts.");
  const pct = Math.min(100, Math.max(0, Number.isFinite(input.advancePercent) ? input.advancePercent : 0));
  const advance = fee ? round2((fee * pct) / 100) : 0;
  const balance = fee ? round2(fee - advance) : 0;
  const feeStr = fee ? moneyText(fee, cur) : "[total fee]";
  payLines.push(`The total fee for ${project} is ${feeStr}${input.taxesExtra ? ", plus applicable taxes" : ""}.`);
  if (fee && pct > 0 && pct < 100) {
    payLines.push(`An advance of ${moneyText(advance, cur)} (${pct}%) is due when you accept this proposal, and I start work once it is received.`);
    payLines.push(`The balance of ${moneyText(balance, cur)} is due ${tidy(input.balanceDue) || "on delivery"}.`);
  } else if (fee && pct >= 100) {
    payLines.push(`The full fee is due when you accept this proposal, and I start work once it is received.`);
  } else if (fee) {
    payLines.push(`The full fee is due ${tidy(input.balanceDue) || "on delivery"}.`);
  }
  if (tidy(input.howToPay)) payLines.push(`Payment is made by ${tidy(input.howToPay)}.`);
  if (input.latePayment === "pause") {
    payLines.push(
      strict === "strict"
        ? "If a payment is late, I will pause work until it is received, and delivery dates move by the same number of days."
        : "If a payment is late, I may pause work until it is received, and delivery dates move by the same number of days.",
    );
  }
  const validDays = Number.isFinite(input.validDays) ? Math.min(180, Math.max(0, Math.round(input.validDays))) : 0;
  if (validDays > 0) payLines.push(`This quote is valid for ${validDays} days from the date it was sent.`);
  if (input.refund === "non_refundable") payLines.push("The advance is non-refundable once work has started.");
  if (input.refund === "refundable_before_start") payLines.push("The advance is refundable if you cancel before I have started work.");

  const clauses: Clause[] = [
    { id: "scope", title: "Scope of work", lines: scopeLines, plain: scopeLines.join("\n") },
    { id: "revisions", title: "Revisions", lines: revLines, plain: revLines.join("\n") },
    { id: "payment", title: "Payment terms", lines: payLines, plain: payLines.join("\n") },
  ];
  const fullText = clauses.map((c, i) => `${i + 1}. ${c.title}\n${c.plain}`).join("\n\n");
  return { clauses, fullText, problems };
}
