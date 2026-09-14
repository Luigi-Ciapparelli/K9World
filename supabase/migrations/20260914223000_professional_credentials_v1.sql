begin;

create table if not exists public.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id)
    on delete cascade,
  credential_type text not null,
  title text not null,
  issuer_name text,
  issued_at date,
  discipline text,
  achievement text,
  description text,
  external_url text,
  document_path text,

  -- Structured sport facts. These let PortaleCinofilo represent a career
  -- as facts instead of as a single free-text badge.
  dog_name text,
  event_name text,
  event_scope text,
  placement integer,
  score_text text,

  -- Source / provenance. A public Working-Dog URL can be checked server-side;
  -- the client can never set the final verification result by itself.
  source_provider text,
  verification_method text,
  source_verified_at timestamptz,
  source_checked_at timestamptz,
  source_fingerprint text,
  verification_note text,

  is_public boolean not null default true,
  verification_status text not null default 'self_declared',
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint professional_credentials_type_check
    check (
      credential_type in (
        'course_certificate',
        'seminar_attendance',
        'professional_qualification',
        'official_test',
        'sport_result',
        'other'
      )
    ),

  constraint professional_credentials_verification_check
    check (
      verification_status in (
        'self_declared',
        'pending',
        'verified',
        'rejected',
        'revoked'
      )
    ),

  constraint professional_credentials_title_check
    check (char_length(btrim(title)) between 2 and 180),

  constraint professional_credentials_external_url_check
    check (
      external_url is null
      or external_url ~* '^https?://'
    ),

  constraint professional_credentials_event_scope_check
    check (
      event_scope is null
      or event_scope in ('club', 'regional', 'national', 'international', 'world')
    ),

  constraint professional_credentials_placement_check
    check (placement is null or placement > 0),

  constraint professional_credentials_source_provider_check
    check (
      source_provider is null
      or source_provider in ('working_dog', 'external', 'uploaded_document')
    ),

  constraint professional_credentials_verification_method_check
    check (
      verification_method is null
      or verification_method in ('working_dog_auto', 'manual_admin')
    )
);

create index if not exists professional_credentials_professional_idx
  on public.professional_credentials(professional_id, created_at desc);

create index if not exists professional_credentials_public_idx
  on public.professional_credentials(professional_id, is_public, verification_status);

alter table public.professional_credentials enable row level security;

grant select, insert, update, delete
on table public.professional_credentials
to authenticated;

drop policy if exists "Professional selects own credentials"
on public.professional_credentials;
create policy "Professional selects own credentials"
on public.professional_credentials
for select
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Professional inserts own credentials"
on public.professional_credentials;
create policy "Professional inserts own credentials"
on public.professional_credentials
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'professional'
  )
);

drop policy if exists "Professional updates own credentials"
on public.professional_credentials;
create policy "Professional updates own credentials"
on public.professional_credentials
for update
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Professional deletes own credentials"
on public.professional_credentials;
create policy "Professional deletes own credentials"
on public.professional_credentials
for delete
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

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


-- ---------------------------------------------------------------------------
-- External professional identities
-- ---------------------------------------------------------------------------
-- Working-Dog is the first provider. The row says that a public external
-- identity was claimed/verified; it does not grant blanket verification to
-- every fact. Each sport result is still verified independently.

create table if not exists public.professional_external_identities (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null
    references public.professionals(id)
    on delete cascade,
  provider text not null,
  profile_url text not null,
  external_display_name text,
  verification_status text not null default 'pending',
  verification_method text,
  verified_at timestamptz,
  last_checked_at timestamptz,
  verification_note text,
  source_fingerprint text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint professional_external_identities_provider_check
    check (provider in ('working_dog')),

  constraint professional_external_identities_status_check
    check (
      verification_status in (
        'pending',
        'verified',
        'rejected',
        'revoked'
      )
    ),

  constraint professional_external_identities_method_check
    check (
      verification_method is null
      or verification_method in ('working_dog_auto', 'manual_admin')
    ),

  constraint professional_external_identities_url_check
    check (profile_url ~* '^https?://')
);

create unique index if not exists professional_external_identity_provider_professional_uidx
  on public.professional_external_identities(provider, professional_id);

create unique index if not exists professional_external_identity_provider_url_uidx
  on public.professional_external_identities(provider, lower(profile_url));

alter table public.professional_external_identities enable row level security;

grant select, insert, update, delete
on table public.professional_external_identities
to authenticated;

drop policy if exists "Professional selects own external identities"
on public.professional_external_identities;
create policy "Professional selects own external identities"
on public.professional_external_identities
for select
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Professional inserts own external identities"
on public.professional_external_identities;
create policy "Professional inserts own external identities"
on public.professional_external_identities
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'professional'
  )
);

