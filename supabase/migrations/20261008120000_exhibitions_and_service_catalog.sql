-- NAV-01/PRO-01: two everyday categories and a separate Exhibitions entry.
-- No existing account, service, booking, message or review is deleted or recategorized.
-- The original public RPC signatures remain unchanged; new privileged code stays private.
BEGIN;

create or replace function pc_private.search_public_professionals(
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
    p_lat,p_lng,p_zone_text,coalesce(p_service_type,'trainer'),p_max_price,p_min_rating,false,null)
  where coalesce(p_service_type,'trainer') in ('trainer','boarding');
$$;

create or replace function pc_private.search_exhibition_professionals(
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
    p_lat,p_lng,p_zone_text,coalesce(p_service_type,'groomer'),p_max_price,p_min_rating,false,null)
  where coalesce(p_service_type,'groomer') in ('groomer','handler');
$$;

create or replace function public.search_exhibition_professionals(
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
language sql stable security invoker set search_path = '' as $$
  select * from pc_private.search_exhibition_professionals(p_lat,p_lng,p_zone_text,p_service_type,p_max_price,p_min_rating);
$$;

create or replace function pc_private.get_public_professional_services(
  p_professional_id uuid
)
returns table (
  id uuid,
  professional_id uuid,
  service_type text,
  name text,
  description text,
  price numeric,
  duration_kind text,
  duration_minutes integer,
  active boolean
)
language sql
stable
security definer
set search_path = ''
as $function$
  select
    s.id,
    s.professional_id,
    s.service_type,
    s.name,
    s.description,
    s.price,
    s.duration_kind,
    s.duration_minutes,
    s.active
  from public.services as s
  join public.professionals as p
    on p.id = s.professional_id
  where s.professional_id = p_professional_id
    and s.active = true
    and s.service_type in ('trainer','boarding','groomer','handler','enci_course')
    and p.approved = true
    and p.approval_status = 'approved'
  order by s.created_at desc;
$function$;


CREATE OR REPLACE FUNCTION pc_private.save_my_calendar_service(p_service_id uuid,p_name text,p_service_type text,p_price numeric,
  p_duration_minutes integer,p_duration_kind text,p_calendar_color text,p_active boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_service uuid;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=v_uid) THEN
    RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  IF p_service_id IS NULL OR p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 120
    OR p_service_type IS NULL OR char_length(btrim(p_service_type)) NOT BETWEEN 1 AND 60
    OR p_price IS NULL OR p_price<0 OR p_price>100000 OR p_price::text IN ('NaN','Infinity','-Infinity')
    OR p_duration_minutes IS NULL OR p_duration_minutes NOT BETWEEN 1 AND 525600
    OR p_duration_kind IS NULL OR p_duration_kind NOT IN ('hourly','daily','variable')
    OR p_calendar_color IS NULL OR p_calendar_color !~ '^#[0-9A-Fa-f]{6}$' OR p_active IS NULL THEN
    RAISE EXCEPTION 'Invalid service' USING ERRCODE='22023'; END IF;
  -- Match the booking lock order: professional first, then its service.
  PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
  IF p_service_type NOT IN ('trainer','boarding','groomer','handler','enci_course') AND NOT (
    p_active=false AND EXISTS(SELECT 1 FROM public.services
      WHERE id=p_service_id AND professional_id=v_uid AND service_type=p_service_type)
  ) THEN RAISE EXCEPTION 'Service category no longer offered' USING ERRCODE='22023'; END IF;
  INSERT INTO public.services AS target(id,professional_id,name,service_type,price,duration_minutes,duration_kind,calendar_color,active)
    VALUES(p_service_id,v_uid,btrim(p_name),btrim(p_service_type),round(p_price,2),p_duration_minutes,p_duration_kind,upper(p_calendar_color),p_active)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,service_type=excluded.service_type,price=excluded.price,
      duration_minutes=excluded.duration_minutes,duration_kind=excluded.duration_kind,calendar_color=excluded.calendar_color,active=excluded.active
    WHERE target.professional_id=v_uid RETURNING id INTO v_service;
  IF v_service IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  RETURN v_service;
END $$;


-- Patch only the booking category gate, retaining messaging/calendar/contact logic.
DO $migration$
DECLARE definition text; marker text := $needle$  SELECT * INTO v_service FROM public.services WHERE id=p_service_id AND professional_id=v_pro AND active=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable'; END IF;$needle$;
BEGIN
  SELECT pg_get_functiondef('pc_private.create_booking_with_dog(uuid,uuid,timestamptz,text)'::regprocedure) INTO definition;
  IF length(definition)-length(replace(definition,marker,'')) <> length(marker) THEN
    RAISE EXCEPTION 'Booking API changed: review the category guard before applying'; END IF;
  EXECUTE replace(definition,marker,marker || $guard$
  IF v_service.service_type NOT IN ('trainer','boarding','groomer','handler','enci_course') THEN
    RAISE EXCEPTION 'Service category no longer offered' USING ERRCODE='22023'; END IF;$guard$);
END $migration$;

-- Preserve the current onboarding trigger, including dog/FCI and contact verification.
DO $migration$
DECLARE definition text; marker text := $needle$      when 'groomer' then 'groomer'$needle$;
BEGIN
  SELECT pg_get_functiondef('public.handle_pawconnect_new_user()'::regprocedure) INTO definition;
  IF strpos(definition,marker)=0 OR strpos(definition,'  pro_type :=')=0 THEN
    RAISE EXCEPTION 'Onboarding changed: review handler support before applying'; END IF;
  definition := replace(definition,marker,marker || $handler$
      when 'handler' then 'handler'$handler$);
  definition := replace(definition,'  pro_type :=',$guard$  if signup_role = 'professional' and coalesce(meta ->> 'professional_type','') not in ('trainer','boarding','groomer','handler') then
    raise exception 'Choose a supported professional activity' using errcode='22023';
  end if;
  pro_type :=$guard$);
  EXECUTE definition;
END $migration$;

ALTER TABLE public.professionals ALTER COLUMN professional_type SET DEFAULT 'trainer';
-- Legacy values remain readable/editable; only NEW or changed identities are constrained.
CREATE FUNCTION pc_private.enforce_professional_activity() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF TG_OP='INSERT' OR NEW.professional_type IS DISTINCT FROM OLD.professional_type THEN
    IF NEW.professional_type IS NULL OR NEW.professional_type NOT IN ('trainer','boarding','groomer','handler') THEN
      RAISE EXCEPTION 'Choose a supported professional activity' USING ERRCODE='22023';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER professional_activity_catalog BEFORE INSERT OR UPDATE OF professional_type ON public.professionals
FOR EACH ROW EXECUTE FUNCTION pc_private.enforce_professional_activity();
REVOKE ALL ON FUNCTION pc_private.enforce_professional_activity() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION pc_private.search_exhibition_professionals(numeric,numeric,text,text,numeric,numeric),
 public.search_exhibition_professionals(numeric,numeric,text,text,numeric,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.search_exhibition_professionals(numeric,numeric,text,text,numeric,numeric),
 public.search_exhibition_professionals(numeric,numeric,text,text,numeric,numeric) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.search_exhibition_professionals(numeric,numeric,text,text,numeric,numeric) IS
 'Approved grooming and show-handling services. Same public whitelist and geographic/price rules as everyday search; no sport badge inferred.';
NOTIFY pgrst, 'reload schema';
COMMIT;
