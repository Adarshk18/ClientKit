-- Client Kit: follow-up tracking, advance/balance tracking, revision terms.
-- Additive only: new nullable columns (or columns with a safe default). No drops, no data changes.
-- Existing rows keep working exactly as before.

-- Follow-ups (item 1 and 4). Set only when the freelancer taps a follow-up button. Client Kit sends nothing.
alter table public.documents
  add column if not exists last_nudged_at timestamptz;

alter table public.documents
  add column if not exists nudge_count integer not null default 0;

-- Advance and balance (item 2). advance_paid_at is set when the freelancer confirms the advance.
-- It stays null on documents that pay in full on one payment. status keeps its existing meaning.
alter table public.documents
  add column if not exists advance_paid_at timestamptz;

-- Optional date the freelancer expects the balance by. Used only to decide when to suggest a follow-up.
alter table public.documents
  add column if not exists balance_due_at timestamptz;

-- Revision terms (item 3). Both null on documents that have no revision clause.
-- revision_extra_price is in minor units of the document currency (same as line_items.unit_amount).
alter table public.documents
  add column if not exists revisions_included smallint
    check (revisions_included is null or (revisions_included >= 0 and revisions_included <= 20));

alter table public.documents
  add column if not exists revision_extra_price integer
    check (revision_extra_price is null or revision_extra_price >= 0);

-- What the client agreed to at signing (advance, balance, revision terms). signatures rows are insert-only.
alter table public.signatures
  add column if not exists agreed_terms jsonb;
