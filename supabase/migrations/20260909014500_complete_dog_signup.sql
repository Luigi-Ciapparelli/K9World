-- Complete first-dog creation during PawConnect signup.

create or replace function public.handle_pawconnect_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  signup_role text;
  pro_type text;
  dog_age_value integer := 0;
  dog_weight_value numeric := 0;
begin
  if coalesce(meta ->> 'pawconnect_onboarding_version', '') <> '1' then
    return new;
  end if;

  signup_role :=
    case meta ->> 'role'
      when 'professional' then 'professional'
      else 'owner'
    end;

  pro_type :=
    case meta ->> 'professional_type'
      when 'walker' then 'walker'
      when 'sitter' then 'sitter'
      when 'trainer' then 'trainer'
      when 'groomer' then 'groomer'
      when 'boarding' then 'boarding'
      else 'walker'
    end;

  insert into public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    email_verified,
    phone_verified
  )
  values (
    new.id,
    coalesce(meta ->> 'full_name', ''),
    coalesce(new.email, ''),
    coalesce(meta ->> 'phone', ''),
    signup_role,
    new.email_confirmed_at is not null,
    false
  )
  on conflict (id) do nothing;

  if signup_role = 'professional' then
    insert into public.professionals (
      id,
      professional_type,
      approved,
      approval_status
    )
    values (
      new.id,
      pro_type,
      false,
      'pending'
    )
    on conflict (id) do nothing;

  elsif coalesce(trim(meta ->> 'dog_name'), '') <> '' then

    if coalesce(meta ->> 'dog_age', '') ~ '^[0-9]+$' then
      dog_age_value := (meta ->> 'dog_age')::integer;
    end if;

    if coalesce(meta ->> 'dog_weight', '') ~ '^[0-9]+([.][0-9]+)?$' then
      dog_weight_value := (meta ->> 'dog_weight')::numeric;
    end if;

    insert into public.dogs (
      owner_id,
      name,
      breed,
      age,
      weight,
      photo_url,
      vaccinated,
      aggressive,
      medical_notes
    )
    values (
      new.id,
      trim(meta ->> 'dog_name'),
      coalesce(trim(meta ->> 'dog_breed'), ''),
      dog_age_value,
      dog_weight_value,
      '',
      coalesce(meta ->> 'dog_vaccinated', 'false') = 'true',
      coalesce(meta ->> 'dog_reactive', 'false') = 'true',
      coalesce(trim(meta ->> 'dog_notes'), '')
    );
  end if;

  return new;
end;
$$;
