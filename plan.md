You are a senior full-stack engineer. Build Client Kit as a complete, production-ready web app. Do not stop at a demo. Handle edge cases, security, and failures.

Read docs before coding payments:
https://docs.dodopayments.com
https://docs.dodopayments.com/api-reference/checkout-sessions/create
https://docs.dodopayments.com/developer-resources/subscription-integration-guide
https://docs.dodopayments.com/developer-resources/webhooks
https://docs.dodopayments.com/features/payment-methods/india
SDK: npm i dodopayments
Optional: npx skills add dodopayments/skills

PRODUCT
Client Kit is NOT a CRM and NOT HoneyBook.
One link does three things in order:
1. Freelancer writes a short proposal (scope, price, timeline, line items).
2. Client signs on the same page.
3. Client pays the deposit or full amount.

Aha: freelancer dashboard shows "Acme — signed + $600 received."

Do NOT build: pipeline, calendar, Zoom, tasks, time tracking, client portal, AI writer, QuickBooks, team seats, white-label.

NAME
Product: Client Kit
Tagline: Proposal. Sign. Get paid.
Public URLs: /s/[publicId]
Never use HoneyBook branding, bee, purple clone, or the word HoneyBook in the UI.

STACK
- Next.js App Router + TypeScript + Tailwind
- Supabase: Postgres, Auth (email + Google), Storage for signed PDFs
- Resend for transactional email
- Dodo Payments for ALL money movement we control
- react-pdf or server PDF of the frozen signed page
- Deploy target: Vercel
- Env via .env.example only. Never commit secrets.

PAYMENTS — READ THIS BEFORE YOU WRITE CHECKOUT

The founder is in India. New Stripe accounts are not allowed. Use Dodo Payments.

There are TWO different payments. Do not mix them.

A) Client Kit SaaS billing (founder is merchant)
- Customer: the freelancer paying $12/mo (or founder $9 / busy $29)
- Create Dodo Products in dashboard (or seed script): founder_monthly, solo_monthly, busy_monthly
- Server-only: DodoPayments checkoutSessions.create with product_cart, customer email/name, return_url
- India: allow upi_collect, credit, debit; billing_currency INR when country is IN
- Subscriptions: use Dodo subscription products. Indian cards/UPI use RBI e-mandate. Off-session renewals can take ~48h. Charges above ₹15,000 may need fresh auth. Code for subscription.active, subscription.updated, payment.succeeded, payment.failed
- Verify webhooks with DODO_PAYMENTS_WEBHOOK_KEY / standardwebhooks. Reject unsigned bodies.
- Grant/revoke workspace plan only from verified webhooks, never from the return_url query string
- Checkout sessions expire (~24h) and checkout_url is single-use. Create a new session every attempt
- Test mode: environment test_mode, https://test.checkout.dodopayments.com
- Live: live_mode, keys only on server

B) Job payment (client pays the FREELANCER)
Client Kit must NOT collect the client's project money into the founder's Dodo balance. That would make us a payments business.

V1 implementation:
- In workspace settings the freelancer saves ONE payout method:
  - UPI VPA (e.g. name@okaxis)
  - or a hosted payment URL they created themselves (Razorpay Payment Link, PayPal.me, Dodo payment link on THEIR account)
- After the client signs, show Pay on the same page.
- If UPI: show VPA + copy + optional QR (client-side generated from the VPA, no extra vendor required)
- If URL: redirect to that URL in a new tab and mark job as "payment_sent"
- Freelancer can click "Mark paid" when they see the money. Store who marked it and when.
- Optional later: if freelancer pastes a Dodo payment_id we can verify via Dodo API. Not required for v1.

Never: take a cut of job payments, hold escrow, or create job checkouts on the founder merchant account.

AUTH AND TENANCY
- Every query scoped by workspace_id
- RLS policies on all tables
- Public /s/[id] is the only unauthenticated document route. It can read only that document if status is sent|viewed|signed|paid and not expired. No list endpoints public.
- Rate limit public views and sign posts (IP + document id)
- CSRF on cookie auth; SameSite; secure cookies in prod

DATA MODEL (create migrations)
users (supabase auth)
workspaces: id, owner_id, name, logo_url, currency (default USD), country, payout_type (upi|url), payout_value, plan (free|founder|solo|busy), plan_status, dodo_customer_id, dodo_subscription_id, docs_sent_this_period, period_reset_at
clients: workspace_id, name, email
documents: workspace_id, client_id, public_id (nanoid, unguessable), title, scope_html (sanitized), currency, subtotal, deposit_percent, deposit_amount, amount_due, status (draft|sent|viewed|signed|paid|expired|void), expires_at, sent_at, viewed_at, signed_at, paid_at, payment_marked_by
line_items: document_id, label, qty, unit_amount
events: document_id, type (viewed|signed|paid|resent|voided|expired), ip, user_agent, meta jsonb
signatures: document_id, signer_name, signer_email, signed_at, ip, user_agent, document_hash (sha256 of frozen payload)
pdfs: document_id, storage_path, hash

