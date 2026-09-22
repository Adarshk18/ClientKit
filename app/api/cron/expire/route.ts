import { NextResponse } from "next/server";
import { expireOverdueDocuments } from "@/lib/expire";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireOverdueDocuments();
    return NextResponse.json({ expired });
  } catch (error) {
    logError("cron.expire", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
