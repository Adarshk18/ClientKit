-- Client Kit schema, RLS, storage, and audit constraints.
-- Run this in the Supabase SQL editor (or `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  logo_url text,
  currency text not null default 'USD',
  country text not null default 'US',
  payout_type text check (payout_type is null or payout_type in ('upi', 'url')),
  payout_value text,
  plan text not null default 'free' check (plan in ('free', 'founder', 'solo', 'busy')),
  plan_status text not null default 'active'
    check (plan_status in ('active', 'past_due', 'canceled', 'read_only')),
  dodo_customer_id text,
  dodo_subscription_id text,
  docs_sent_this_period integer not null default 0,
  period_reset_at timestamptz not null default (timezone('utc', now()) + interval '30 days'),
  grace_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (owner_id)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null references public.clients (id),
  public_id text not null,
  title text not null,
  scope_html text not null default '',
  currency text not null default 'USD',
  subtotal integer not null default 0,
  deposit_percent integer not null default 100,
  deposit_amount integer not null default 0,
  amount_due integer not null default 0,
  remainder_amount integer not null default 0,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'signed', 'paid', 'expired', 'void')),
  expires_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  signed_at timestamptz,
  paid_at timestamptz,
  payment_marked_by uuid references auth.users (id),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'payment_sent', 'paid')),
  frozen_payload jsonb,
  frozen_hash text,
  deleted_at timestamptz,
  version integer not null default 1,
  supersedes_id uuid references public.documents (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists documents_public_id_key on public.documents (public_id);
create index if not exists documents_workspace_idx on public.documents (workspace_id, created_at desc);
create index if not exists documents_workspace_status_idx on public.documents (workspace_id, status)
  where deleted_at is null;
create index if not exists clients_workspace_idx on public.clients (workspace_id);

create table if not exists public.line_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  label text not null,
  qty numeric(12, 2) not null default 1,
  unit_amount integer not null,
  sort_order integer not null default 0
);

create index if not exists line_items_document_idx on public.line_items (document_id, sort_order);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  type text not null
    check (type in ('viewed', 'signed', 'paid', 'resent', 'voided', 'expired', 'payment_sent')),
  ip text,
  user_agent text,
  meta jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_document_idx on public.events (document_id, created_at);

create table if not exists public.signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete restrict,
  signer_name text not null,
  signer_email text not null,
  signed_at timestamptz not null default timezone('utc', now()),
  ip text,
  user_agent text,
  document_hash text not null
);

create unique index if not exists signatures_document_id_key on public.signatures (document_id);

create table if not exists public.pdfs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete restrict,
  storage_path text not null,
  hash text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists pdfs_document_id_key on public.pdfs (document_id);

create table if not exists public.processed_event_ids (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Immutable audit log
-- ---------------------------------------------------------------------------

create or replace function public.deny_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit rows are insert-only';
end;
$$;

drop trigger if exists events_no_update on public.events;
create trigger events_no_update
  before update on public.events
  for each row execute function public.deny_mutation();

drop trigger if exists events_no_delete on public.events;
create trigger events_no_delete
  before delete on public.events
  for each row execute function public.deny_mutation();

drop trigger if exists signatures_no_update on public.signatures;
create trigger signatures_no_update
  before update on public.signatures
  for each row execute function public.deny_mutation();

drop trigger if exists signatures_no_delete on public.signatures;
create trigger signatures_no_delete
  before delete on public.signatures
  for each row execute function public.deny_mutation();

-- ---------------------------------------------------------------------------
-- Freeze signed / paid documents
-- ---------------------------------------------------------------------------

create or replace function public.protect_signed_document()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('signed', 'paid') and new.deleted_at is not null then
    raise exception 'Cannot delete a signed or paid document';
  end if;

  if old.status in ('signed', 'paid') then
    if new.scope_html is distinct from old.scope_html
       or new.title is distinct from old.title
       or new.subtotal is distinct from old.subtotal
       or new.deposit_amount is distinct from old.deposit_amount
       or new.frozen_hash is distinct from old.frozen_hash
       or new.frozen_payload is distinct from old.frozen_payload
       or new.currency is distinct from old.currency then
      raise exception 'Cannot edit a signed document';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists documents_protect_signed on public.documents;
create trigger documents_protect_signed
  before update on public.documents
  for each row execute function public.protect_signed_document();

create or replace function public.protect_signed_line_items()
returns trigger
language plpgsql
as $$
declare
  st text;
  doc_id uuid;
begin
  doc_id := coalesce(new.document_id, old.document_id);
  select status into st from public.documents where id = doc_id;
  if st in ('signed', 'paid') then
    raise exception 'Cannot change line items on a signed document';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists line_items_protect_signed on public.line_items;
create trigger line_items_protect_signed
  before insert or update or delete on public.line_items
  for each row execute function public.protect_signed_line_items();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.clients enable row level security;
alter table public.documents enable row level security;
alter table public.line_items enable row level security;
alter table public.events enable row level security;
alter table public.signatures enable row level security;
alter table public.pdfs enable row level security;
alter table public.processed_event_ids enable row level security;
alter table public.rate_limits enable row level security;

-- Anon has no table grants. Public /s/[id] uses the service role and a
-- single-row lookup by public_id. That prevents list leaks.

create policy "owners manage own workspace"
  on public.workspaces
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "owners manage clients"
  on public.clients
  for all
  to authenticated
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "owners select documents"
  on public.documents
  for select
  to authenticated
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "owners insert documents"
  on public.documents
  for insert
  to authenticated
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

create policy "owners update documents"
  on public.documents
  for update
  to authenticated
  using (workspace_id in (select id from public.workspaces where owner_id = auth.uid()))
  with check (workspace_id in (select id from public.workspaces where owner_id = auth.uid()));

-- No delete policy: drafts are soft-deleted. Signed rows cannot be removed.

create policy "owners manage line items"
  on public.line_items
  for all
  to authenticated
  using (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  )
  with check (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  );

create policy "owners select events"
  on public.events
  for select
  to authenticated
  using (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  );

create policy "owners insert events"
  on public.events
  for insert
  to authenticated
  with check (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  );

create policy "owners select signatures"
  on public.signatures
  for select
  to authenticated
  using (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  );

create policy "owners select pdfs"
  on public.pdfs
  for select
  to authenticated
  using (
    document_id in (
      select id from public.documents
      where workspace_id in (select id from public.workspaces where owner_id = auth.uid())
    )
  );

-- processed_event_ids and rate_limits: service role only (bypasses RLS).
-- No policies for authenticated/anon.

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('logos', 'logos', false), ('pdfs', 'pdfs', false)
on conflict (id) do nothing;

create policy "owners upload logos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners update logos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners read logos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- PDFs are written with the service role after sign. Members read via
-- workspace folder prefix {workspace_id}/...
create policy "owners read pdfs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'pdfs'
    and (storage.foldername(name))[1] in (
      select id::text from public.workspaces where owner_id = auth.uid()
    )
  );
