begin;

alter table public.professionals
  add column if not exists experience_start_year smallint,
  add column if not exists experience_verification_status text not null default 'not_requested',
  add column if not exists professional_verification_status text not null default 'not_requested';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'professionals_experience_start_year_check'
      and conrelid = 'public.professionals'::regclass
  ) then
    alter table public.professionals
      add constraint professionals_experience_start_year_check
      check (
        experience_start_year is null
        or experience_start_year between 1950 and 2100
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'professionals_experience_verification_status_check'
      and conrelid = 'public.professionals'::regclass
  ) then
    alter table public.professionals
      add constraint professionals_experience_verification_status_check
      check (
        experience_verification_status in (
          'not_requested',
          'pending',
          'needs_more_info',
          'verified',
          'rejected',
          'revoked'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'professionals_professional_verification_status_check'
      and conrelid = 'public.professionals'::regclass
  ) then
    alter table public.professionals
      add constraint professionals_professional_verification_status_check
      check (
        professional_verification_status in (
          'not_requested',
          'pending',
          'needs_more_info',
          'verified',
          'rejected',
          'revoked'
        )
      );
  end if;
end
$$;

-- Backfill the new source-of-truth only when the legacy years_experience
-- column actually exists. New code stops treating that rolling number as canonical.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'professionals'
      and column_name = 'years_experience'
  ) then
    execute $sql$
      update public.professionals
      set experience_start_year =
        extract(year from current_date)::integer - years_experience::integer
      where experience_start_year is null
        and years_experience is not null
        and years_experience > 0
        and years_experience <= 70
    $sql$;
  end if;
end
$$;

-- Professionals can declare when they started. Verification outcomes remain
-- controlled fields: a direct self-write cannot mark them as verified.
create or replace function public.protect_professional_verification_fields()
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

  if auth.uid() = new.id and not v_is_admin then
    if tg_op = 'INSERT' then
      new.experience_verification_status := 'not_requested';
      new.professional_verification_status := 'not_requested';
    else
      new.experience_verification_status := old.experience_verification_status;
      new.professional_verification_status := old.professional_verification_status;
    end if;
  end if;

  return new;
end;
$function$;

revoke all
on function public.protect_professional_verification_fields()
from public, anon, authenticated;

drop trigger if exists protect_professional_verification_fields
on public.professionals;

create trigger protect_professional_verification_fields
before insert or update
on public.professionals
for each row
execute function public.protect_professional_verification_fields();

-- Extend the existing public projection without exposing private account/admin data.
create or replace view public.public_professional_profiles
with (security_barrier = true)
as
select
  p.id,
  coalesce(
    nullif(btrim(p.business_name), ''),
    nullif(btrim(pr.full_name), ''),
    'Professionista PortaleCinofilo'
  ) as display_name,
  pr.avatar_url,
  p.professional_type,
  p.bio,
  p.zone_text,
  p.coverage_radius_km,
  p.starting_price,
  p.cover_photo_url,
  p.rating,
  p.review_count,
  p.experience_start_year::integer as experience_start_year,
  (p.experience_verification_status = 'verified') as experience_verified,
  (p.professional_verification_status = 'verified') as professional_verified
from public.professionals p
join public.profiles pr
  on pr.id = p.id
where p.approved = true
  and p.approval_status = 'approved';

revoke all on public.public_professional_profiles from public;
revoke all on public.public_professional_profiles from anon;
revoke all on public.public_professional_profiles from authenticated;

grant select
on public.public_professional_profiles
to anon, authenticated;

comment on view public.public_professional_profiles is
'Public whitelist projection for approved PortaleCinofilo professionals. Verification booleans expose only reviewed outcomes, never private evidence.';

-- Replace the public search RPC with the same privacy model plus real experience data.
drop function if exists public.search_public_professionals(
  numeric,
  numeric,
  text,
  text,
  numeric,
  numeric
);

