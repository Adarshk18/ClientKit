/** Reject open redirects / protocol-relative paths used as post-auth `next`. */
export function safeNextPath(next: string, fallback = "/jobs"): string {
  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.startsWith("/\\") ||
    next.includes("\\") ||
    next.includes("://")
  ) {
    return fallback;
  }
  return next;
}
