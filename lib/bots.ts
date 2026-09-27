/**
 * Link preview fetchers and crawlers (WhatsApp, Slack, Googlebot, ...). Used so a preview
 * of a client link does not mark the job as viewed. Empty user agents are treated as people.
 * "(?<!cu)bot" skips Cubot phones, whose browser user agent contains "CUBOT".
 */
const BOT_PATTERN = /(?<!cu)bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|embedly/i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return BOT_PATTERN.test(userAgent);
}
