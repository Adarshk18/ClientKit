import Link from "next/link";
import { JobForm } from "@/components/job-form";
import { requireWorkspace } from "@/lib/auth";
import { jobTemplates } from "@/lib/job-templates";
import { fromMinorUnits } from "@/lib/money";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const { workspace } = await requireWorkspace();
  const templates = jobTemplates(workspace.currency);
  const picked = templates.find((item) => item.slug === template);

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">New job</h1>
      <p className="mt-1 text-sm text-muted">Start blank or from a common job. Then one link for sign and pay.</p>
      <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
        <Link href="/jobs/new" className={!picked ? "underline" : "text-muted"}>
          Blank
        </Link>
        {templates.map((item) => (
          <Link
            key={item.slug}
            href={`/jobs/new?template=${item.slug}`}
            className={picked?.slug === item.slug ? "underline" : "text-muted"}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="mt-8">
        <JobForm
          key={picked?.slug ?? "blank"}
          mode="create"
          workspaceCurrency={workspace.currency}
          defaultValues={
            picked
              ? {
                  client_name: "",
                  client_email: "",
                  title: picked.title,
                  scope_html: picked.scope,
                  currency: workspace.currency,
                  deposit_percent: picked.deposit_percent,
                  expires_at: "",
                  line_items: picked.line_items.map((line) => ({
                    label: line.label,
                    qty: line.qty,
                    unit_amount: line.unit_amount,
                  })),
                }
              : undefined
          }
        />
      </div>
      {picked ? (
        <p className="mt-4 text-[12px] text-muted">
          Starting numbers are examples ({fromMinorUnits(picked.line_items[0]?.unit_amount ?? 0, workspace.currency)}{" "}
          {workspace.currency}). Change them before you send.
        </p>
      ) : null}
    </div>
  );
}