INDEX public_id unique. Soft-delete documents, do not hard-delete signed ones.

SIGNING (simple e-sign, not Aadhaar / not eIDAS qualified)
- Client types legal name, checks "I agree", submits
- Server re-loads document, rejects if expired, void, already signed, or hash changed
- Freeze payload, hash it, store signature row, generate PDF, lock edits
- Footer on client page and PDF: "Simple electronic signature. Not a digital signature certificate."
- Audit log is immutable (insert only)

SECURITY AND HARDENING
- Sanitize scope HTML (allowlist tags). No script, iframe, on*
- Max body sizes. Max 20 line items. Max scope length.
- public_id must be high-entropy. No sequential ids in URLs
- Helmet-equivalent headers: CSP, HSTS, X-Frame-Options deny on app routes; allow embed only if we never need it
- Signed PDF download only for workspace members or the signer email link
- Webhook route: raw body, signature check, idempotent by event id (store processed_event_ids)
- Server actions / route handlers only for Dodo. Browser never sees DODO_PAYMENTS_API_KEY
- File uploads: logo only, type+size check, store privately
- No PII in client logs. Redact emails in error reports
- Session timeout. Logout everywhere.
- Block disposable emails optional, not blocking v1
- Dependabot-friendly lockfile. No eval. No dangerouslySetInnerHTML on unsanitized input
- OWASP: IDOR tests on every document route (user A cannot read user B)

EDGE CASES YOU MUST CODE
- Double submit sign: unique constraint, second request returns already signed
- Pay then browser back
- Expired document: show expired, no sign, no pay
- Freelancer edits after sent: creates a new version OR forces void+resent. Never change hash under a signature
- Client opens two tabs
- Webhook arrives before return_url
- Webhook retries: idempotent
- Dodo test vs live keys mixed: refuse to start if mismatch
- Plan limit: solo 40 sent docs / month. Block send with clear upgrade checkout
- Failed SaaS payment: grace 3 days, then read-only (can view, cannot send new)
- Logo missing: initials
- Currency display: store minor units integers, format with Intl
- Mobile sign on small screens
- Empty line items
- Deposit 0% = pay full. Deposit 100% = pay full. Deposit 50% = pay half, remainder shown as due later (no second collection in v1, just displayed)
- Timezones: store UTC, show local
- Resend email
- Void document
- Freelancer deletes draft only, not signed/paid

EMAILS (Resend)
- Sent to client (magic public link)
- Viewed (optional, throttle 1/hour)
- Signed (to freelancer)
- Marked paid (to freelancer)
- SaaS payment failed (to freelancer)

UI
- Marketing landing: one screen, 40-word pitch, demo screenshot placeholder, $12/mo, login
- App: list jobs, status chips, new job form, settings (brand, payout, billing)
- Client page: clean, mobile first, no app chrome
- Empty states and error states on every page
- Loading and disabled buttons on submit

QUALITY BAR
- TypeScript strict
- Zod on every input
- README: local setup, env vars, Dodo test mode, webhook via Stripe-like tunnel (Cloudflare tunnel or ngrok) to /api/webhooks/dodo
- seed.ts for one demo workspace
- Basic Playwright or API tests: sign happy path, expired, IDOR, webhook signature reject
- .env.example:
  NEXT_PUBLIC_APP_URL=
  SUPABASE_URL=
  SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  RESEND_API_KEY=
  DODO_PAYMENTS_API_KEY=
  DODO_PAYMENTS_WEBHOOK_KEY=
  DODO_PAYMENTS_ENVIRONMENT=test_mode
  DODO_PRODUCT_FOUNDER=
  DODO_PRODUCT_SOLO=
  DODO_PRODUCT_BUSY=

BUILD ORDER
1. Schema + RLS + auth
2. Document CRUD + public page + view event
3. Sign + hash + PDF + lock
4. Payout settings + mark paid
5. Emails
6. Dodo SaaS checkout + webhooks + plan gates
7. Marketing page
8. Tests + security pass
9. Stop. Do not add calendar or CRM.

If a library choice conflicts with the above, pick the boring option and note it in README. Ship a repo I can run locally with npm i && npm run dev after filling .env.