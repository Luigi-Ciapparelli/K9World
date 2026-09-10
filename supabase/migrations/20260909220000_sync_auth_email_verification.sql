-- Supabase Auth is the source of truth for email verification.

create or replace function public.sync_auth_email_verification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set
    email = coalesce(new.email, ''),
    email_verified = (new.email_confirmed_at is not null),
    updated_at = now()
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists zzz_pawconnect_sync_auth_email_verification on auth.users;

create trigger zzz_pawconnect_sync_auth_email_verification
after insert or update of email, email_confirmed_at
on auth.users
for each row
execute function public.sync_auth_email_verification();

-- Backfill existing accounts.
update public.profiles p
set
  email = coalesce(u.email, ''),
  email_verified = (u.email_confirmed_at is not null),
  updated_at = now()
from auth.users u
where p.id = u.id;
