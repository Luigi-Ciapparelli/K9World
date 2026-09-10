-- Extend the public professional search API with the active services
-- needed by SearchPage, while keeping account/contact/admin data private.
--
-- The previous function is not yet used by the frontend, so it is safe to
-- replace its return shape in this incremental migration.

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
  matching_services jsonb
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

    -- Keep exact coordinates inside PostgreSQL. Expose only a coarse
    -- distance value; exact_distance_km is still used for ordering/radius.
    case
      when f.exact_distance_km is null then null
      when f.exact_distance_km = 0 then 0::numeric
      else (ceil(f.exact_distance_km / 5.0) * 5.0)::numeric
    end as distance_km,

    f.matching_services

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
'Public PawConnect search API. Returns approved professionals and active matching services. Exact professional coordinates remain inside PostgreSQL; only a 5 km distance bucket is exposed.';
