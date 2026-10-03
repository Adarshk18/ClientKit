import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Tells the static marketing pages whether the visitor is signed in. Returns only a boolean, never user data,
 * and any failure answers signedIn: false so the page keeps its signed-out look.
 */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return NextResponse.json({ signedIn: Boolean(user) }, { headers });
  } catch {
    return NextResponse.json({ signedIn: false }, { headers });
  }
}
