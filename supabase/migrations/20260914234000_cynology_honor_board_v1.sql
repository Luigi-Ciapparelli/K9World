begin;

create or replace view public.public_professional_sport_merit
with (security_barrier = true)
as
with verified_sport as (
  select
    c.professional_id,
    lower(btrim(coalesce(c.discipline, ''))) as discipline_code,
    upper(regexp_replace(btrim(coalesce(c.achievement, '')), '\s+', '', 'g')) as level_code,
    nullif(btrim(c.dog_name), '') as dog_name,
    c.event_scope,
    c.placement,
    c.issued_at
  from public.professional_credentials c
  join public.professionals p
    on p.id = c.professional_id
  where c.verification_status = 'verified'
    and c.credential_type in ('official_test', 'sport_result')
    and c.is_public = true
    and p.approved = true
    and p.approval_status = 'approved'
),
aggregated as (
  select
    professional_id,

    max(
      case
        when discipline_code = 'igp' and level_code = 'IGP3' then 3
        when discipline_code = 'igp' and level_code = 'IGP2' then 2
        when discipline_code = 'igp' and level_code = 'IGP1' then 1
        else 0
      end
    )::integer as highest_igp_level,

    max(
      case
        when discipline_code = 'igp' then 30
        when discipline_code = 'obedience' then 20
        when discipline_code = 'agility' then 10
        else 5
      end
    )::integer as discipline_priority,

    count(*)::integer as verified_sport_results,

    count(distinct lower(dog_name))
      filter (where dog_name is not null)::integer as verified_sport_dogs,

    max(
      case event_scope
        when 'world' then 50
        when 'international' then 40
        when 'national' then 30
        when 'regional' then 20
        when 'club' then 10
        else 0
      end
    )::integer as best_scope_priority,

    min(placement)
      filter (where placement is not null)::integer as best_placement,

    max(issued_at) as latest_verified_sport_result

  from verified_sport
  group by professional_id
)
select
  professional_id,
  highest_igp_level,
  case highest_igp_level
    when 3 then 'gold'
    when 2 then 'silver'
    when 1 then 'bronze'
    else null
  end::text as honor_tier,
  discipline_priority,
  verified_sport_results,
  verified_sport_dogs,
  best_scope_priority,
  best_placement,
  latest_verified_sport_result
from aggregated;

revoke all
on public.public_professional_sport_merit
from public, anon, authenticated;

grant select
on public.public_professional_sport_merit
to anon, authenticated;

