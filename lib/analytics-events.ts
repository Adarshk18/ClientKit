/** Allowlisted client analytics event names. Unknown names are ignored by the API. */
export const ANALYTICS_EVENT_NAMES = [
  "page_view",
  "cta_click",
  "demo_open",
  "signup_start",
  "signup_complete",
  "checkout_start",
  "session_ping",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(value);
}
