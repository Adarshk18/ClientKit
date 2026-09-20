import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/auth";
import { JobForm } from "@/components/job-form";
import { ErrorState } from "@/components/empty-state";
import { htmlToPlainText } from "@/lib/sanitize";
import { toDatetimeLocal } from "@/lib/dates";
import type { DocStatus } from "@/lib/types";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, workspace } = await requireWorkspace();
  const { data: job } = await supabase
    .from("documents")
    .select("*, clients(name, email), line_items(*)")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!job) notFound();
  const status = job.status as DocStatus;
  if (status === "signed" || status === "paid") {
    return <ErrorState title="Locked" body="Signed documents cannot be edited. The hash is frozen." />;
  }
  if (status === "void" || status === "expired") {
    return <ErrorState title="Closed" body="Voided or expired jobs cannot be edited. Create a new job." />;
  }

  const client = Array.isArray(job.clients) ? job.clients[0] : job.clients;
  const items = (job.line_items ?? [])
    .slice()
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">
        {status === "draft" ? "Edit draft" : "New version"}
      </h1>
      {status !== "draft" ? (
        <p className="mt-2 text-sm text-muted">
          Saving will void the current public link and create a new draft. The old hash is never changed under a
          signature.
        </p>
      ) : null}
      <div className="mt-8">
        <JobForm
          mode={status === "draft" ? "draft" : "sent"}
          documentId={job.id}
          workspaceCurrency={workspace.currency}
          defaultValues={{
            client_name: client?.name ?? "",
            client_email: client?.email ?? "",
            title: job.title,
            scope_html: htmlToPlainText(job.scope_html),
            currency: job.currency,
            deposit_percent: job.deposit_percent,
            expires_at: toDatetimeLocal(job.expires_at),
            line_items: items.map((item: { label: string; qty: number; unit_amount: number }) => ({
              label: item.label,
              qty: Number(item.qty),
              unit_amount: item.unit_amount,
            })),
          }}
        />
      </div>
    </div>
  );
}
