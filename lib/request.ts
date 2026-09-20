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
  if (!origin || !app) return;
  const expected = new URL(app).origin;
  const normalize = (value: string) => value.replace("127.0.0.1", "localhost");
  if (normalize(origin) !== normalize(expected)) {
    throw new Error("Invalid origin");
  }
}
