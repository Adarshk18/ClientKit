import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { effectivePlanStatus } from "@/lib/plans";
import type { WorkspaceRow } from "@/lib/types";

export async function requireUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function getWorkspaceForUser(userId: string): Promise<WorkspaceRow | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.from("workspaces").select("*").eq("owner_id", userId).maybeSingle();
  return (data as WorkspaceRow | null) ?? null;
}

export async function requireWorkspace() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error("Could not load workspace");
  }

  if (!data) {
    const name =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user.email?.split("@")[0] ||
      "My workspace";
    const { data: created, error: createError } = await supabase
      .from("workspaces")
      .insert({
        owner_id: user.id,
        name,
        currency: "USD",
        country: "US",
      })
      .select("*")
      .single();
    if (createError || !created) {
      throw new Error("Could not create workspace");
    }
    return { supabase, user, workspace: created as WorkspaceRow };
  }

  const workspace = data as WorkspaceRow;
  const status = effectivePlanStatus(workspace);
  if (status !== workspace.plan_status && status === "read_only") {
    const admin = createSupabaseAdmin();
    await admin.from("workspaces").update({ plan_status: "read_only" }).eq("id", workspace.id);
    workspace.plan_status = "read_only";
  }

  return { supabase, user, workspace };
}
