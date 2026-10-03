import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { advanceState, balanceOutstanding, type PaymentFields } from "@/lib/job-payments";
import { nudgeReasonLabel, type Nudge } from "@/lib/nudges";
import { btnPrimary } from "@/lib/ui";
import type { DocStatus } from "@/lib/types";

export type NudgeItem = {
  id: string;
  title: string;
  currency: string;
  publicId: string;
  status: DocStatus;
  clientName: string;
  clientEmail: string;
  viewedAt: string | null;
  signedAt: string | null;
  balanceDueAt: string | null;
  payment: PaymentFields;
  nudge: Nudge;
};

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm ${strong ? "font-medium" : ""}`}>{value}</dd>
    </div>
  );
}

function waiting(days: number): string {
  if (days <= 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}

export function NudgeList({ items }: { items: NudgeItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6" aria-labelledby="needs-nudge">
      <h2 id="needs-nudge" className="font-serif text-xl">
        Needs a nudge today
      </h2>
      <p className="mt-1 text-sm text-muted">
        These jobs are waiting on the client. Open one to see where it stands.
      </p>
      <ul className="mt-3 divide-y divide-line border border-line bg-cream" data-testid="nudge-list">
        {items.map((item) => {
          const advance = advanceState(item.payment);
          const balance = balanceOutstanding(item.payment);
          return (
            <li key={item.id} className="p-3 sm:p-4" data-testid="nudge-item">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <Link href={`/jobs/${item.id}`} className="min-w-0 break-words font-medium underline decoration-line underline-offset-4">
                  {item.clientName}
                  <span className="font-normal text-muted"> · {item.title}</span>
                </Link>
                <span className="text-[12px] text-stamp">
                  {nudgeReasonLabel(item.nudge.reason)}
                  {item.nudge.reason === "awaiting_confirmation" ? "" : ` · waiting ${waiting(item.nudge.daysWaiting)}`}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                <Fact label="Viewed" value={item.viewedAt ? "Yes" : "No"} />
                <Fact label="Signed" value={item.signedAt ? "Yes" : "No"} />
                <Fact label="Advance paid" value={advance === "none" ? "No advance" : advance === "yes" ? "Yes" : "No"} />
                <Fact label="Balance due" value={formatMoney(balance, item.currency)} strong />
              </dl>
              <div className="mt-3">
                <Link href={`/jobs/${item.id}`} className={btnPrimary}>
                  {item.nudge.reason === "awaiting_confirmation" ? "Check and confirm" : "Open job"}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
