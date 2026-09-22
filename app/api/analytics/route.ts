import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { rateLimit, ANALYTICS_LIMIT } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/request";
import { isAnalyticsEventName } from "@/lib/analytics-events";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

type Body = {
  name?: unknown;
  path?: unknown;
  meta?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!isAnalyticsEventName(name)) {
    // Ignore unknown names quietly — do not teach scrapers the allowlist via errors.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const path =
    typeof body.path === "string" ? body.path.slice(0, 512) : null;
  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : null;

  const ip = clientIpFromHeaders(request.headers);
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 512);

  const limited = await rateLimit({
    key: `analytics:${ip}`,
    limit: ANALYTICS_LIMIT.limit,
    windowMs: ANALYTICS_LIMIT.windowMs,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin.from("analytics_events").insert({
      name,
      path,
      meta,
      ip,
      user_agent: userAgent,
    });
    if (error) {
      logError("analytics.insert", error);
      // Table may not exist yet if migration not applied — fail soft for clients.
      return NextResponse.json({ ok: false }, { status: 503 });
    }
  } catch (error) {
    logError("analytics.insert", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
