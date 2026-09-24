-- Elevate client payment claims to a first-class document status.
-- Allows signed → payment_sent → paid, and payment_sent → signed (reject).
-- Keeps content frozen once signed (including payment_sent and paid).

-- ---------------------------------------------------------------------------
-- Status enum: add payment_sent
-- ---------------------------------------------------------------------------

alter table public.documents
  drop constraint if exists documents_status_check;

alter table public.documents
  add constraint documents_status_check
  check (status in (
    'draft', 'sent', 'viewed', 'signed', 'payment_sent', 'paid', 'expired', 'void'
  ));

-- Optional claim fields (reference / note from the client)
alter table public.documents
  add column if not exists payment_claimed_at timestamptz;

alter table public.documents
  add column if not exists payment_reference text;

alter table public.documents
  add column if not exists payment_claim_note text;

-- Events: payment_rejected for freelancer "Not received"
alter table public.events
  drop constraint if exists events_type_check;

alter table public.events
  add constraint events_type_check
  check (type in (
    'viewed', 'signed', 'paid', 'resent', 'voided', 'expired',
    'payment_sent', 'payment_rejected'
  ));

-- ---------------------------------------------------------------------------
-- Protect signed / payment_sent / paid documents
-- ---------------------------------------------------------------------------

create or replace function public.protect_signed_document()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('signed', 'payment_sent', 'paid') and new.deleted_at is not null then
    raise exception 'Cannot delete a signed or paid document';
  end if;

  if old.status in ('signed', 'payment_sent', 'paid') then
    if new.status is distinct from old.status
       and not (
         (old.status = 'signed' and new.status in ('payment_sent', 'paid'))
         or (old.status = 'payment_sent' and new.status in ('paid', 'signed'))
       ) then
      raise exception 'Cannot change status of a signed document';
    end if;

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
  if st in ('signed', 'payment_sent', 'paid') then
    raise exception 'Cannot change line items on a signed document';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
