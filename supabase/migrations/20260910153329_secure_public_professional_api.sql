-- Safe public projection and search API for approved PawConnect professionals.
-- This migration intentionally does NOT revoke direct table access yet.
-- Frontend consumers must be migrated and tested first.

drop view if exists public.public_professional_profiles;

create view public.public_professional_profiles
with (security_barrier = true)
as
select
  p.id,
  coalesce(
    nullif(btrim(p.business_name), ''),
    nullif(btrim(pr.full_name), ''),
    'Professionista PawConnect'
  ) as display_name,
  pr.avatar_url,
  p.professional_type,
  p.bio,
  p.zone_text,
  p.coverage_radius_km,
  p.starting_price,
  p.cover_photo_url,
  p.rating,
  p.review_count
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
'Public whitelist projection for approved PawConnect professionals. Exact coordinates, contact details, VAT and admin fields are intentionally excluded.';


create or replace function public.search_public_professionals(
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
  distance_km numeric
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
        'Professionista PawConnect'
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
      p.review_count
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
          and coalesce(c.zone_text, '') ilike '%' || btrim(p_zone_text) || '%'
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
      else round(f.exact_distance_km)
    end as distance_km
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
from public;

revoke all
on function public.search_public_professionals(
  numeric,
  numeric,
  text,
  text,
  numeric,
  numeric
)
from anon, authenticated;

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
'Search approved professionals using exact coordinates only inside PostgreSQL. The API returns a whole-kilometre distance, not professional coordinates.';
