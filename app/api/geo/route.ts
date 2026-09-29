import { NextResponse } from "next/server";
import { getVisitorCountry } from "@/lib/visitor-country";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the browser which country the marketing pages should price for.
 * Uses the same lookup the pages used to run on the server (ck_country cookie, then CDN geo header, then US),
 * so the answer never differs from the old server-rendered one. Never cached: it depends on the caller.
 */
export async function GET() {
  const country = await getVisitorCountry();
  return NextResponse.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
