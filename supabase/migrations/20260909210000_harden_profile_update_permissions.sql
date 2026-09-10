-- Harden profile updates.
-- Authenticated users may edit only safe profile fields.
-- Sensitive fields such as role and verification flags are server-controlled.

revoke update on public.profiles from authenticated;

grant update (
  full_name,
  phone,
  avatar_url,
  location_text,
  latitude,
  longitude,
  updated_at
) on public.profiles to authenticated;

-- Changing the phone number invalidates the previous verification.

create or replace function public.reset_phone_verification_on_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified := false;
  end if;

  return new;
end;
$$;

drop trigger if exists reset_phone_verification_on_change on public.profiles;

create trigger reset_phone_verification_on_change
before update of phone on public.profiles
for each row
execute function public.reset_phone_verification_on_change();