comment on view public.public_professional_sport_merit is
'Verified sport facts only. IGP3/2/1 map to Gold/Silver/Bronze. Replicability on different dogs outranks raw result count inside the same merit tier.';

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
  specialties text[],
  credential_highlights jsonb,
  honor_tier text,
  highest_igp_level integer,
  sport_discipline_priority integer,
  verified_sport_results integer,
  verified_sport_dogs integer,
  honor_out_of_area boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  with candidates as (
    select
      p.id,

      case
        when coalesce(p.listing_type, 'individual') = 'individual'
          then coalesce(
            nullif(btrim(pr.full_name), ''),
            nullif(btrim(p.business_name), ''),
            'Professionista PortaleCinofilo'
          )
        else coalesce(
          nullif(btrim(p.business_name), ''),
          nullif(btrim(pr.full_name), ''),
          'Professionista PortaleCinofilo'
        )
      end as display_name,

      pr.avatar_url,
      p.professional_type,
      p.bio,
      p.zone_text,
      p.coverage_radius_km,
      min(s.price) as starting_price,

      case
        when coalesce(p.listing_type, 'individual') = 'individual' then null
        else p.cover_photo_url
      end as cover_photo_url,

      p.rating,
      p.review_count,
      p.experience_start_year::integer as experience_start_year,
      (p.experience_verification_status = 'verified') as experience_verified,
      (p.professional_verification_status = 'verified') as professional_verified,

      (
        select count(*)::integer
        from public.professional_credentials vc
        where vc.professional_id = p.id
          and vc.is_public = true
          and vc.verification_status = 'verified'
      ) as credentials_count,

      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', h.id,
              'credential_type', h.credential_type,
              'title', h.title,
              'issuer_name', h.issuer_name,
              'discipline', h.discipline,
              'achievement', h.achievement,
              'external_url', h.external_url,
              'verification_status', h.verification_status,
              'verification_method', h.verification_method,
              'source_provider', h.source_provider,
              'dog_name', h.dog_name
            )
            order by h.rank_order, h.issued_at desc nulls last, h.created_at desc
          )
          from (
            select
              pc.id,
              pc.credential_type,
              pc.title,
              pc.issuer_name,
              pc.discipline,
              pc.achievement,
              pc.external_url,
              pc.verification_status,
              pc.verification_method,
              pc.source_provider,
              pc.dog_name,
              pc.issued_at,
              pc.created_at,
              case pc.verification_status
                when 'verified' then 0
                when 'pending' then 1
                else 2
              end as rank_order
            from public.professional_credentials pc
            where pc.professional_id = p.id
              and pc.is_public = true
              and pc.verification_status in ('self_declared', 'pending', 'verified')
            order by
              case pc.verification_status
                when 'verified' then 0
                when 'pending' then 1
                else 2
              end,
              pc.issued_at desc nulls last,
              pc.created_at desc
            limit 3
          ) h
        ),
        '[]'::jsonb
      ) as credential_highlights,

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

      m.honor_tier,
      coalesce(m.highest_igp_level, 0)::integer as highest_igp_level,
      coalesce(m.discipline_priority, 0)::integer as sport_discipline_priority,
      coalesce(m.verified_sport_results, 0)::integer as verified_sport_results,
      coalesce(m.verified_sport_dogs, 0)::integer as verified_sport_dogs,
      coalesce(m.best_scope_priority, 0)::integer as best_scope_priority,
      m.best_placement,

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
                  sin(radians((p.latitude::double precision - p_lat::double precision) / 2.0)),
                  2
                )
                +
                cos(radians(p_lat::double precision))
                * cos(radians(p.latitude::double precision))
                * power(
                  sin(radians((p.longitude::double precision - p_lng::double precision) / 2.0)),
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
    left join public.public_professional_sport_merit m
      on m.professional_id = p.id

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
      p.listing_type,
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
      p.professional_verification_status,
      m.honor_tier,
      m.highest_igp_level,
      m.discipline_priority,
      m.verified_sport_results,
      m.verified_sport_dogs,
      m.best_scope_priority,
      m.best_placement
  ),

  priced as (
    select c.*
    from candidates c
    where p_max_price is null
       or c.starting_price <= p_max_price
  ),

  location_marked as (
    select
      c.*,
      (
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
      ) as is_local_match
    from priced c
  ),

  local_rows as (
    select l.*, false as honor_out_of_area
    from location_marked l
    where l.is_local_match
  ),

  distant_sport_ranked as (
    select
      l.*,
      true as honor_out_of_area,
      row_number() over (
        order by
          l.highest_igp_level desc,
          l.sport_discipline_priority desc,
          l.verified_sport_dogs desc,
          l.verified_sport_results desc,
          l.best_scope_priority desc,
          l.best_placement asc nulls last,
          l.exact_distance_km asc nulls last,
          l.display_name asc
      ) as sport_row_number
    from location_marked l
    where not l.is_local_match
      and l.verified_sport_results > 0
  ),

  combined as (
    select
      l.id,
      l.display_name,
      l.avatar_url,
      l.professional_type,
      l.bio,
      l.zone_text,
      l.coverage_radius_km,
      l.starting_price,
      l.cover_photo_url,
      l.rating,
      l.review_count,
      l.exact_distance_km,
      l.matching_services,
      l.experience_start_year,
      l.experience_verified,
      l.professional_verified,
      l.credentials_count,
      l.credential_highlights,
      l.honor_tier,
      l.highest_igp_level,
      l.sport_discipline_priority,
      l.verified_sport_results,
      l.verified_sport_dogs,
      l.best_scope_priority,
      l.best_placement,
      l.honor_out_of_area
    from local_rows l

    union all

    select
      d.id,
      d.display_name,
      d.avatar_url,
      d.professional_type,
      d.bio,
      d.zone_text,
      d.coverage_radius_km,
      d.starting_price,
      d.cover_photo_url,
      d.rating,
      d.review_count,
      d.exact_distance_km,
      d.matching_services,
      d.experience_start_year,
      d.experience_verified,
      d.professional_verified,
      d.credentials_count,
      d.credential_highlights,
      d.honor_tier,
      d.highest_igp_level,
      d.sport_discipline_priority,
      d.verified_sport_results,
      d.verified_sport_dogs,
      d.best_scope_priority,
      d.best_placement,
      d.honor_out_of_area
    from distant_sport_ranked d
    where d.sport_row_number <= 6
  )

  select
    c.id,
    c.display_name,
    c.avatar_url,
    c.professional_type,
    c.bio,
    c.zone_text,
    c.coverage_radius_km,
    c.starting_price,
    c.cover_photo_url,
    c.rating,
    c.review_count,

    case
      when c.exact_distance_km is null then null
      when c.exact_distance_km = 0 then 0::numeric
      else (ceil(c.exact_distance_km / 5.0) * 5.0)::numeric
    end as distance_km,

    c.matching_services,
    'professional'::text as entity_kind,
    c.experience_start_year,
    c.experience_verified,
    c.professional_verified,
    c.credentials_count,
    null::text[] as specialties,
    c.credential_highlights,
    c.honor_tier,
    c.highest_igp_level,
    c.sport_discipline_priority,
    c.verified_sport_results,
    c.verified_sport_dogs,
    c.honor_out_of_area

  from combined c

  order by
    c.highest_igp_level desc,
    c.sport_discipline_priority desc,
    c.verified_sport_dogs desc,
    c.verified_sport_results desc,
    c.best_scope_priority desc,
    c.best_placement asc nulls last,
    c.exact_distance_km asc nulls last,
    c.rating desc nulls last,
    c.display_name asc;
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
'Verified cynological merit precedes commercial and distance criteria. Replicability on different dogs precedes raw sport result count. Up to six distant verified sport professionals remain visible so merit is not hidden by radius alone.';

commit;
