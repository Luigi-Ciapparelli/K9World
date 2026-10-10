-- TRAIN-01: direct everyday search, optional specialist paths and distinct ENCI evidence.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE public.professional_search_modes
 ADD COLUMN show_livestock boolean NOT NULL DEFAULT false,
 ADD COLUMN show_hunting boolean NOT NULL DEFAULT false;
-- No legacy profile is silently assigned a specialism or a credential.
CREATE OR REPLACE FUNCTION pc_private.get_my_professional_search_modes()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid := auth.uid(); result jsonb;
begin
  if actor is null or not exists(select 1 from public.professionals where id=actor) then
    raise exception 'Profilo professionista richiesto' using errcode='42501';
  end if;
  select jsonb_build_object(
    'show_livestock', coalesce(m.show_livestock,false),
    'show_hunting', coalesce(m.show_hunting,false),
    'show_companion', coalesce(m.show_companion,true),
    'show_sport', coalesce(m.show_sport,false),
    'discipline_ids', coalesce((select jsonb_agg(d.discipline_id order by d.discipline_id)
      from public.professional_sport_disciplines d join public.sport_discipline_catalog c
        on c.id=d.discipline_id and c.active where d.professional_id=actor), '[]'::jsonb)
  ) into result from public.professionals p
    left join public.professional_search_modes m on m.professional_id=p.id where p.id=actor;
  return result;
end;
$function$
;
CREATE OR REPLACE FUNCTION pc_private.search_professionals_for_activity(p_lat numeric, p_lng numeric, p_zone_text text, p_service_type text, p_max_price numeric, p_min_rating numeric, p_sport boolean, p_discipline_id text, p_training_focus text)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, professional_type text, bio text, zone_text text, coverage_radius_km numeric, starting_price numeric, cover_photo_url text, rating numeric, review_count integer, distance_km numeric, matching_services jsonb, entity_kind text, experience_start_year integer, experience_verified boolean, professional_verified boolean, credentials_count integer, specialties text[], credential_highlights jsonb, honor_tier text, highest_igp_level integer, sport_discipline_priority integer, verified_sport_results integer, verified_sport_dogs integer, honor_out_of_area boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

      p.cover_photo_url as cover_photo_url,

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
        (not p_sport and (s.service_type <> 'trainer' or case p_training_focus
          when 'companion' then coalesce(m.show_companion,true)
          when 'livestock' then coalesce(m.show_livestock,false)
          when 'hunting' then coalesce(m.show_hunting,false)
          else false end))
        or (p_sport and s.service_type = 'trainer' and coalesce(m.show_sport,false)
          and exists(select 1 from public.professional_sport_disciplines pd
            join public.sport_discipline_catalog dc on dc.id=pd.discipline_id and dc.active
            where pd.professional_id=p.id and (p_discipline_id is null or dc.id=p_discipline_id)))
      )
      and (
        p_service_type is null
        or s.service_type = p_service_type
      )
      -- General professional ratings are no longer a search criterion.

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
$function$
;
CREATE OR REPLACE FUNCTION public.search_professionals_in_context(p_lat numeric, p_lng numeric, p_zone_text text, p_service_type text, p_max_price numeric, p_min_rating numeric, p_sport boolean, p_discipline_id text)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, professional_type text, bio text, zone_text text, coverage_radius_km numeric, starting_price numeric, cover_photo_url text, rating numeric, review_count integer, distance_km numeric, matching_services jsonb, entity_kind text, experience_start_year integer, experience_verified boolean, professional_verified boolean, credentials_count integer, specialties text[], credential_highlights jsonb, honor_tier text, highest_igp_level integer, sport_discipline_priority integer, verified_sport_results integer, verified_sport_dogs integer, honor_out_of_area boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT * FROM pc_private.search_professionals_for_activity(p_lat,p_lng,p_zone_text,p_service_type,
 p_max_price,p_min_rating,p_sport,p_discipline_id,'companion');
$function$;

CREATE FUNCTION pc_private.search_training_professionals(p_focus text DEFAULT 'companion',p_lat numeric DEFAULT NULL,
 p_lng numeric DEFAULT NULL,p_zone_text text DEFAULT NULL,p_max_price numeric DEFAULT NULL)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, professional_type text, bio text, zone_text text, coverage_radius_km numeric, starting_price numeric, cover_photo_url text, rating numeric, review_count integer, distance_km numeric, matching_services jsonb, entity_kind text, experience_start_year integer, experience_verified boolean, professional_verified boolean, credentials_count integer, specialties text[], credential_highlights jsonb, honor_tier text, highest_igp_level integer, sport_discipline_priority integer, verified_sport_results integer, verified_sport_dogs integer, honor_out_of_area boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_focus IS NULL OR p_focus NOT IN ('companion','livestock','hunting') THEN
  RAISE EXCEPTION 'Invalid training activity' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT * FROM pc_private.search_professionals_for_activity(p_lat,p_lng,p_zone_text,'trainer',p_max_price,NULL,false,NULL,p_focus);
