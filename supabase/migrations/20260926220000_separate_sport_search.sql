-- Sport search v1: offered disciplines and independent visibility.
-- Result verification/ranking remains a separate increment. No badge is inferred.
begin;

create table public.sport_discipline_catalog (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{1,49}$'),
  label text not null check (length(label) between 1 and 80),
  description text not null default '',
  aliases text[] not null default '{}',
  display_order integer not null default 100,
  active boolean not null default true,
  catalog_version integer not null default 1,
  working_dog_status text not null default 'unconfirmed'
    check (working_dog_status in ('unconfirmed', 'supported', 'unsupported')),
  source_url text,
  updated_at timestamptz not null default now()
);

-- Initial editorial search catalog, NOT a claim of Working-Dog API coverage.
insert into public.sport_discipline_catalog
  (id, label, description, aliases, display_order) values
  ('igp', 'IGP', 'Preparazione del binomio nelle prove di utilità e difesa.', array['igp','ipo'], 10),
  ('obedience', 'Obedience', 'Esercizi di precisione e collaborazione tra cane e conduttore.', array['obedience','obed'], 20),
  ('agility', 'Agility', 'Percorsi a ostacoli e conduzione del cane.', array['agility','agility dog'], 30),
  ('rally-obedience', 'Rally Obedience', 'Percorsi con stazioni ed esercizi da svolgere insieme.', array['rally obedience','rally-o','rally'], 40),
  ('mondioring', 'Mondioring', 'Preparazione alle prove della disciplina Mondioring.', array['mondioring','mondio'], 50),
  ('tracking', 'Pista sportiva', 'Lavoro olfattivo su pista e preparazione alle prove.', array['tracking','igp-fh','ifh','fh'], 60),
  ('mantrailing', 'Mantrailing', 'Ricerca di una persona seguendone la traccia olfattiva.', array['mantrailing'], 70),
  ('hoopers', 'Hoopers', 'Percorsi con attrezzi e conduzione a distanza.', array['hoopers'], 80),
  ('dog-dancing', 'Dog Dancing', 'Movimento e collaborazione in sequenze e coreografie.', array['dog dancing','dog dance','freestyle','heelwork to music'], 90),
  ('disc-dog', 'Disc Dog', 'Attività del binomio con il disco.', array['disc dog','discdog'], 100),
  ('flyball', 'Flyball', 'Preparazione del cane alla disciplina Flyball.', array['flyball'], 110);

