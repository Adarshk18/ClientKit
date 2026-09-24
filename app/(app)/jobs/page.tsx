import Link from "next/link";
import { requireWorkspace } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { effectiveStatus } from "@/lib/document-state";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { btnPrimary } from "@/lib/ui";
import type { DocStatus } from "@/lib/types";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const { supabase, workspace } = await requireWorkspace();
  const { data } = await supabase
    .from("documents")
    .select("*, clients(name, email)")
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const jobs = (data ?? []).filter((row) => {
    const status = effectiveStatus(row.status as DocStatus, row.expires_at);
    if (filter === "unpaid") {
      return (
        status === "signed" ||
        status === "payment_sent" ||
        status === "sent" ||
        status === "viewed"
      );
    }
    return true;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">Jobs</h1>
          <p className="mt-1 text-sm text-muted">Proposal. Sign. Get paid.</p>
        </div>
        <Link href="/jobs/new" className={btnPrimary}>
          New job
        </Link>
      </div>

      <div className="mt-6 flex gap-3 text-sm">
        <Link
          href="/jobs"
          className={`border-b pb-1 ${filter ? "border-transparent text-muted" : "border-ink text-ink"}`}
        >
          All
        </Link>
        <Link
          href="/jobs?filter=unpaid"
          className={`border-b pb-1 ${filter === "unpaid" ? "border-ink text-ink" : "border-transparent text-muted"}`}
        >
          Unpaid
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title={filter === "unpaid" ? "Nothing unpaid" : "No jobs yet"}
            body={
              filter === "unpaid"
                ? "Sent, viewed, and signed jobs that are still waiting on money will show up here."
                : "Write a short proposal, send one link, get a signature and a deposit."
            }
            action={
              <Link href="/jobs/new" className={btnPrimary}>
                Create a job
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-line border border-line bg-cream">
          {jobs.map((job) => {
            const status = effectiveStatus(job.status as DocStatus, job.expires_at);
            const client = Array.isArray(job.clients) ? job.clients[0] : job.clients;
            const aha =
              status === "paid"
                ? `${client?.name ?? "Client"} — signed + ${formatMoney(job.amount_due, job.currency)} received.`
                : status === "payment_sent"
                  ? `${client?.name ?? "Client"} — awaiting payment confirmation`
                  : null;
            return (
              <li key={job.id}>
                <Link href={`/jobs/${job.id}`} className="block min-h-11 px-3 py-4 hover:bg-white sm:px-4">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{job.title}</p>
                      <p className="text-sm text-muted">
                        {aha ?? `${client?.name ?? "Client"} · ${formatMoney(job.amount_due, job.currency)} due now`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip status={status} />
                      <span className="text-xs text-muted">{formatDateTime(job.updated_at)}</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
