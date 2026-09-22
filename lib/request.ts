import { headers } from "next/headers";

export function clientIpFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  return (h.get("x-real-ip") ?? "0.0.0.0").slice(0, 64);
}

export async function requestMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  return {
    ip: clientIpFromHeaders(h),
    userAgent: (h.get("user-agent") ?? "").slice(0, 512),
  };
}

export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  const app = process.env.NEXT_PUBLIC_APP_URL;
  // When the app URL is configured, require a matching Origin (CSRF).
  if (!app) return;
  if (!origin) throw new Error("Invalid origin");
  try {
    const got = new URL(origin);
    const expected = new URL(app);
    const host = (value: string) => value.replace("127.0.0.1", "localhost");
    if (host(got.host) === host(expected.host)) return;
    // Vercel assigns both a default *.vercel.app host and an alias like *-omega.vercel.app
    if (got.hostname.endsWith(".vercel.app") && expected.hostname.endsWith(".vercel.app")) return;
  } catch {
    throw new Error("Invalid origin");
  }
  throw new Error("Invalid origin");
}
