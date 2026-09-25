import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { adminEmails, isAdminEmail } from "@/lib/admin-emails";

export { adminEmails, isAdminEmail };

/**
 * Gate /admin: logged-in user whose email is in ADMIN_EMAILS.
 * Unsigned visitors go to login. Signed-in non-admins get notFound()
 * so the route is not advertised.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  if (!isAdminEmail(user.email)) {
    notFound();
  }

  return {
    user,
    admin: createSupabaseAdmin(),
  };
}
