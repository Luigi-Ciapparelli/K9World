create or replace function public.set_pawconnect_signup_dog_birth_date()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  birth_text text;
begin
  if coalesce(new.raw_user_meta_data ->> 'pawconnect_onboarding_version', '') <> '1' then
    return new;
  end if;

  if coalesce(new.raw_user_meta_data ->> 'role', 'owner') <> 'owner' then
    return new;
  end if;

  birth_text := new.raw_user_meta_data ->> 'dog_birth_date';

  if birth_text is null or birth_text = '' then
    return new;
  end if;

  begin
    update public.dogs
    set birth_date = birth_text::date
    where owner_id = new.id;
  exception
    when others then
      -- Una data non valida non deve impedire la creazione dell'account.
      null;
  end;

  return new;
end;
$$;

drop trigger if exists zz_pawconnect_signup_dog_birth_date on auth.users;

create trigger zz_pawconnect_signup_dog_birth_date
after insert on auth.users
for each row
execute function public.set_pawconnect_signup_dog_birth_date();
