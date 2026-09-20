function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function requireEnv(name: string): string {
  const value = read(name);
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

export function appUrl(): string {
  return (read("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000").replace(/\/$/, "");
}

export function supabaseUrl(): string {
  return requireEnv("SUPABASE_URL");
}

export function supabaseAnonKey(): string {
  return requireEnv("SUPABASE_ANON_KEY");
}

export function supabaseServiceRoleKey(): string {
  return requireEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export type DodoEnvironment = "test_mode" | "live_mode";

export function dodoEnvironment(): DodoEnvironment {
  const value = read("DODO_PAYMENTS_ENVIRONMENT") ?? "test_mode";
  if (value !== "test_mode" && value !== "live_mode") {
    throw new Error("DODO_PAYMENTS_ENVIRONMENT must be test_mode or live_mode");
  }
  return value;
}

export function assertDodoKeyMatchesEnvironment(apiKey: string, environment: DodoEnvironment): void {
  const looksTest = /test/i.test(apiKey);
  const looksLive = /live/i.test(apiKey) && !looksTest;
  if (environment === "live_mode" && looksTest) {
    throw new Error(
      "Dodo live_mode is set but DODO_PAYMENTS_API_KEY looks like a test key. Refusing to start.",
    );
  }
  if (environment === "test_mode" && looksLive) {
    throw new Error(
      "Dodo test_mode is set but DODO_PAYMENTS_API_KEY looks like a live key. Refusing to start.",
    );
  }
}

export function resendFrom(): string {
  return read("RESEND_FROM") ?? "Client Kit <beth.t@example.com>";
}
