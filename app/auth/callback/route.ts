import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/jobs";

  if (code) {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logError("auth.callback", error);
      return NextResponse.redirect(new URL("/login?error=callback", url.origin));
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: existing } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (!existing) {
        const name =
          (typeof user.user_metadata?.workspace_name === "string" && user.user_metadata.workspace_name) ||
          (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
          user.email?.split("@")[0] ||
          "My workspace";
        await supabase.from("workspaces").insert({
          owner_id: user.id,
          name,
        });
      }
    }
  }

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/jobs";
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
