import { NextResponse } from "next/server";
import { expireOverdueDocuments } from "@/lib/expire";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron");
  const ok = vercelCron === "1" || (secret && auth === `Bearer ${secret}`);
  if (!ok) {
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