drop policy if exists "Professional updates own external identities"
on public.professional_external_identities;
create policy "Professional updates own external identities"
on public.professional_external_identities
for update
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists "Professional deletes own external identities"
on public.professional_external_identities;
create policy "Professional deletes own external identities"
on public.professional_external_identities
for delete
to authenticated
using (
  professional_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create or replace function public.protect_external_identity_verification()
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
      new.verification_status := 'pending';
      new.verification_method := null;
      new.verified_at := null;
      new.last_checked_at := null;
      new.verification_note := null;
      new.source_fingerprint := null;
    else
      new.verification_status := old.verification_status;
      new.verification_method := old.verification_method;
      new.verified_at := old.verified_at;
      new.last_checked_at := old.last_checked_at;
      new.verification_note := old.verification_note;
      new.source_fingerprint := old.source_fingerprint;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

revoke all
on function public.protect_external_identity_verification()
from public, anon, authenticated;

drop trigger if exists protect_external_identity_verification
on public.professional_external_identities;

create trigger protect_external_identity_verification
before insert or update
on public.professional_external_identities
for each row
execute function public.protect_external_identity_verification();

create or replace function public.get_public_professional_external_identities(
  p_professional_id uuid
)
returns table (
  provider text,
  profile_url text,
  external_display_name text,
  verified_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    i.provider,
    i.profile_url,
    i.external_display_name,
    i.verified_at
  from public.professional_external_identities i
  join public.professionals p
    on p.id = i.professional_id
  where i.professional_id = p_professional_id
    and i.verification_status = 'verified'
    and p.approved = true
    and p.approval_status = 'approved';
$function$;

revoke all
on function public.get_public_professional_external_identities(uuid)
from public, anon, authenticated;

grant execute
on function public.get_public_professional_external_identities(uuid)
to anon, authenticated;

-- Manual review is the fallback for sources that cannot be verified
-- automatically. The RPC keeps state transitions controlled and auditable.
create or replace function public.admin_review_professional_credential(
  p_credential_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) then
    raise exception 'admin required';
  end if;

  if p_status not in ('pending', 'verified', 'rejected', 'revoked') then
    raise exception 'invalid credential status';
  end if;

  update public.professional_credentials
  set
    verification_status = p_status,
    verification_method =
      case
        when p_status in ('verified', 'rejected', 'revoked')
          then 'manual_admin'
        else verification_method
      end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    verification_note = nullif(btrim(p_note), '')
  where id = p_credential_id;

  if not found then
    raise exception 'credential not found';
  end if;
end;
$function$;

revoke all
on function public.admin_review_professional_credential(uuid, text, text)
from public, anon, authenticated;

grant execute
on function public.admin_review_professional_credential(uuid, text, text)
to authenticated;


insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'professional-credentials',
  'professional-credentials',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Professionals upload own credential evidence" on storage.objects;
create policy "Professionals upload own credential evidence"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'professional-credentials'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'professional'
  )
);

drop policy if exists "Professionals view own credential evidence" on storage.objects;
create policy "Professionals view own credential evidence"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'professional-credentials'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);

drop policy if exists "Professionals delete own credential evidence" on storage.objects;
create policy "Professionals delete own credential evidence"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'professional-credentials'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
);

create or replace function public.get_public_professional_credentials(
  p_professional_id uuid
)
returns table (
  id uuid,
  credential_type text,
  title text,
  issuer_name text,
  issued_at date,
  discipline text,
  achievement text,
  description text,
  external_url text,
  verification_status text,
  verification_method text,
  source_provider text,
  source_verified_at timestamptz,
  dog_name text,
  event_name text,
  event_scope text,
  placement integer,
  score_text text
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    c.id,
    c.credential_type,
    c.title,
    c.issuer_name,
    c.issued_at,
    c.discipline,
    c.achievement,
    c.description,
    c.external_url,
    c.verification_status,
    c.verification_method,
    c.source_provider,
    c.source_verified_at,
    c.dog_name,
    c.event_name,
    c.event_scope,
    c.placement,
    c.score_text
  from public.professional_credentials c
  join public.professionals p
    on p.id = c.professional_id
  where c.professional_id = p_professional_id
    and c.is_public = true
    and c.verification_status in ('self_declared', 'pending', 'verified')
    and p.approved = true
    and p.approval_status = 'approved'
  order by
    case c.verification_status
      when 'verified' then 0
      when 'pending' then 1
      else 2
    end,
    c.issued_at desc nulls last,
    c.created_at desc;
$function$;

revoke all
on function public.get_public_professional_credentials(uuid)
from public, anon, authenticated;

grant execute
on function public.get_public_professional_credentials(uuid)
to anon, authenticated;

create or replace view public.public_professional_profiles
with (security_barrier = true)
as
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
  p.starting_price,
  case
    when coalesce(p.listing_type, 'individual') = 'individual' then null
    else p.cover_photo_url
  end as cover_photo_url,
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
grant select on public.public_professional_profiles to anon, authenticated;

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
  credential_highlights jsonb
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
              'verification_status', h.verification_status
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
    join public.profiles pr on pr.id = p.id
    join public.services s
      on s.professional_id = p.id
     and s.active = true

    where p.approved = true
      and p.approval_status = 'approved'
      and (p_service_type is null or s.service_type = p_service_type)
      and (p_min_rating is null or coalesce(p.rating, 0) >= p_min_rating)

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

  filtered as (
    select c.*
    from candidates c
    where
      (p_max_price is null or c.starting_price <= p_max_price)
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
    f.credentials_count,
    null::text[] as specialties,
    f.credential_highlights
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

commit;
