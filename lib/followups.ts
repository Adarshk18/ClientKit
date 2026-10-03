import { formatMoney } from "@/lib/money";
import type { NudgeReason } from "@/lib/nudges";

/**
 * Ready-to-send follow-up wording. Client Kit never sends it. The freelancer opens it in WhatsApp or their
 * mail app, or copies it, and sends it themselves.
 */
export type FollowUpInput = {
  reason: Exclude<NudgeReason, "awaiting_confirmation">;
  /** 1 = polite first message, 2 = firmer second message. */
  step: 1 | 2;
  clientName: string;
  freelancerName: string;
  title: string;
  link: string;
  /** Amount for the payment reasons, in minor units. */
  amount?: number;
  currency?: string;
  /** ISO date the balance was due. */
  dueAt?: string | null;
};

export type FollowUpMessage = {
  text: string;
  subject: string;
  body: string;
};

export function firstName(full: string): string {
  const word = full.trim().split(/\s+/)[0] ?? "";
  return word || "there";
}

function dueDateText(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
}

export function buildFollowUp(input: FollowUpInput): FollowUpMessage {
  const name = firstName(input.clientName);
  const me = input.freelancerName.trim() || "me";
  const money =
    typeof input.amount === "number" && input.currency ? formatMoney(input.amount, input.currency) : "the amount";
  const due = dueDateText(input.dueAt);
  const dueBit = due ? ` (it was due on ${due})` : "";
  const polite = input.step === 1;

  let lines: string[];
  let subject: string;

  switch (input.reason) {
    case "not_viewed":
      subject = `Proposal for ${input.title}`;
      lines = polite
        ? [
            `Hi ${name},`,
            `I sent you the proposal for ${input.title} a few days ago. In case it got buried, here is the link again: ${input.link}`,
            `It is a short read and you can sign on the same page. Let me know if anything is unclear.`,
          ]
        : [
            `Hi ${name},`,
            `Following up once more on the proposal for ${input.title}: ${input.link}`,
            `Could you give me a yes or no this week? If your plans have changed, that is completely fine. I would just like to know so I can plan my time.`,
          ];
      break;
    case "not_signed":
      subject = `Questions on ${input.title}?`;
      lines = polite
        ? [
            `Hi ${name},`,
            `Just checking in on the proposal for ${input.title}. Is there anything you would like me to explain or change before you sign?`,
            `You can review and sign here: ${input.link}`,
          ]
        : [
            `Hi ${name},`,
            `I have not heard back on the proposal for ${input.title}, and I am planning my schedule for the coming weeks.`,
            `Could you sign this week, or tell me what is holding it up? Here is the link: ${input.link}`,
          ];
      break;
    case "advance_unpaid":
      subject = `Advance for ${input.title}`;
      lines = polite
        ? [
            `Hi ${name},`,
            `Thanks for signing ${input.title}. The next step is the advance of ${money}. I start work as soon as it arrives.`,
            `You can pay on the same page: ${input.link}`,
            `If something is stopping you, tell me and we can sort it out.`,
          ]
        : [
            `Hi ${name},`,
            `A reminder that the advance of ${money} for ${input.title} is still open. I can only start once it is received, so the start date moves back each day.`,
            `Could you pay today, or tell me the date I should expect it? ${input.link}`,
          ];
      break;
    case "payment_unpaid":
      subject = `Payment for ${input.title}`;
      lines = polite
        ? [
            `Hi ${name},`,
            `Thanks for signing ${input.title}. The payment of ${money} is the next step.`,
            `You can pay on the same page: ${input.link}`,
            `If you have already paid, send me the reference and I will match it up.`,
          ]
        : [
            `Hi ${name},`,
            `The payment of ${money} for ${input.title} has not reached me yet.`,
            `Could you pay today, or tell me the date I should expect it? ${input.link}`,
          ];
      break;
    case "balance_overdue":
      subject = `Balance for ${input.title}`;
      lines = polite
        ? [
            `Hi ${name},`,
            `A friendly reminder that the balance of ${money} for ${input.title} is due${dueBit}.`,
            `You can pay here: ${input.link}`,
            `If you have already paid, send me the reference and I will match it up.`,
          ]
        : [
            `Hi ${name},`,
            `The balance of ${money} for ${input.title} is still open${dueBit}.`,
            `Could you pay today, or tell me the date it will arrive? ${input.link}`,
          ];
      break;
  }

  const closing = polite ? `Thanks,\n${me}` : `Thank you,\n${me}`;
  const text = [...lines, closing].join("\n\n");
  return { text, subject, body: text };
}

export function whatsappHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function mailtoHref(to: string, subject: string, body: string): string {
  return `mailto:${encodeURIComponent(to).replace(/%40/g, "@")}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
