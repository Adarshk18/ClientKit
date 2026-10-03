import { describe, expect, it } from "vitest";
import { buildFollowUp, firstName, mailtoHref, whatsappHref, type FollowUpInput } from "@/lib/followups";

const base: FollowUpInput = {
  reason: "not_viewed",
  step: 1,
  clientName: "Priya Nair",
  freelancerName: "Studio North",
  title: "Acme site rebuild",
  link: "https://client-kit-omega.vercel.app/s/abc12345",
  amount: 3000000,
  currency: "INR",
  dueAt: "2026-10-05T00:00:00.000Z",
};

const reasons = ["not_viewed", "not_signed", "advance_unpaid", "payment_unpaid", "balance_overdue"] as const;

describe("follow-up messages", () => {
  it("never uses an em dash and always includes the link and sender", () => {
    for (const reason of reasons) {
      for (const step of [1, 2] as const) {
        const m = buildFollowUp({ ...base, reason, step });
        expect(m.text).not.toContain("\u2014");
        expect(m.subject).not.toContain("\u2014");
        expect(m.text).toContain(base.link);
        expect(m.text).toContain("Studio North");
        expect(m.text.startsWith("Hi Priya,")).toBe(true);
      }
    }
  });

  it("puts the amount in payment messages", () => {
    const m = buildFollowUp({ ...base, reason: "advance_unpaid" });
    expect(m.text).toContain("30,000");
  });

  it("is polite first and firmer second", () => {
    const one = buildFollowUp({ ...base, reason: "advance_unpaid", step: 1 });
    const two = buildFollowUp({ ...base, reason: "advance_unpaid", step: 2 });
    expect(one.text).toContain("Thanks for signing");
    expect(two.text).toContain("still open");
    expect(one.text).not.toBe(two.text);
  });

  it("mentions the due date for the balance and tolerates a missing one", () => {
    expect(buildFollowUp({ ...base, reason: "balance_overdue" }).text).toContain("5 Oct");
    expect(buildFollowUp({ ...base, reason: "balance_overdue", dueAt: null }).text).not.toContain("due on");
  });

  it("uses a safe first name", () => {
    expect(firstName("  Priya   Nair ")).toBe("Priya");
    expect(firstName("")).toBe("there");
  });

  it("builds wa.me and mailto links that only open a draft", () => {
    const m = buildFollowUp(base);
    const wa = whatsappHref(m.text);
    expect(wa.startsWith("https://wa.me/?text=")).toBe(true);
    expect(decodeURIComponent(wa.split("text=")[1]!)).toBe(m.text);
    const mail = mailtoHref("priya@acme.example", m.subject, m.body);
    expect(mail.startsWith("mailto:priya@acme.example?subject=")).toBe(true);
    expect(decodeURIComponent(mail.split("body=")[1]!)).toBe(m.body);
  });
});
