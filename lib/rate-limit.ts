import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const admin = createSupabaseAdmin();
  const windowStart = new Date(Math.floor(Date.now() / input.windowMs) * input.windowMs);

  const { data, error } = await admin
    .from("rate_limits")
    .upsert(
      { key: input.key, window_start: windowStart.toISOString(), count: 1 },
      { onConflict: "key,window_start", ignoreDuplicates: true },
    )
    .select("count")
    .maybeSingle();

  if (error && error.code !== "23505") {
    // Fail closed on unexpected errors.
    return { ok: false, retryAfterSec: Math.ceil(input.windowMs / 1000) };
  }

  if (!data) {
    const { data: existing, error: readError } = await admin
      .from("rate_limits")
      .select("count")
      .eq("key", input.key)
      .eq("window_start", windowStart.toISOString())
      .single();

    if (readError || !existing) {
      return { ok: false, retryAfterSec: Math.ceil(input.windowMs / 1000) };
    }

    if (existing.count >= input.limit) {
      return { ok: false, retryAfterSec: Math.ceil(input.windowMs / 1000) };
    }

    const { error: updateError } = await admin
      .from("rate_limits")
      .update({ count: existing.count + 1 })
      .eq("key", input.key)
      .eq("window_start", windowStart.toISOString())
      .eq("count", existing.count);

    if (updateError) {
      return { ok: false, retryAfterSec: Math.ceil(input.windowMs / 1000) };
    }
    return { ok: true };
  }

  return { ok: true };
}

export const VIEW_LIMIT = { limit: 60, windowMs: 60 * 60 * 1000 };
export const SIGN_LIMIT = { limit: 10, windowMs: 60 * 60 * 1000 };
export const ANALYTICS_LIMIT = { limit: 120, windowMs: 60 * 60 * 1000 };
