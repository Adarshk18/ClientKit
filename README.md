# Client Kit

**Proposal. Sign. Get paid.**

Client Kit is one public link that does three things in order:

1. You write a short proposal (scope, price, timeline, line items).
2. The client signs on the same page.
3. The client pays the deposit or the full amount — **to you**, not to us.

The dashboard aha is: **Acme — signed + $600 received.**

This is not a CRM. There is no pipeline, calendar, Zoom, tasks, time tracking, client portal, AI writer, QuickBooks, team seats, or white-label.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage)
- Resend (transactional email)
- Dodo Payments (**SaaS billing only**)
- `@react-pdf/renderer` for the frozen signed PDF

Job money never hits the founder Dodo merchant account. Freelancers save one UPI VPA or a hosted payment URL they created themselves.

## Local setup

```bash
npm i
cp .env.example .env.local
# fill in the values, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 1. Supabase

1. Create a project.
2. Auth → enable Email and Google. Add redirect `{NEXT_PUBLIC_APP_URL}/auth/callback`.
3. SQL editor: paste `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_admin_analytics.sql` (required for `/admin` traffic metrics and `POST /api/analytics`).
4. Copy Project URL, anon key, and service role key into `.env.local`.
5. Set `ADMIN_EMAILS` to a comma-separated list of emails allowed to open `/admin` (unauthorized users get a 404). Those accounts, the demo workspace, and any browser that has opened `/admin` are excluded from the founder pulse.

### 2. Resend

Create an API key. In test mode, `RESEND_FROM` can stay `Client Kit <beth.t@example.com>`.

### 3. Dodo Payments (SaaS plans only)

Read these before you create products:

- https://docs.dodopayments.com
- https://docs.dodopayments.com/api-reference/checkout-sessions/create
- https://docs.dodopayments.com/developer-resources/subscription-integration-guide
- https://docs.dodopayments.com/developer-resources/webhooks
- https://docs.dodopayments.com/features/payment-methods/india

In the Dodo dashboard create three **subscription** products and paste the IDs:

| Env var | Plan | Suggested price |
| --- | --- | --- |
| `DODO_PRODUCT_FOUNDER` | Founder | $9/mo, 20 sent docs |
| `DODO_PRODUCT_SOLO` | Solo | $12/mo, 40 sent docs |
| `DODO_PRODUCT_BUSY` | Busy | $29/mo, unlimited |

Set `DODO_PAYMENTS_ENVIRONMENT=test_mode` with a **test** API key. Mixing test and live keys refuses to start.

Checkout sessions are created server-side (`checkoutSessions.create`) with `product_cart`, customer email/name, and `return_url`. Each attempt creates a **new** session (they expire ~24h and `checkout_url` is single-use).

India: when the workspace country is `IN`, checkout sends `billing_currency: INR` and `allowed_payment_method_types: ['upi_collect','credit','debit']`. Indian cards/UPI use RBI e-mandate; off-session renewals can take ~48h. Charges above ₹15,000 may need a fresh auth. Plan access is granted only from verified webhooks (`subscription.active`, `subscription.updated`, `payment.succeeded`, `payment.failed`) — **never** from the return URL query string.

### 4. Webhooks (required for billing)

Point Dodo at your app:

```
https://<your-host>/api/webhooks/dodo
```

Locally, tunnel to that path:

```bash
# Cloudflare
cloudflared tunnel --url http://localhost:3000
# or ngrok
ngrok http 3000
```

Paste the webhook signing secret into `DODO_PAYMENTS_WEBHOOK_KEY`. The route verifies the Standard Webhooks signature and is idempotent on `webhook-id` (`processed_event_ids`).

Subscribe at least: `subscription.active`, `subscription.updated`, `subscription.on_hold`, `subscription.failed`, `payment.succeeded`, `payment.failed`.

### 6. Seed a demo workspace

```bash
npm run seed
```

Logs in as `demo@clientkit.dev` / `demo-password-change-me` (override with `SEED_EMAIL` / `SEED_PASSWORD`). Public demo link: `/s/demo-acme`. The public demo rotates to a fresh unsigned copy after someone signs, so strangers always get the aha path.

## Tests

```bash
npm test
```

Covers money/deposit math, HTML sanitization, payload hashing, plan gates, IDOR workspace checks, and webhook signature rejection.

Playwright specs live in `tests/e2e`. They skip unless `E2E=1` (they need a running app + seeded Supabase).

## Library choices

- **Allowlist HTML sanitizer in-repo** (no sanitize-html). Vercel/Node ESM and that package do not mix.
- **In-Postgres rate limits** instead of Redis (one fewer vendor on Vercel).
- **UPI QR generated in the browser** from the VPA (`qrcode`) — no extra QR vendor.
- Job payouts are **not** Dodo Checkout on the founder account on purpose. Taking that money would make this a payments business.

## Deploy (Vercel)

Set the same env vars (including `ADMIN_EMAILS` for the founder `/admin` dashboard). Production cookies are `Secure` + `SameSite=Lax`. Ensure both SQL migrations have been run in the production Supabase project. Cron hits `/api/cron/expire` once a day (Hobby limit); set `CRON_SECRET` so Vercel sends `Authorization: Bearer <CRON_SECRET>`. The public page also expires overdue docs on read.
