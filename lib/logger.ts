const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export function redact(value: string): string {
  return value.replace(EMAIL, "[redacted-email]");
}

export function logError(scope: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[clientkit:${scope}]`, redact(message));
}
