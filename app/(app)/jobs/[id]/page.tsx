import Link from "next/link";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { effectiveStatus } from "@/lib/document-state";
import { appUrl } from "@/lib/env";
import { JobActions } from "@/components/job-actions";
import { SharePanel } from "@/components/share-panel";
import { StatusChip } from "@/components/status-chip";
import { btnSecondary } from "@/lib/ui";
import { sanitizeScopeHtml } from "@/lib/sanitize";
import type { DocStatus } from "@/lib/types";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, workspace } = await requireWorkspace();
  const { data: job } = await supabase
    .from("documents")
    .select("*, clients(name, email), line_items(*), signatures(*), events(*)")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!job) notFound();

  const status = effectiveStatus(job.status as DocStatus, job.expires_at);
  const client = Array.isArray(job.clients) ? job.clients[0] : job.clients;
  const items = (job.line_items ?? []).slice().sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  const events = (job.events ?? []).slice().sort((a: { created_at: string }, b: { created_at: string }) =>
    a.created_at < b.created_at ? 1 : -1,
  );
  const publicLink = `${appUrl()}/s/${job.public_id}`;

  const aha =
    status === "paid"
      ? `${client?.name ?? "Client"} — signed + ${formatMoney(job.amount_due, job.currency)} received.`
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl">{job.title}</h1>
          <p className="mt-2 text-muted">
            {aha ?? `${client?.name} · ${client?.email}`}
          </p>
        </div>
        <StatusChip status={status} />
      </div>

      <JobActions documentId={job.id} status={status} publicId={job.public_id} />

      {status !== "draft" && status !== "void" ? (
        <SharePanel
          publicId={job.public_id}
          clientName={client?.name ?? "there"}
          title={job.title}
          workspaceName={workspace.name}
        />
      ) : null}

      {status !== "draft" ? (
        <p className="text-sm text-muted">
          Direct link:{" "}
          <a href={publicLink} className="text-ink underline decoration-line underline-offset-4" target="_blank" rel="noreferrer">
            {publicLink}
          </a>
        </p>
      ) : null}

      <div className="flex gap-3 text-sm">
        {(status === "draft" || status === "sent" || status === "viewed") && (
          <Link href={`/jobs/${job.id}/edit`} className={btnSecondary}>
            {status === "draft" ? "Edit" : "Edit as new version"}
          </Link>
        )}
      </div>

      <section className="border border-line bg-cream p-5">
        <h2 className="font-serif text-lg">Scope</h2>
        <div
          className="prose mt-3 max-w-none text-sm"
          dangerouslySetInnerHTML={{ __html: sanitizeScopeHtml(job.scope_html || "<p>No scope written.</p>") }}
        />
        <ul className="mt-6 divide-y divide-line text-sm">
          {items.map((item: { id: string; label: string; qty: number; unit_amount: number }) => (
            <li key={item.id} className="flex justify-between py-2">
              <span>
                {item.label} × {item.qty}
              </span>
              <span>{formatMoney(Math.round(Number(item.qty) * item.unit_amount), job.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between text-sm">
          <span>Due now</span>
          <span className="font-medium">{formatMoney(job.amount_due, job.currency)}</span>
        </div>
        {job.remainder_amount > 0 ? (
          <div className="mt-1 flex justify-between text-sm text-muted">
            <span>Due later</span>
            <span>{formatMoney(job.remainder_amount, job.currency)}</span>
          </div>
        ) : null}
      </section>

      <section>
        <h2 className="font-serif text-lg">Audit log</h2>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No events yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {events.map((event: { id: string; type: string; created_at: string; ip: string | null }) => (
              <li key={event.id} className="flex justify-between gap-4 border-b border-line py-2">
                <span className="capitalize">{event.type}</span>
                <span className="text-muted">
                  {formatDateTime(event.created_at)}
                  {event.ip ? ` · ${event.ip}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
