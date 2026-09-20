import { JobForm } from "@/components/job-form";
import { requireWorkspace } from "@/lib/auth";

export default async function NewJobPage() {
  const { workspace } = await requireWorkspace();
  return (
    <div className="max-w-2xl">
      <h1 className="font-serif text-3xl">New job</h1>
      <p className="mt-1 text-sm text-muted">Scope, price, timeline. Then one link for sign and pay.</p>
      <div className="mt-8">
        <JobForm mode="create" workspaceCurrency={workspace.currency} />
      </div>
    </div>
  );
}
