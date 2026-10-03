import { firstName, moneyText, round2, tidy } from "@/lib/tools/format";

export type AdvanceInput = {
  channel: "whatsapp" | "email";
  tone: "friendly" | "professional" | "firm";
  style: "simple" | "indian";
  clientName: string;
  yourName: string;
  project: string;
  fee: number;
  currency: string;
  advanceType: "percent" | "fixed";
  advanceValue: number;
  balanceDue: string;
  howToPay: string;
  start: string;
  mentionProposal: boolean;
  firstProject: boolean;
  askUtr: boolean;
  proformaLine: boolean;
};

export type AdvanceVersionKey = "gentle" | "standard" | "firm";

export type AdvanceVersion = {
  key: AdvanceVersionKey;
  label: string;
  subject: string;
  body: string;
};

export type AdvanceResult = {
  advance: number;
  balance: number;
  percent: number;
  problems: string[];
  versions: AdvanceVersion[];
  checklist: string[];
};

export const DEFAULT_ADVANCE: AdvanceInput = {
  channel: "whatsapp",
  tone: "friendly",
  style: "simple",
  clientName: "Priya",
  yourName: "Aarav",
  project: "website redesign",
  fee: 60000,
  currency: "INR",
  advanceType: "percent",
  advanceValue: 50,
  balanceDue: "on delivery",
  howToPay: "UPI ID aarav@okaxis",
  start: "",
  mentionProposal: true,
  firstProject: false,
  askUtr: true,
  proformaLine: false,
};

/** Works out the advance and balance, and lists anything the user should fix. */
export function advanceAmounts(input: AdvanceInput): { advance: number; balance: number; percent: number; problems: string[] } {
  const problems: string[] = [];
  const fee = Number.isFinite(input.fee) && input.fee > 0 ? round2(input.fee) : 0;
  if (!fee) problems.push("Enter the total fee so the amounts can be worked out.");
  let advance = 0;
  if (fee) {
    if (input.advanceType === "percent") {
      const pct = Number.isFinite(input.advanceValue) ? input.advanceValue : 0;
      if (pct <= 0 || pct > 100) problems.push("Enter an advance percent between 1 and 100.");
      advance = round2((fee * Math.min(100, Math.max(0, pct))) / 100);
    } else {
      const fixed = Number.isFinite(input.advanceValue) ? input.advanceValue : 0;
      if (fixed <= 0) problems.push("Enter an advance amount above zero.");
      if (fixed > fee) problems.push("The advance is more than the total fee. It has been capped at the fee.");
      advance = round2(Math.min(fee, Math.max(0, fixed)));
    }
  }
  const balance = round2(Math.max(0, fee - advance));
  const percent = fee ? Math.round((advance / fee) * 1000) / 10 : 0;
  return { advance, balance, percent, problems };
}

function percentText(percent: number): string {
  return Number.isInteger(percent) ? `${percent}%` : `${percent.toFixed(1)}%`;
}