END $$;
CREATE FUNCTION public.search_training_professionals(p_focus text DEFAULT 'companion',p_lat numeric DEFAULT NULL,
 p_lng numeric DEFAULT NULL,p_zone_text text DEFAULT NULL,p_max_price numeric DEFAULT NULL)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, professional_type text, bio text, zone_text text, coverage_radius_km numeric, starting_price numeric, cover_photo_url text, rating numeric, review_count integer, distance_km numeric, matching_services jsonb, entity_kind text, experience_start_year integer, experience_verified boolean, professional_verified boolean, credentials_count integer, specialties text[], credential_highlights jsonb, honor_tier text, highest_igp_level integer, sport_discipline_priority integer, verified_sport_results integer, verified_sport_dogs integer, honor_out_of_area boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM pc_private.search_training_professionals(p_focus,p_lat,p_lng,p_zone_text,p_max_price);
$$;
CREATE FUNCTION pc_private.set_my_training_search_modes(p_show_companion boolean,p_show_sport boolean,
 p_discipline_ids text[],p_show_livestock boolean,p_show_hunting boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_show_livestock IS NULL OR p_show_hunting IS NULL THEN
  RAISE EXCEPTION 'Invalid training preferences' USING ERRCODE='22023'; END IF;
 -- The existing setter owns validation and serializes on the professional row.
 PERFORM pc_private.set_my_professional_search_modes(p_show_companion,p_show_sport,p_discipline_ids);
 UPDATE public.professional_search_modes SET show_livestock=p_show_livestock,show_hunting=p_show_hunting,
  updated_at=now() WHERE professional_id=auth.uid();
 RETURN pc_private.get_my_professional_search_modes();
END $$;
CREATE FUNCTION public.set_my_training_search_modes(p_show_companion boolean,p_show_sport boolean,
 p_discipline_ids text[],p_show_livestock boolean,p_show_hunting boolean)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.set_my_training_search_modes(p_show_companion,p_show_sport,p_discipline_ids,p_show_livestock,p_show_hunting);
$$;
CREATE FUNCTION pc_private.get_public_training_activities(p_professional_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('companion',coalesce(m.show_companion,true),'livestock',coalesce(m.show_livestock,false),
 'hunting',coalesce(m.show_hunting,false)) FROM public.professionals p
 LEFT JOIN public.professional_search_modes m ON m.professional_id=p.id
 WHERE p.id=p_professional_id AND p.approved AND p.approval_status='approved'
 AND EXISTS(SELECT 1 FROM public.services s WHERE s.professional_id=p.id AND s.service_type='trainer' AND s.active);
$$;
CREATE FUNCTION public.get_public_training_activities(p_professional_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.get_public_training_activities(p_professional_id);
$$;

-- Optional structured evidence. No inference from service, breed, bio or sport.
ALTER TABLE public.professional_credentials ADD COLUMN enci_section smallint;
ALTER TABLE public.professional_credentials ADD CONSTRAINT professional_credentials_enci_section_check
 CHECK (enci_section IS NULL OR (enci_section IN (1,2,3) AND credential_type='professional_qualification'
 AND issuer_name IS NOT NULL AND issuer_name='ENCI'));
CREATE FUNCTION pc_private.enforce_enci_section_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE profile_kind text;
BEGIN
 IF NEW.enci_section IS NOT NULL THEN
  SELECT p.listing_type INTO profile_kind FROM public.professionals p WHERE p.id=NEW.professional_id FOR SHARE;
  IF profile_kind IS DISTINCT FROM 'individual' THEN
   RAISE EXCEPTION 'Le sezioni ENCI appartengono alla persona, non alla struttura.' USING ERRCODE='23514';
  END IF;
 END IF;
 IF TG_OP='UPDATE' AND (OLD.enci_section IS NOT NULL OR NEW.enci_section IS NOT NULL) AND
  ROW(NEW.enci_section,NEW.professional_id,NEW.credential_type,NEW.issuer_name,NEW.title,NEW.external_url,NEW.document_path,NEW.issued_at,NEW.description)
  IS DISTINCT FROM ROW(OLD.enci_section,OLD.professional_id,OLD.credential_type,OLD.issuer_name,OLD.title,OLD.external_url,OLD.document_path,OLD.issued_at,OLD.description) THEN
   NEW.verification_status:='self_declared'; NEW.verification_method:=NULL;
   NEW.reviewed_at:=NULL;NEW.reviewed_by:=NULL;NEW.source_verified_at:=NULL;
   NEW.source_checked_at:=NULL;NEW.source_fingerprint:=NULL;NEW.verification_note:=NULL;
 END IF;
 IF NEW.enci_section IS NOT NULL AND NEW.verification_status='verified' AND
   (NEW.verification_method IS DISTINCT FROM 'manual_admin' OR NEW.reviewed_at IS NULL OR NEW.reviewed_by IS NULL OR NOT (
    coalesce(NEW.external_url ~ '^https://(www\.)?enci\.it(/|$)',false)
    OR coalesce(NEW.document_path LIKE NEW.professional_id::text||'/%',false))) THEN
  RAISE EXCEPTION 'An ENCI section needs a reviewed ENCI source or private supporting document' USING ERRCODE='22023';
 END IF;
 RETURN NEW;
END $$;
-- Runs after the existing verification protection; changing a section invalidates its verification.
CREATE TRIGGER zz_enci_section_evidence BEFORE INSERT OR UPDATE ON public.professional_credentials
 FOR EACH ROW EXECUTE FUNCTION pc_private.enforce_enci_section_evidence();

-- Do not transfer a personal registration by converting the listing to a centre.
CREATE FUNCTION pc_private.protect_enci_profile_kind() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.listing_type IS DISTINCT FROM 'individual' AND EXISTS(
  SELECT 1 FROM public.professional_credentials c WHERE c.professional_id=OLD.id AND c.enci_section IS NOT NULL) THEN
  RAISE EXCEPTION 'Rimuovi le qualifiche ENCI personali prima di trasformare il profilo in una struttura.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_enci_profile_kind BEFORE UPDATE OF listing_type ON public.professionals
 FOR EACH ROW WHEN (OLD.listing_type IS DISTINCT FROM NEW.listing_type)
 EXECUTE FUNCTION pc_private.protect_enci_profile_kind();
REVOKE ALL ON FUNCTION pc_private.protect_enci_profile_kind() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION pc_private.get_public_professional_credentials_v2(p_professional_id uuid)
 RETURNS TABLE(id uuid, credential_type text, title text, issuer_name text, issued_at date, discipline text, achievement text, description text, external_url text, verification_status text, verification_method text, source_provider text, source_verified_at timestamp with time zone, dog_name text, event_name text, event_scope text, placement integer, score_text text, enci_section smallint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT v.*,c.enci_section FROM pc_private.get_public_professional_credentials(p_professional_id) v
 JOIN public.professional_credentials c ON c.id=v.id
 JOIN public.professionals p ON p.id=c.professional_id
 WHERE c.enci_section IS NULL OR p.listing_type='individual';
$$;
CREATE FUNCTION public.get_public_professional_credentials_v2(p_professional_id uuid)
 RETURNS TABLE(id uuid, credential_type text, title text, issuer_name text, issued_at date, discipline text, achievement text, description text, external_url text, verification_status text, verification_method text, source_provider text, source_verified_at timestamp with time zone, dog_name text, event_name text, event_scope text, placement integer, score_text text, enci_section smallint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM pc_private.get_public_professional_credentials_v2(p_professional_id);
$$;
REVOKE ALL ON FUNCTION pc_private.search_professionals_for_activity(numeric,numeric,text,text,numeric,numeric,boolean,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION pc_private.enforce_enci_section_evidence() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION pc_private.search_training_professionals(text,numeric,numeric,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.search_training_professionals(text,numeric,numeric,text,numeric) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.search_training_professionals(text,numeric,numeric,text,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.search_training_professionals(text,numeric,numeric,text,numeric) TO anon,authenticated;
REVOKE ALL ON FUNCTION pc_private.set_my_training_search_modes(boolean,boolean,text[],boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.set_my_training_search_modes(boolean,boolean,text[],boolean,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.set_my_training_search_modes(boolean,boolean,text[],boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_my_training_search_modes(boolean,boolean,text[],boolean,boolean) TO authenticated;
REVOKE ALL ON FUNCTION pc_private.get_public_training_activities(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.get_public_training_activities(uuid) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.get_public_training_activities(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_training_activities(uuid) TO anon,authenticated;
REVOKE ALL ON FUNCTION pc_private.get_public_professional_credentials_v2(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.get_public_professional_credentials_v2(uuid) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.get_public_professional_credentials_v2(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_professional_credentials_v2(uuid) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