create function public.search_public_professionals(
  p_lat numeric default null,
  p_lng numeric default null,
  p_zone_text text default null,
  p_service_type text default null,
  p_max_price numeric default null,
  p_min_rating numeric default null
)
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  professional_type text,
  bio text,
  zone_text text,
  coverage_radius_km numeric,
  starting_price numeric,
  cover_photo_url text,
  rating numeric,
  review_count integer,
  distance_km numeric,
  matching_services jsonb,
  entity_kind text,
  experience_start_year integer,
  experience_verified boolean,
  professional_verified boolean,
  credentials_count integer,
  specialties text[]
)
language sql
stable
security definer
set search_path = ''
as $function$
  with candidates as (
    select
      p.id,
      coalesce(
        nullif(btrim(p.business_name), ''),
        nullif(btrim(pr.full_name), ''),
        'Professionista PortaleCinofilo'
      ) as display_name,
      pr.avatar_url,
      p.professional_type,
      p.bio,
      p.zone_text,
      p.coverage_radius_km,
      min(s.price) as starting_price,
      p.cover_photo_url,
      p.rating,
      p.review_count,
      p.experience_start_year::integer as experience_start_year,
      (p.experience_verification_status = 'verified') as experience_verified,
      (p.professional_verification_status = 'verified') as professional_verified,

      jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'professional_id', s.professional_id,
          'service_type', s.service_type,
          'name', s.name,
          'description', s.description,
          'price', s.price,
          'duration_kind', s.duration_kind,
          'duration_minutes', s.duration_minutes,
          'active', s.active
        )
        order by s.price asc, s.name asc, s.id asc
      ) as matching_services,

      case
        when p_lat is null
          or p_lng is null
          or p_lat < -90
          or p_lat > 90
          or p_lng < -180
          or p_lng > 180
          or p.latitude is null
          or p.longitude is null
          or p.latitude < -90
          or p.latitude > 90
          or p.longitude < -180
          or p.longitude > 180
          or (p.latitude = 0 and p.longitude = 0)
        then null
        else (
          6371.0 * 2.0 * asin(
            sqrt(
              least(
                1.0,
                power(
                  sin(
                    radians(
                      (p.latitude::double precision - p_lat::double precision) / 2.0
                    )
                  ),
                  2
                )
                +
                cos(radians(p_lat::double precision))
                * cos(radians(p.latitude::double precision))
                * power(
                    sin(
                      radians(
                        (p.longitude::double precision - p_lng::double precision) / 2.0
                      )
                    ),
                    2
                  )
              )
            )
          )
        )::numeric
      end as exact_distance_km

    from public.professionals p
    join public.profiles pr
      on pr.id = p.id
    join public.services s
      on s.professional_id = p.id
     and s.active = true

    where p.approved = true
      and p.approval_status = 'approved'
      and (
        p_service_type is null
        or s.service_type = p_service_type
      )
      and (
        p_min_rating is null
        or coalesce(p.rating, 0) >= p_min_rating
      )

    group by
      p.id,
      p.business_name,
      pr.full_name,
      pr.avatar_url,
      p.professional_type,
      p.bio,
      p.zone_text,
      p.latitude,
      p.longitude,
      p.coverage_radius_km,
      p.cover_photo_url,
      p.rating,
      p.review_count,
      p.experience_start_year,
      p.experience_verification_status,
      p.professional_verification_status
  ),

  filtered as (
    select c.*
    from candidates c
    where
      (
        p_max_price is null
        or c.starting_price <= p_max_price
      )
      and (
        (
          p_lat is null
          and p_lng is null
          and nullif(btrim(p_zone_text), '') is null
        )
        or (
          nullif(btrim(p_zone_text), '') is not null
          and position(
            lower(btrim(p_zone_text))
            in lower(coalesce(c.zone_text, ''))
          ) > 0
        )
        or (
          p_lat is not null
          and p_lng is not null
          and c.exact_distance_km is not null
          and c.exact_distance_km <= coalesce(nullif(c.coverage_radius_km, 0), 30)
        )
      )
  )

  select
    f.id,
    f.display_name,
    f.avatar_url,
    f.professional_type,
    f.bio,
    f.zone_text,
    f.coverage_radius_km,
    f.starting_price,
    f.cover_photo_url,
    f.rating,
    f.review_count,

    case
      when f.exact_distance_km is null then null
      when f.exact_distance_km = 0 then 0::numeric
      else (ceil(f.exact_distance_km / 5.0) * 5.0)::numeric
    end as distance_km,

    f.matching_services,
    'professional'::text as entity_kind,
    f.experience_start_year,
    f.experience_verified,
    f.professional_verified,
    0::integer as credentials_count,
    null::text[] as specialties

  from filtered f

  order by
    f.exact_distance_km asc nulls last,
    f.rating desc nulls last,
    f.display_name asc;
$function$;

revoke all
on function public.search_public_professionals(
  numeric,
  numeric,
  text,
  text,
  numeric,
  numeric
)
from public, anon, authenticated;

grant execute
on function public.search_public_professionals(
  numeric,
  numeric,
  text,
  text,
  numeric,
  numeric
)
to anon, authenticated;

comment on function public.search_public_professionals(
  numeric,
  numeric,
  text,
  text,
  numeric,
  numeric
) is
'Public PortaleCinofilo professional search. Returns self-declared start year and reviewed verification booleans while keeping exact coordinates and private evidence internal.';

commit;
