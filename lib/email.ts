import { Resend } from "resend";
import { appUrl, resendFrom } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { logError } from "@/lib/logger";

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function send(to: string, subject: string, html: string): Promise<void> {
  const resend = client();
  if (!resend) {
    console.info("[clientkit:email] RESEND_API_KEY missing; skipped", subject);
    return;
  }
  try {
    const { error } = await resend.emails.send({
      from: resendFrom(),
      to,
      subject,
      html,
    });
    if (error) logError("email", error);
  } catch (error) {
    logError("email", error);
  }
}

function wrap(body: string): string {
  return `<!doctype html><html><body style="font-family:Georgia,serif;color:#1a1916;background:#f6f1e8;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border:1px solid #e7e0d4">
    <p style="font-size:13px;color:#8b3a2a;margin:0 0 16px">Client Kit</p>
    ${body}
  </div>
  </body></html>`;
}

export async function sendDocumentToClient(input: {
  to: string;
  clientName: string;
  workspaceName: string;
  title: string;
  publicId: string;
}): Promise<void> {
  const link = `${appUrl()}/s/${input.publicId}`;
  await send(
    input.to,
    `${input.workspaceName} sent you “${input.title}”`,
    wrap(`
      <p>Hi ${escapeHtml(input.clientName)},</p>
      <p>${escapeHtml(input.workspaceName)} sent you a proposal to review, sign, and pay.</p>
      <p><a href="${link}" style="display:inline-block;background:#8b3a2a;color:#fff;padding:12px 18px;text-decoration:none">Open document</a></p>
      <p style="font-size:13px;color:#5c574e">If the button does not work: ${link}</p>
    `),
  );
}

export async function sendViewedToFreelancer(input: {
  to: string;
  clientName: string;
  title: string;
}): Promise<void> {
  await send(
    input.to,
    `${input.clientName} viewed “${input.title}”`,
    wrap(`<p>${escapeHtml(input.clientName)} opened <strong>${escapeHtml(input.title)}</strong>.</p>`),
  );
}

export async function sendSignedToFreelancer(input: {
  to: string;
  clientName: string;
  title: string;
  amountDue: number;
  currency: string;
}): Promise<void> {
  await send(
    input.to,
    `${input.clientName} signed “${input.title}”`,
    wrap(`
      <p>${escapeHtml(input.clientName)} signed <strong>${escapeHtml(input.title)}</strong>.</p>
      <p>Amount due now: ${escapeHtml(formatMoney(input.amountDue, input.currency))}.</p>
      <p><a href="${appUrl()}/jobs">Open dashboard</a></p>
    `),
  );
}

export async function sendMarkedPaidToFreelancer(input: {
  to: string;
  clientName: string;
  title: string;
  amount: number;
  currency: string;
}): Promise<void> {
  await send(
    input.to,
    `${input.clientName} — signed + ${formatMoney(input.amount, input.currency)} received`,
    wrap(`
      <p><strong>${escapeHtml(input.clientName)}</strong> — signed + ${escapeHtml(formatMoney(input.amount, input.currency))} received.</p>
      <p>${escapeHtml(input.title)}</p>
    `),
  );
}

export async function sendSaasPaymentFailed(input: { to: string }): Promise<void> {
  await send(
    input.to,
    "Client Kit payment failed",
    wrap(`
      <p>We could not renew your Client Kit plan. You have 3 days of grace, then the workspace becomes read-only (you can view jobs, but you cannot send new documents).</p>
      <p><a href="${appUrl()}/settings/billing">Update billing</a></p>
    `),
  );
}

export async function sendNudgeToClient(input: {
  to: string;
  clientName: string;
  workspaceName: string;
  title: string;
  publicId: string;
  kind: "sign" | "pay";
}): Promise<void> {
  const link = `${appUrl()}/s/${input.publicId}`;
  const line =
    input.kind === "pay"
      ? "This is a reminder to pay the amount due on that same page."
      : "This is a reminder to review and sign on that same page.";
  await send(
    input.to,
    `Reminder from ${input.workspaceName}: “${input.title}”`,
    wrap(`
      <p>Hi ${escapeHtml(input.clientName)},</p>
      <p>${escapeHtml(input.workspaceName)} is waiting on “${escapeHtml(input.title)}”.</p>
      <p>${line}</p>
      <p><a href="${link}" style="display:inline-block;background:#8b3a2a;color:#fff;padding:12px 18px;text-decoration:none">Open document</a></p>
      <p style="font-size:13px;color:#5c574e">${link}</p>
    `),
  );
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