create table public.professional_search_modes (
  professional_id uuid primary key references public.professionals(id) on delete cascade,
  show_companion boolean not null default true,
  show_sport boolean not null default false,
  migrated_from_legacy boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.professional_sport_disciplines (
  professional_id uuid not null references public.professionals(id) on delete cascade,
  discipline_id text not null references public.sport_discipline_catalog(id),
  created_at timestamptz not null default now(),
  primary key (professional_id, discipline_id)
);
create index professional_sport_disciplines_search
  on public.professional_sport_disciplines(discipline_id, professional_id);

-- Keep every existing profile visible in everyday search. Do not infer what they teach
-- from a competition result: disciplines must be explicitly selected by the author.
insert into public.professional_search_modes
  (professional_id, show_companion, show_sport, migrated_from_legacy)
select id, true, true, true from public.professionals;

alter table public.sport_discipline_catalog enable row level security;
alter table public.professional_search_modes enable row level security;
alter table public.professional_sport_disciplines enable row level security;
revoke all on public.sport_discipline_catalog, public.professional_search_modes,
  public.professional_sport_disciplines from public, anon, authenticated;

create function public.list_sport_disciplines()
returns table (id text, label text, description text, aliases text[])
language sql stable security definer set search_path = '' as $$
  select d.id, d.label, d.description, d.aliases
  from public.sport_discipline_catalog d where d.active
  order by d.display_order, d.label, d.id;
$$;

create function public.get_my_professional_search_modes()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare actor uuid := auth.uid(); result jsonb;
begin
  if actor is null or not exists(select 1 from public.professionals where id=actor) then
    raise exception 'Profilo professionista richiesto' using errcode='42501';
  end if;
  select jsonb_build_object(
    'show_companion', coalesce(m.show_companion,true),
    'show_sport', coalesce(m.show_sport,false),
    'discipline_ids', coalesce((select jsonb_agg(d.discipline_id order by d.discipline_id)
      from public.professional_sport_disciplines d join public.sport_discipline_catalog c
        on c.id=d.discipline_id and c.active where d.professional_id=actor), '[]'::jsonb)
  ) into result from public.professionals p
    left join public.professional_search_modes m on m.professional_id=p.id where p.id=actor;
  return result;
end;
$$;

create function public.set_my_professional_search_modes(
  p_show_companion boolean, p_show_sport boolean, p_discipline_ids text[]
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Accesso richiesto' using errcode='42501';
  end if;
  -- Serialize concurrent saves, including an initially missing preferences row.
  perform 1 from public.professionals where id=actor for update;
  if not found then raise exception 'Profilo professionista richiesto' using errcode='42501'; end if;
  if p_show_companion is null or p_show_sport is null or p_discipline_ids is null
    or cardinality(p_discipline_ids)>30
    or exists(select 1 from unnest(p_discipline_ids) x(id) where x.id is null
      or not exists(select 1 from public.sport_discipline_catalog c where c.id=x.id and c.active))
  then raise exception 'Preferenze o discipline non valide' using errcode='22023'; end if;
  if p_show_sport and cardinality(p_discipline_ids)=0 then
    raise exception 'Scegli almeno una disciplina per comparire in Sport cinofili' using errcode='22023';
  end if;
  insert into public.professional_search_modes(professional_id,show_companion,show_sport)
    values(actor,p_show_companion,p_show_sport)
  on conflict(professional_id) do update set show_companion=excluded.show_companion,
    show_sport=excluded.show_sport, updated_at=now();
  delete from public.professional_sport_disciplines
    where professional_id=actor and not(discipline_id=any(p_discipline_ids));
  insert into public.professional_sport_disciplines(professional_id,discipline_id)
    select actor, id from (select distinct unnest(p_discipline_ids) id) d
    on conflict do nothing;
  return public.get_my_professional_search_modes();
end;
$$;

create function public.get_public_professional_sports(p_professional_id uuid)
returns table(id text, label text, description text)
language sql stable security definer set search_path = '' as $$
  select c.id,c.label,c.description from public.professional_sport_disciplines d
    join public.sport_discipline_catalog c on c.id=d.discipline_id and c.active
    join public.professionals p on p.id=d.professional_id
    join public.professional_search_modes m on m.professional_id=p.id and m.show_sport
  where p.id=p_professional_id and p.approved and p.approval_status='approved'
  order by c.display_order,c.label,c.id;
$$;

revoke all on function public.list_sport_disciplines(),
  public.get_public_professional_sports(uuid), public.get_my_professional_search_modes(),
  public.set_my_professional_search_modes(boolean,boolean,text[]) from public,anon,authenticated;
grant execute on function public.list_sport_disciplines(),
  public.get_public_professional_sports(uuid) to anon,authenticated;
grant execute on function public.get_my_professional_search_modes(),
  public.set_my_professional_search_modes(boolean,boolean,text[]) to authenticated;

-- Search functions follow below; all added objects are part of this transaction.

create function public.search_professionals_in_context(
  p_lat numeric, p_lng numeric, p_zone_text text, p_service_type text,
  p_max_price numeric, p_min_rating numeric, p_sport boolean, p_discipline_id text
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
language sql stable security definer set search_path = '' as $function$
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
              and (not p_sport or (pc.credential_type in ('sport_result','official_test')
                and (p_discipline_id is null or exists(
                  select 1 from public.sport_discipline_catalog dc
                  where dc.id=p_discipline_id and
                    lower(btrim(pc.discipline)) = any(array[dc.id,lower(dc.label)] || dc.aliases)))))
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
    left join public.professional_search_modes m
      on m.professional_id = p.id

    where p.approved = true
      and p.approval_status = 'approved'
      and (
        (not p_sport and (s.service_type <> 'trainer' or coalesce(m.show_companion,true)))
        or (p_sport and s.service_type = 'trainer' and coalesce(m.show_sport,false)
          and exists(select 1 from public.professional_sport_disciplines pd
            join public.sport_discipline_catalog dc on dc.id=pd.discipline_id and dc.active
            where pd.professional_id=p.id and (p_discipline_id is null or dc.id=p_discipline_id)))
      )
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
      p.professional_verification_status
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
  )
  select c.id,c.display_name,c.avatar_url,c.professional_type,c.bio,c.zone_text,
    c.coverage_radius_km,c.starting_price,c.cover_photo_url,c.rating,c.review_count,
    case when c.exact_distance_km is null then null
      else (ceil(c.exact_distance_km / 5.0) * 5.0)::numeric end,
    c.matching_services,'professional'::text,c.experience_start_year,c.experience_verified,
    c.professional_verified,c.credentials_count,
    case when p_sport then array(select dc.label from public.professional_sport_disciplines pd
      join public.sport_discipline_catalog dc on dc.id=pd.discipline_id and dc.active
      where pd.professional_id=c.id order by dc.display_order,dc.label) else null::text[] end,
    c.credential_highlights,
    null::text,0::integer,0::integer,0::integer,0::integer,false
  from location_marked c where c.is_local_match
  order by c.exact_distance_km asc nulls last, c.display_name asc, c.id asc;
$function$;
revoke all on function public.search_professionals_in_context(numeric,numeric,text,text,numeric,numeric,boolean,text)
  from public,anon,authenticated;

-- Keep the production signature and row shape compatible with older clients.
create or replace function public.search_public_professionals(
  p_lat numeric default null, p_lng numeric default null, p_zone_text text default null,
  p_service_type text default null, p_max_price numeric default null, p_min_rating numeric default null
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
language sql stable security definer set search_path = '' as $$
  select * from public.search_professionals_in_context(
    p_lat,p_lng,p_zone_text,p_service_type,p_max_price,p_min_rating,false,null);
$$;

create function public.search_sport_professionals(
  p_discipline_id text default null, p_lat numeric default null, p_lng numeric default null,
  p_zone_text text default null, p_max_price numeric default null, p_min_rating numeric default null
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
language sql stable security definer set search_path = '' as $$
  select * from public.search_professionals_in_context(
    p_lat,p_lng,p_zone_text,'trainer',p_max_price,p_min_rating,true,p_discipline_id);
$$;
revoke all on function public.search_public_professionals(numeric,numeric,text,text,numeric,numeric),
  public.search_sport_professionals(text,numeric,numeric,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.search_public_professionals(numeric,numeric,text,text,numeric,numeric),
  public.search_sport_professionals(text,numeric,numeric,text,numeric,numeric) to anon,authenticated;
comment on function public.search_public_professionals(numeric,numeric,text,text,numeric,numeric)
  is 'Everyday search: offered services, companion visibility for training, local coverage; no global sport priority.';
comment on function public.search_sport_professionals(text,numeric,numeric,text,numeric,numeric)
  is 'Optional sport search: explicit visibility and offered disciplines, local coverage. No inferred badge or cross-discipline ranking.';
notify pgrst, 'reload schema';
commit;