export function generateAdvanceMessages(input: AdvanceInput): AdvanceResult {
  const { advance, balance, percent, problems } = advanceAmounts(input);
  const name = firstName(input.clientName.trim() ? input.clientName : "there");
  const you = tidy(input.yourName) || "[your name]";
  const project = tidy(input.project) || "the project";
  const cur = input.currency;
  const advanceStr = advance ? moneyText(advance, cur) : "[advance]";
  const feeStr = input.fee > 0 ? moneyText(input.fee, cur) : "[total fee]";
  const balanceStr = input.fee > 0 ? moneyText(balance, cur) : "[balance]";
  const how = tidy(input.howToPay);
  const due = tidy(input.balanceDue) || "on delivery";
  const start = tidy(input.start);
  const indian = input.style === "indian";
  const email = input.channel === "email";

  const hello = email ? (indian ? `Dear ${name},` : `Hi ${name},`) : indian ? `Hello ${name},` : `Hi ${name},`;

  const thanks = input.mentionProposal
    ? `Thank you for confirming the ${project} and for signing the proposal.`
    : `Thank you for confirming the ${project}.`;
  const first = input.firstProject ? "I am glad we are working together for the first time." : "";

  const percentBit = input.advanceType === "percent" || percent > 0 ? ` (${percentText(percent)} of ${feeStr})` : "";
  const balanceLine = `The balance of ${balanceStr} is due ${due}.`;
  const payLine = how
    ? indian
      ? `Payment details: ${how}.`
      : `You can pay via ${how}.`
    : "";
  const utrLine = input.askUtr
    ? indian
      ? "Kindly share a screenshot or the UTR once the payment is done, so I can match it."
      : "After you pay, please send me a screenshot or the UTR so I can match it."
    : "";
  const proformaLine = input.proformaLine
    ? "If your accounts team needs a proforma invoice for this, tell me and I will share one."
    : "";

  const asks: Record<AdvanceVersionKey, string> = {
    gentle: indian
      ? `To get started, I take an advance of ${advanceStr}${percentBit}. Kindly send it whenever it is convenient.`
      : `To get started, I take an advance of ${advanceStr}${percentBit}. Could you send it when you get a moment?`,
    standard: indian
      ? `To begin, I take an advance of ${advanceStr}${percentBit}. Kindly arrange the payment.`
      : `To begin, I take an advance of ${advanceStr}${percentBit}.`,
    firm: indian
      ? `The next step is the advance of ${advanceStr}${percentBit}. Kindly pay it today or tomorrow so I can hold your start date.`
      : `The next step is the advance of ${advanceStr}${percentBit}. Please pay it today or tomorrow so I can hold your start date.`,
  };

  const startVariants: Record<AdvanceVersionKey, string> = {
    gentle: start ? `Then I can start ${start}.` : "I can start as soon as it arrives.",
    standard: start ? `Work starts ${start}, once the advance is received.` : "Work starts once the advance is received.",
    firm: start ? `I can only start ${start} if the advance has arrived by then.` : "I can only start once the advance has arrived.",
  };

  const closers: Record<AdvanceVersionKey, string> = {
    gentle: email ? (indian ? "Thanks and regards," : "Thanks so much,") : "Thanks!",
    standard: email ? (indian ? "Thanks and regards," : "Thank you,") : "Thank you,",
    firm: email ? (indian ? "Regards," : "Thank you,") : "Thank you.",
  };

  const subjects: Record<AdvanceVersionKey, string> = {
    gentle: `Advance to start ${project}`,
    standard: `Advance payment for ${project}`,
    firm: `Advance payment pending for ${project}`,
  };

  const labels: Record<AdvanceVersionKey, string> = {
    gentle: "Gentle",
    standard: "Standard",
    firm: "Firm",
  };

  const build = (key: AdvanceVersionKey): AdvanceVersion => {
    const parts: string[] = [hello];
    if (key !== "firm" || email) parts.push([thanks, first].filter(Boolean).join(" "));
    parts.push(asks[key]);
    if (balance > 0) parts.push(balanceLine);
    parts.push(startVariants[key]);
    if (payLine) parts.push(payLine);
    if (utrLine) parts.push(utrLine);
    if (proformaLine) parts.push(proformaLine);
    const closer = `${closers[key]}\n${you}`;
    // WhatsApp keeps short paragraphs; email adds a blank line between them.
    const body = `${parts.filter(Boolean).join("\n\n")}\n\n${closer}`;
    return { key, label: labels[key], subject: subjects[key], body };
  };

  const order: AdvanceVersionKey[] =
    input.tone === "friendly" ? ["gentle", "standard", "firm"] : input.tone === "firm" ? ["firm", "standard", "gentle"] : ["standard", "gentle", "firm"];

  const checklist = [
    `Check the amounts: total ${feeStr}, advance ${advanceStr}, balance ${balanceStr}.`,
    how ? "Check the payment details character by character. One wrong letter in a UPI ID sends the money elsewhere." : "Add how to pay (UPI ID, payment link or bank details) before you send.",
    "Say clearly what happens after the advance: when work starts and what the first deliverable is.",
    "When the money arrives, confirm it in your bank or UPI app before you start.",
  ];

  return {
    advance,
    balance,
    percent,
    problems,
    versions: order.map(build),
    checklist,
  };
}
