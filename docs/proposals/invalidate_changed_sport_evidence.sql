-- PROPOSAL ONLY: tested against reconstructed migrations; not a deployed migration.
BEGIN;
create or replace function public.protect_professional_credential_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_is_admin boolean := false;
begin
  if auth.uid() is not null then
    select exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
    into v_is_admin;
  end if;

  if not v_is_admin and auth.uid() = new.professional_id then
    if tg_op = 'INSERT' then
      if new.verification_status not in ('self_declared', 'pending') then
        new.verification_status := 'self_declared';
      end if;
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.verification_method := null;
      new.source_verified_at := null;
      new.source_checked_at := null;
      new.source_fingerprint := null;
      new.verification_note := null;
    else
      new.verification_status := old.verification_status;
      new.reviewed_at := old.reviewed_at;
      new.reviewed_by := old.reviewed_by;
      new.verification_method := old.verification_method;
      new.source_verified_at := old.source_verified_at;
      new.source_checked_at := old.source_checked_at;
      new.source_fingerprint := old.source_fingerprint;
      new.verification_note := old.verification_note;
    end if;
  end if;

  -- Every evidence change invalidates the previous attestation, including an
  -- administrator correction. Review the corrected fact in a separate operation.
  -- Visibility alone changes publication, not the evidence being attested.
  if tg_op = 'UPDATE' then
    if row(new.professional_id, new.credential_type, new.title, new.issuer_name,
           new.issued_at, new.discipline, new.achievement, new.description,
           new.external_url, new.document_path, new.dog_name, new.event_name,
           new.event_scope, new.placement, new.score_text, new.source_provider)
       is distinct from
       row(old.professional_id, old.credential_type, old.title, old.issuer_name,
           old.issued_at, old.discipline, old.achievement, old.description,
           old.external_url, old.document_path, old.dog_name, old.event_name,
           old.event_scope, old.placement, old.score_text, old.source_provider) then
      new.verification_status := 'pending';
      new.reviewed_at := null;
      new.reviewed_by := null;
      new.verification_method := null;
      new.source_verified_at := null;
      new.source_checked_at := null;
      new.source_fingerprint := null;
      new.verification_note := 'Dati modificati: è necessaria una nuova verifica della fonte.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

revoke all
on function public.protect_professional_credential_verification()
from public, anon, authenticated;

drop trigger if exists protect_professional_credential_verification
on public.professional_credentials;

create trigger protect_professional_credential_verification
before insert or update
on public.professional_credentials
for each row
execute function public.protect_professional_credential_verification();

COMMIT;
