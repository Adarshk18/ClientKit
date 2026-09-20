import { toMinorUnits } from "@/lib/money";

export type JobTemplate = {
  slug: string;
  label: string;
  title: string;
  scope: string;
  deposit_percent: number;
  line_items: { label: string; qty: number; unit_amount: number }[];
};

export function jobTemplates(currency: string): JobTemplate[] {
  const u = (major: number) => toMinorUnits(major, currency);
  return [
    {
      slug: "website",
      label: "Website",
      title: "Website project",
      scope:
        "Design and build a marketing site. Two rounds of revision. You supply copy and logo. Handoff is a static export or CMS you can host.",
      deposit_percent: 50,
      line_items: [{ label: "Design + build", qty: 1, unit_amount: u(1200) }],
    },
    {
      slug: "photoshoot",
      label: "Photoshoot",
      title: "Photoshoot",
      scope:
        "One session, edited selects delivered digitally. Usage for web and social. Extra hours billed separately.",
      deposit_percent: 50,
      line_items: [{ label: "Session + edits", qty: 1, unit_amount: u(800) }],
    },
    {
      slug: "coaching",
      label: "Coaching month",
      title: "Coaching — one month",
      scope: "Four calls this month. Async notes between sessions. Cancel with 48 hours notice.",
      deposit_percent: 100,
      line_items: [{ label: "Month retainer", qty: 1, unit_amount: u(600) }],
    },
    {
      slug: "brand",
      label: "Brand kit",
      title: "Brand kit",
      scope: "Wordmark, color, type, and a one-page usage note. Two revision rounds.",
      deposit_percent: 50,
      line_items: [{ label: "Brand kit", qty: 1, unit_amount: u(1500) }],
    },
    {
      slug: "retainer",
      label: "Retainer",
      title: "Monthly retainer",
      scope: "Up to 10 hours this month. Unused hours do not roll. Extra hours at the listed rate.",
      deposit_percent: 100,
      line_items: [{ label: "Retainer", qty: 1, unit_amount: u(2000) }],
    },
  ];
}
