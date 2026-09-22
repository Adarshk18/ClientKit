-- Prevent void/status regressions on signed or paid documents.
-- Signed → paid is the only allowed status transition after sign.

create or replace function public.protect_signed_document()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('signed', 'paid') and new.deleted_at is not null then
    raise exception 'Cannot delete a signed or paid document';
  end if;

  if old.status in ('signed', 'paid') then
    if new.status is distinct from old.status
       and not (old.status = 'signed' and new.status = 'paid') then
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
