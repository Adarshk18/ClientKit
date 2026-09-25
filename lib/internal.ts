import { isAdminEmail } from "@/lib/admin-emails";

/** Set on the founder browser when they open /admin. Analytics drops these requests. */
export const INTERNAL_DEVICE_COOKIE = "ck_internal";

/** Ties a public demo visitor to the current /s/demo-acme document so a refresh after sign still shows Pay. */
export const DEMO_DOC_COOKIE = "ck_demo_doc";

export const DEMO_OWNER_EMAIL = "demo@clientkit.dev";

const DEMO_EMAIL_SUFFIX = "@clientkit.dev";

export function isInternalEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (isAdminEmail(e)) return true;
  if (e === DEMO_OWNER_EMAIL) return true;
  return e.endsWith(DEMO_EMAIL_SUFFIX);
}

export function hasInternalDeviceCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const escaped = INTERNAL_DEVICE_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|;\\s*)${escaped}=1(?:;|$)`).test(cookieHeader);
}

const DEMO_LOCKED = new Set(["signed", "payment_sent", "paid", "expired", "void"]);

/**
 * Rotate /s/demo-acme onto a fresh unsigned document when the current one is used up,
 * unless this visitor is the person who just signed it (cookie / keepDocumentId).
 */
export function shouldRotateDemoDocument(input: {
  status: string;
  documentId: string;
  keepDocumentId: string | null | undefined;
  signedAt?: string | null;
  now?: Date;
}): boolean {
  if (!DEMO_LOCKED.has(input.status)) return false;
  return input.keepDocumentId !== input.documentId;
}

export function founderIpsFromAnalytics(
  rows: Array<{ workspace_id: string | null; ip?: string | null }>,
  internalWorkspaceIds: Set<string>,
): Set<string> {
  const ips = new Set<string>();
  for (const row of rows) {
    if (!row.workspace_id || !internalWorkspaceIds.has(row.workspace_id)) continue;
    const ip = (row.ip ?? "").trim();
    if (!ip || ip === "0.0.0.0") continue;
    ips.add(ip);
  }
  return ips;
}

export function shouldExcludeAnalyticsEvent(
  row: { workspace_id: string | null; ip?: string | null },
  internalWorkspaceIds: Set<string>,
  founderIps: Set<string>,
): boolean {
  if (row.workspace_id && internalWorkspaceIds.has(row.workspace_id)) return true;
  const ip = (row.ip ?? "").trim();
  if (ip && founderIps.has(ip)) return true;
  return false;
}
