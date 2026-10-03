import { describe, expect, it } from "vitest";
import { DEFAULT_ADVANCE, advanceAmounts, generateAdvanceMessages, type AdvanceInput } from "@/lib/tools/advance-message";
import { DEFAULT_CLAUSE, generateClauses, type ClauseInput } from "@/lib/tools/clauses";
import { CTA, FOUNDER_LINE, TOOLS, CTA_FACTS } from "@/lib/tools/content";
import { exampleAmountFor, moneyText, mailtoLink, whatsappLink, daysPhrase, firstName } from "@/lib/tools/format";
import { DEFAULT_LADDER, SITUATIONS, generateLadder, suggestStartStep, type LadderInput } from "@/lib/tools/follow-up-ladder";
import { FOUNDER_CAP, PLAN_PRICES, SENT_LIMITS } from "@/lib/plans";
import { formatPlanPrice } from "@/lib/billing-regions";

const EM = "\u2014";
const BAD = /undefined|NaN|\[object|null/;
const LEGAL_THREAT = /legal action|lawyer|solicitor|court|sue |lawsuit|legal notice|late fee|interest|police/i;

describe("advanceAmounts", () => {
  it("works out percent, balance and rounding", () => {
    expect(advanceAmounts({ ...DEFAULT_ADVANCE, fee: 60000, advanceValue: 50 })).toMatchObject({ advance: 30000, balance: 30000, percent: 50 });
    expect(advanceAmounts({ ...DEFAULT_ADVANCE, fee: 1000.01, advanceValue: 30 }).advance).toBe(300);
    const r = advanceAmounts({ ...DEFAULT_ADVANCE, fee: 100, advanceValue: 33.33 });
    expect(r.advance + r.balance).toBeCloseTo(100, 5);
  });

  it("caps a fixed advance at the fee and flags it", () => {
    const r = advanceAmounts({ ...DEFAULT_ADVANCE, advanceType: "fixed", fee: 1000, advanceValue: 5000 });
    expect(r.advance).toBe(1000);
    expect(r.balance).toBe(0);
    expect(r.problems.join(" ")).toMatch(/more than the total/);
  });

  it("handles empty, zero, negative and NaN input without crashing", () => {
    for (const fee of [0, -5, Number.NaN]) {
      const r = advanceAmounts({ ...DEFAULT_ADVANCE, fee });
      expect(r.advance).toBe(0);
      expect(r.problems.length).toBeGreaterThan(0);
    }
    expect(advanceAmounts({ ...DEFAULT_ADVANCE, advanceValue: Number.NaN }).problems.length).toBeGreaterThan(0);
    expect(advanceAmounts({ ...DEFAULT_ADVANCE, advanceValue: 150 }).advance).toBe(60000);
  });
});

describe("advance messages", () => {
  const variants: Partial<AdvanceInput>[] = [
    {},
    { channel: "email", style: "indian" },
    { channel: "email", tone: "firm", firstProject: true, proformaLine: true, start: "on Monday 14 October" },
    { currency: "USD", fee: 1200.5, advanceType: "fixed", advanceValue: 400 },
    { howToPay: "", askUtr: false, mentionProposal: false },
    { fee: 0, clientName: "", yourName: "", project: "" },
    { advanceValue: 100 },
  ];

  it("gives gentle, standard and firm versions, with the chosen tone first", () => {
    expect(generateAdvanceMessages({ ...DEFAULT_ADVANCE, tone: "friendly" }).versions.map((v) => v.key)).toEqual(["gentle", "standard", "firm"]);
    expect(generateAdvanceMessages({ ...DEFAULT_ADVANCE, tone: "firm" }).versions[0]!.key).toBe("firm");
    expect(generateAdvanceMessages({ ...DEFAULT_ADVANCE, tone: "professional" }).versions[0]!.key).toBe("standard");
  });

  it("shows the real amounts in the default example", () => {
    const body = generateAdvanceMessages(DEFAULT_ADVANCE).versions[0]!.body;
    expect(body).toContain("₹30,000");
    expect(body).toContain("50%");
    expect(body).toContain("aarav@okaxis");
  });

  it("has no em dashes, legal threats, late fee demands or broken placeholders", () => {
    for (const v of variants) {
      const r = generateAdvanceMessages({ ...DEFAULT_ADVANCE, ...v });
      for (const ver of r.versions) {
        const text = `${ver.subject}\n${ver.body}`;
        expect(text, JSON.stringify(v)).not.toContain(EM);
        expect(text).not.toMatch(LEGAL_THREAT);
        expect(text).not.toMatch(BAD);
      }
    }
  });

  it("falls back to placeholders instead of printing zero or NaN", () => {
    const body = generateAdvanceMessages({ ...DEFAULT_ADVANCE, fee: 0, yourName: "" }).versions[0]!.body;
    expect(body).toContain("[advance]");
    expect(body).toContain("[your name]");
  });
});

describe("follow-up ladder", () => {
  it("has four steps for every situation, channel, relationship and action", () => {
    for (const s of SITUATIONS) {
      for (const channel of ["whatsapp", "email"] as const) {
        for (const relationship of ["new", "regular", "company"] as const) {
          for (const action of ["none", "close_file", "pause_work"] as const) {
            for (const deadline of ["", "Friday 11 October"]) {
              const input: LadderInput = { ...DEFAULT_LADDER, situation: s.value, channel, relationship, action, deadline };
              const { steps } = generateLadder(input);
              expect(steps).toHaveLength(4);
              for (const st of steps) {
                const text = `${st.subject}\n${st.body}`;
                expect(text).not.toContain(EM);
                expect(text).not.toMatch(LEGAL_THREAT);
                expect(text).not.toMatch(BAD);
                expect(st.body).toContain("Priya");
              }
            }
          }
        }
      }
    }
  });

  it("works with no invoice number and no amount", () => {
    const { steps } = generateLadder({ ...DEFAULT_LADDER, situation: "payment_overdue", reference: "", amount: 0 });
    expect(steps[0]!.body).toContain("[amount]");
    expect(steps[0]!.body).not.toContain("()");
  });

  it("only mentions pausing work when the freelancer chose it", () => {
    const none = generateLadder({ ...DEFAULT_LADDER, action: "none" }).steps.map((s) => s.body).join(" ");
    expect(none).not.toMatch(/pause/i);
    const paused = generateLadder({ ...DEFAULT_LADDER, action: "pause_work" }).steps.map((s) => s.body).join(" ");
    expect(paused).toMatch(/pause/i);
  });

  it("gets firmer step by step", () => {
    const { steps } = generateLadder({ ...DEFAULT_LADDER, situation: "advance_unpaid" });
    expect(steps.map((s) => s.label)).toEqual(["Polite nudge", "Friendly reminder", "Clear deadline", "Last message"]);
  });

  it("suggests where to start from the days since the last reply", () => {
    expect(suggestStartStep(2).step).toBe(1);
    expect(suggestStartStep(8).step).toBe(2);
    expect(suggestStartStep(30).step).toBe(3);
    expect(suggestStartStep(Number.NaN).step).toBe(1);
    expect(daysPhrase(8)).toBe("about a week");
  });
});

describe("clause maker", () => {
  const variants: Partial<ClauseInput>[] = [
    {},
    { strictness: "friendly" },
    { strictness: "strict", revisionRounds: 0 },
    { revisionRounds: 1, extraPricing: "hourly", extraAmount: 1500 },
    { extraPricing: "quote" },
    { advancePercent: 0 },
    { advancePercent: 100 },
    { currency: "USD", fee: 2400.5 },
    { latePayment: "none", refund: "non_refundable", taxesExtra: true },
    { refund: "refundable_before_start", validDays: 0 },
    { fee: 0, deliverables: "", outOfScope: "", notRevisions: "" },
    { revisionRounds: Number.NaN, feedbackDays: Number.NaN, validDays: Number.NaN },
  ];

  it("builds three numbered clauses and an all-in-one block", () => {
    const r = generateClauses(DEFAULT_CLAUSE);
    expect(r.clauses.map((c) => c.id)).toEqual(["scope", "revisions", "payment"]);
    expect(r.fullText).toContain("1. Scope of work");
    expect(r.fullText).toContain("2. Revisions");
    expect(r.fullText).toContain("3. Payment terms");
    expect(r.fullText).toContain("₹30,000");
    expect(r.problems).toEqual([]);
  });

  it("never prints em dashes or broken placeholders, and does not choose a late fee", () => {
    for (const v of variants) {
      const r = generateClauses({ ...DEFAULT_CLAUSE, ...v });
      expect(r.fullText, JSON.stringify(v)).not.toContain(EM);
      expect(r.fullText).not.toMatch(BAD);
      expect(r.fullText).not.toMatch(/late fee|interest/i);
    }
  });

  it("states the included rounds and the price of an extra round", () => {
    const text = generateClauses({ ...DEFAULT_CLAUSE, revisionRounds: 3, extraAmount: 2500 }).clauses[1]!.plain;
    expect(text).toContain("three (3) rounds");
    expect(text).toContain("₹2,500");
    const hourly = generateClauses({ ...DEFAULT_CLAUSE, extraPricing: "hourly", extraAmount: 800 }).clauses[1]!.plain;
    expect(hourly).toContain("per hour");
    const none = generateClauses({ ...DEFAULT_CLAUSE, revisionRounds: 0 }).clauses[1]!.plain;
    expect(none).toContain("No revision rounds are included");
  });

  it("handles a 0% and a 100% advance", () => {
    expect(generateClauses({ ...DEFAULT_CLAUSE, advancePercent: 0 }).clauses[2]!.plain).toContain("The full fee is due");
    expect(generateClauses({ ...DEFAULT_CLAUSE, advancePercent: 100 }).clauses[2]!.plain).toContain("due when you accept");
  });

  it("flags missing information", () => {
    const r = generateClauses({ ...DEFAULT_CLAUSE, fee: 0, deliverables: "" });
    expect(r.problems.length).toBe(2);
  });
});

describe("tool page content", () => {
  it("has titles under 60 and descriptions under 155 characters, with no em dashes", () => {
    expect(TOOLS).toHaveLength(3);
    for (const t of TOOLS) {
      expect(t.title.length, t.slug).toBeLessThan(60);
      expect(t.description.length, t.slug).toBeLessThan(155);
      const all = JSON.stringify(t) + JSON.stringify(CTA[t.slug]);
      expect(all).not.toContain(EM);
      expect(t.faqs).toHaveLength(6);
      expect(t.path).toBe(`/tools/${t.slug}`);
    }
  });

  it("quotes no search volumes", () => {
    for (const t of TOOLS) expect(JSON.stringify(t)).not.toMatch(/searches a month|monthly searches|search volume/i);
  });

  it("keeps the call to action facts tied to the real plan constants", () => {
    expect(CTA_FACTS).toContain(`${SENT_LIMITS.free} sends a month`);
    expect(CTA_FACTS).toContain("takes no cut");
    expect(CTA_FACTS).toContain("never expires");
    expect(FOUNDER_LINE).toContain(`$${PLAN_PRICES.founder.usd} a month`);
    expect(FOUNDER_LINE).toContain(`first ${FOUNDER_CAP} workspaces`);
    for (const t of TOOLS) {
      expect(CTA[t.slug].body).toContain(CTA_FACTS);
      expect(CTA[t.slug].small).not.toMatch(/sends reminders for you/i);
    }
  });
});

describe("format helpers", () => {
  it("formats money with Indian grouping and drops empty decimals", () => {
    expect(moneyText(120000, "INR")).toBe("₹1,20,000");
    expect(moneyText(1200.5, "USD")).toBe("$1,200.50");
    expect(moneyText(Number.NaN, "USD")).toBe("$0");
  });

  it("builds wa.me and mailto links that only open a prefilled message", () => {
    expect(whatsappLink("Hi & bye")).toBe("https://wa.me/?text=Hi%20%26%20bye");
    expect(mailtoLink("A b", "Line 1\nLine 2")).toBe("mailto:?subject=A%20b&body=Line%201%0ALine%202");
  });
});

describe("fixes after the live check", () => {
  it("keeps a title with the surname and never leaves a lone title", () => {
    expect(firstName("Mr. Rao")).toBe("Mr. Rao");
    expect(firstName("dr Rao")).toBe("Dr. Rao");
    expect(firstName("Mr.")).toBe("there");
    expect(firstName("  ")).toBe("there");
    expect(firstName("Ananya Rao")).toBe("Ananya");
    const body = generateAdvanceMessages({ ...DEFAULT_ADVANCE, channel: "email", style: "indian", clientName: "Mr. Rao" }).versions[0]!.body;
    expect(body).toContain("Dear Mr. Rao,");
    expect(generateAdvanceMessages({ ...DEFAULT_ADVANCE, channel: "email", style: "indian", clientName: "Mr." }).versions[0]!.body).not.toMatch(/Dear Mr\.,/);
  });

  it("gives step 3 a real deadline even when none is typed, and never a hard-coded date", () => {
    for (const s of SITUATIONS) {
      const steps = generateLadder({ ...DEFAULT_LADDER, situation: s.value, deadline: "" }).steps;
      const all = steps.map((x) => x.body).join("\n");
      expect(all, s.value).not.toMatch(/within the next few days/);
      expect(all).not.toMatch(/(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day \d/);
    }
    expect(generateLadder({ ...DEFAULT_LADDER, deadline: "" }).steps[2]!.body).toContain("by the end of this week");
    expect(generateLadder({ ...DEFAULT_LADDER, deadline: "Friday" }).steps[2]!.body).toContain("by Friday");
  });

  it("makes no unsourced claim about reply rates", () => {
    const tips = generateLadder(DEFAULT_LADDER).tips.join(" ");
    expect(tips).not.toMatch(/more often|percent|%/);
    expect(tips).toContain("easier to answer");
  });

  it("quotes the rupee Founder price from the pricing table, not from memory", () => {
    expect(FOUNDER_LINE).toContain(formatPlanPrice("founder", "IN"));
    expect(FOUNDER_LINE).toContain("priced in rupees in India");
    expect(FOUNDER_LINE).toContain(`first ${FOUNDER_CAP} workspaces`);
  });

  it("says accurately when Client Kit emails the client", () => {
    const all = JSON.stringify(CTA) + JSON.stringify(TOOLS) + generateLadder(DEFAULT_LADDER).tips.join(" ");
    expect(all).not.toMatch(/never sends/i);
    expect(CTA["client-follow-up-message-generator"].small).toContain("only emails your client when you click Nudge client");
  });
});

describe("exampleAmountFor", () => {
  it("keeps rupee amounts as they are", () => {
    expect(exampleAmountFor(60000, "INR")).toBe(60000);
  });
  it("turns the rupee example into a believable foreign amount", () => {
    expect(exampleAmountFor(60000, "USD")).toBe(700);
    expect(exampleAmountFor(30000, "USD")).toBe(350);
    expect(exampleAmountFor(60000, "GBP")).toBe(550);
  });
  it("never returns zero or NaN", () => {
    expect(exampleAmountFor(0, "USD")).toBe(0);
    expect(exampleAmountFor(Number.NaN, "USD")).toBeNaN();
    expect(exampleAmountFor(500, "USD")).toBeGreaterThan(0);
  });
});
