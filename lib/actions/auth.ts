"use server";

import { redirect } from "next/navigation";
import { appUrl } from "@/lib/env";
import { logError } from "@/lib/logger";
import { createSupabaseServer } from "@/lib/supabase/server";
import { authSchema } from "@/lib/validators";

export async function signInAction(formData: FormData): Promise<void> {
  const parsed = authSchema.pick({ email: true, password: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    logError("auth.signIn", error);
    redirect("/login?error=credentials");
  }
  redirect("/jobs");
}

export async function signUpAction(formData: FormData): Promise<void> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    workspace_name: formData.get("workspace_name") || "My workspace",
  });
  if (!parsed.success) {
    redirect("/signup?error=invalid");
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { workspace_name: parsed.data.workspace_name, full_name: parsed.data.workspace_name },
      emailRedirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (error) {
    logError("auth.signUp", error);
    redirect("/signup?error=create");
  }

  if (data.user && data.session) {
    await supabase.from("workspaces").upsert(
      {
        owner_id: data.user.id,
        name: parsed.data.workspace_name ?? "My workspace",
      },
      { onConflict: "owner_id", ignoreDuplicates: true },
    );
    redirect("/jobs");
  }

  redirect("/login?check_email=1");
}

export async function signInWithGoogle(): Promise<void> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl()}/auth/callback`,
    },
  });
  if (error || !data.url) {
    logError("auth.google", error);
    redirect("/login?error=google");
  }
  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/");
}

export async function signOutEverywhereAction(): Promise<void> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) logError("auth.signOut", error);
  redirect("/");
}
