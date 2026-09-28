-- Public API contracts remain unchanged. Privileged implementations are internal.
-- Reviewed against db2e010; also supports the optional lesson-pack increment.
-- Never add pc_private to PostgREST / Supabase Exposed schemas.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';
SET LOCAL search_path = '';

DO $guard$
BEGIN
  IF current_setting('server_version_num')::integer < 150000 THEN
    RAISE EXCEPTION 'PostgreSQL 15 or later is required';
  END IF;
  IF EXISTS (
    SELECT 1 FROM regexp_split_to_table(coalesce(current_setting('pgrst.db_schemas',true),'public'),',') s
    WHERE trim(both '"' FROM btrim(s))='pc_private'
  ) OR EXISTS (
    SELECT 1 FROM pg_catalog.pg_db_role_setting r CROSS JOIN LATERAL unnest(r.setconfig) cfg
    CROSS JOIN LATERAL regexp_split_to_table(substr(cfg,length('pgrst.db_schemas=')+1),',') s
    WHERE cfg LIKE 'pgrst.db_schemas=%'
      AND r.setdatabase IN (0,(SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database()))
      AND trim(both '"' FROM btrim(s))='pc_private'
  ) THEN
    RAISE EXCEPTION 'pc_private must not be an exposed API schema';
  END IF;
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='pc_private') THEN
    RAISE EXCEPTION 'pc_private already exists; inspect schema instead of overwriting it';
  END IF;
END $guard$;

CREATE SCHEMA pc_private;
REVOKE ALL ON SCHEMA pc_private FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA pc_private TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA pc_private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

-- Move only reviewed implementations; refuse source drift and unknown callable
-- definer routines. ALTER ... SET SCHEMA preserves OIDs, policy dependencies,
-- owner, ACLs, locks, authorization checks and function-local configuration.
DO $move$
DECLARE
  expected record; f record; permission record; oid_before oid;
  arg_types text; call_args text; optional_count integer := 0;
BEGIN
  FOR expected IN SELECT * FROM (VALUES
    ('add_my_time_off(uuid, date, date, text)', 'c4d78a7fff067e204d4e4c60cfa0bdec', false),
    ('admin_review_professional_credential(uuid, text, text)', '6be98fc7055364b5f47f788a2fbb2d94', false),
    ('admin_set_professional_approval(uuid, text, text, text)', '4463de01f09adb6844c20c24e572df22', false),
    ('can_professional_view_dog_photo(text)', 'd474bda541c1e758a0885f17386cb931', false),
    ('cancel_own_client_pass(uuid, integer, text)', '35317925e4b5691daed8089ffd3a3e37', true),
    ('change_booking_status(uuid, text)', 'e307bb1cdd63efecc2d641c61a888f9c', false),
    ('close_dog_relationship(uuid)', 'e433a7063830f59cfe6045cda15c7fd7', false),
    ('create_booking_with_dog(uuid, uuid, timestamp with time zone, text)', '34f77d20f27da1d367ef1faabb11d649', false),
    ('delete_my_reply_template(uuid)', '445c8f672be55a6a2d3e2141bb0f8ef8', false),
    ('get_booking_message_summaries(uuid[])', '88e6433be5696f4b92066c1a66c0b6e1', false),
    ('get_booking_messages(uuid, bigint, bigint, integer)', '06e64b9224c43d3ec0507fd0857dbb65', false),
    ('get_client_pass_events(uuid)', 'e128677884d0bb18aa5ec927cb060b26', true),
    ('get_my_booking_calendar(date, date, integer, integer)', '329476cb5c4a7919dabc5822328a0fbb', false),
    ('get_my_booking_message_inbox(integer, integer)', 'f48a1ce2e7107d213e8dd1ebd159d8c9', false),
    ('get_my_owner_bookings()', '99579c7cd079634a8eb60617a9322859', false),
    ('get_my_professional_search_modes()', 'b1e57672d42a6ec1ea26df6eeafd553c', false),
    ('get_my_schedule(date, date)', '8080a1a0f29bf4b8f64de357f506791f', false),
    ('get_professional_bookings()', '2c74e84034ec31589d3ebaed9cfc6618', false),
    ('get_professional_clients()', '9e52885279fa8a92fffedf186d470b79', false),
    ('get_public_booking_availability(uuid, date, date)', '4ae2e34ed4c7055c4f756efb6ae46231', false),
    ('get_public_professional_credentials(uuid)', '5c506adf8f9ef5365fe13c403d854bf1', false),
    ('get_public_professional_external_identities(uuid)', '7ec7b3a9035d675aa81ac20e746b0bc3', false),
    ('get_public_professional_services(uuid)', 'c4a8b5f5fc7021216ce8275072cc4e9e', false),
    ('get_public_professional_sports(uuid)', 'ddbd93de928fda80a469058cdedacf89', false),
    ('grant_dog_continuity_access(uuid, uuid, uuid[], integer, text)', '1657d8152d0006b3a4b7a149a7926e42', false),
    ('invite_dog_professional(uuid, uuid)', 'aa4485413e190bc280c51c5c6924ac68', false),
    ('is_admin()', '6bb67c176d2c5f42f2cd630cc251556b', false),
    ('issue_client_pass(uuid, uuid, uuid)', 'a857ebf1afc5c9dfd50332d5bb0aaa38', true),
    ('list_my_client_passes(boolean)', '01e76fa463eb4e588896aa3318f71889', true),
    ('list_my_continuity_grants(uuid, integer, integer)', '52a62c1e7bf7bbf6cbc972594e442b36', false),
    ('list_my_continuity_notes(integer, integer)', 'e9eb66fdb5dbfaa67ed521deaa282e60', false),
    ('list_my_dog_relationships()', '0411c03cdf556174cb103eb61f71b627', false),
    ('list_my_reply_templates()', '3ae7ae9a9a5ca0da7742a424e4bee470', false),
    ('list_own_pass_templates()', '7f0c45303b41995329317abc37a6cb95', true),
    ('list_own_professional_note_revisions(integer, integer)', 'f5dbc3aebbe36d2e72b476aa5eca5478', false),
    ('list_owner_continuity_publications(uuid, integer, integer)', '6133d5e8054b84e43fc8b71109ebe926', false),
    ('list_owner_continuity_recipients(uuid)', 'f511dbfef3a629758b27678fe31f5913', false),
    ('list_pass_eligible_bookings(uuid)', '6291cdbb207f6b1861263615a8292b02', true),
    ('list_sport_disciplines()', 'f5902701978cf65095af1147737cafce', false),
    ('mark_booking_messages_read(uuid, bigint)', '4dc58ea9af06e7bd95bab19b97d1e006', false),
    ('prepare_my_continuity_note(uuid, uuid, integer, uuid)', 'a41289e67e38a1c9a53f654374dd1d4b', false),
    ('read_received_continuity_notes(uuid, integer, integer)', '8ab342219a0f96d65b23b0d670b770bb', false),
    ('record_pass_use(uuid, uuid, uuid, timestamp with time zone, text)', '1d7e385ad57e31d4649037a874c03847', true),
    ('record_professional_session(uuid, uuid, timestamp with time zone, text, text, uuid)', '5c28a7652f59ef5e394c7d3f64ff636b', false),
    ('remove_my_time_off(uuid)', '5b0064b3da0744663eb5b6864a95fdff', false),
    ('respond_dog_relationship(uuid, boolean)', '03c294599db6e80db72fbe1cbfad8332', false),
    ('reverse_pass_use(uuid, uuid, text)', '7bbde57949a1971b8355e50418e628eb', true),
    ('revise_own_professional_note(uuid, integer, text, text)', 'ce8a9d706cf9837bde578c77051a3a5f', false),
    ('revoke_dog_continuity_access(uuid)', 'cf9fb685fdfb1ee73b04ad7299f4b24a', false),
    ('save_my_calendar_service(uuid, text, text, numeric, integer, text, text, boolean)', '300a5db6f714554072c3f7d25fd6e4dd', false),
    ('save_my_reply_template(uuid, text, text, text)', 'a14fd105f1ec07acfec6b66e6f1ecf63', false),
    ('save_own_pass_template(uuid, integer, uuid, text, text, integer, numeric, integer)', '616a00464f1ec8bd60f57ab1b8ca9448', true),
    ('search_public_professionals(numeric, numeric, text, text, numeric, numeric)', 'cc021e01656897e8e6ec7e19d21cff59', false),
    ('search_sport_professionals(text, numeric, numeric, text, numeric, numeric)', '892e4d45d9d89802cf17d5cea7bed510', false),
    ('send_booking_message(uuid, uuid, text)', '4f2a57d9fc09d181d57d187a1636a6c0', false),
    ('set_my_booking_pause(boolean)', '21ff10f718c80f713e4857b7842644a8', false),
    ('set_my_professional_search_modes(boolean, boolean, text[])', '1a6daf040565e4af10b27f18197a0012', false),
    ('set_own_pass_template_active(uuid, integer, boolean)', '2afe317377397f08339204fb1a1a3491', true),
    ('submit_review(uuid, integer, text)', '7a3583bc6e97c77467a3656e00c3cb1a', false),
    ('withdraw_my_continuity_note(uuid)', 'ceb8e47b1b8c0fbba29b41ec27bf106f', false)
  ) AS reviewed(signature,source_md5,optional)
  LOOP
    oid_before := to_regprocedure('public.'||expected.signature);
    IF oid_before IS NULL THEN
      IF expected.optional THEN CONTINUE; END IF;
      RAISE EXCEPTION 'Required API missing: %',expected.signature;
    END IF;
    SELECT p.*,pg_get_function_arguments(p.oid) AS declared_args,
      pg_get_function_result(p.oid) AS declared_result,
      pg_get_userbyid(p.proowner) AS owner_name,obj_description(p.oid,'pg_proc') AS description INTO f
    FROM pg_catalog.pg_proc p WHERE p.oid=oid_before;
    IF NOT f.prosecdef OR f.prokind<>'f' OR f.provariadic<>0
      OR md5(f.prosrc)<>expected.source_md5 THEN
      RAISE EXCEPTION 'API implementation changed: %; review before migration',expected.signature;
    END IF;
    IF EXISTS(SELECT 1 FROM aclexplode(coalesce(f.proacl,acldefault('f',f.proowner))) WHERE grantee=0) THEN
      RAISE EXCEPTION 'Unexpected PUBLIC execute privilege: %',expected.signature;
    END IF;
    IF expected.optional THEN optional_count:=optional_count+1; END IF;
    SELECT oidvectortypes(f.proargtypes),
      (SELECT coalesce(string_agg('$'||i,', ' ORDER BY i),'') FROM generate_series(1,f.pronargs) i)
      INTO arg_types,call_args;
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET SCHEMA pc_private',f.proname,arg_types);
    EXECUTE format('ALTER FUNCTION pc_private.%I(%s) SET search_path = %L',f.proname,arg_types,'');
    EXECUTE format(
      'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER %s %s PARALLEL %s SET search_path = %L AS %L',
      f.proname,f.declared_args,f.declared_result,
      CASE f.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END,
      CASE WHEN f.proisstrict THEN 'STRICT' ELSE 'CALLED ON NULL INPUT' END,
      CASE f.proparallel WHEN 's' THEN 'SAFE' WHEN 'r' THEN 'RESTRICTED' ELSE 'UNSAFE' END,
      '',format('SELECT * FROM pc_private.%I(%s)',f.proname,call_args));
    EXECUTE format('ALTER FUNCTION public.%I(%s) OWNER TO %I',f.proname,arg_types,f.owner_name);
    EXECUTE format('COMMENT ON FUNCTION public.%I(%s) IS %L',f.proname,arg_types,f.description);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated, service_role',f.proname,arg_types);
    FOR permission IN
      SELECT pg_get_userbyid(grantee) AS role_name,is_grantable
      FROM aclexplode(coalesce(f.proacl,acldefault('f',f.proowner)))
      WHERE grantee<>0 AND privilege_type='EXECUTE'
    LOOP
      EXECUTE format('GRANT USAGE ON SCHEMA pc_private TO %I',permission.role_name);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO %I %s',
        f.proname,arg_types,permission.role_name,CASE WHEN permission.is_grantable THEN 'WITH GRANT OPTION' ELSE '' END);
    END LOOP;
  END LOOP;
  IF optional_count NOT IN (0,10) THEN RAISE EXCEPTION 'Incomplete optional lesson-pack API'; END IF;
END $move$;

-- The three public relations remain narrow projections, never base-table
-- access. Compare parsed definitions on this server before changing them.
DO $views$
DECLARE
  v record; prior record; col_list text; col_declarations text; permission record;
BEGIN
  FOR v IN SELECT * FROM (VALUES
    ('public_professional_profiles', $projection$SELECT p.id,
        CASE
            WHEN COALESCE(p.listing_type, 'individual'::text) = 'individual'::text THEN COALESCE(NULLIF(btrim(pr.full_name), ''::text), NULLIF(btrim(p.business_name), ''::text), 'Professionista PortaleCinofilo'::text)
            ELSE COALESCE(NULLIF(btrim(p.business_name), ''::text), NULLIF(btrim(pr.full_name), ''::text), 'Professionista PortaleCinofilo'::text)
        END AS display_name,
    pr.avatar_url,
    p.professional_type,
    p.bio,
    p.zone_text,
    p.coverage_radius_km,
    p.starting_price,
        CASE
            WHEN COALESCE(p.listing_type, 'individual'::text) = 'individual'::text THEN NULL::text
            ELSE p.cover_photo_url
        END AS cover_photo_url,
    p.rating,
    p.review_count,
    p.experience_start_year::integer AS experience_start_year,
    p.experience_verification_status = 'verified'::text AS experience_verified,
    p.professional_verification_status = 'verified'::text AS professional_verified
   FROM public.professionals p
     JOIN public.profiles pr ON pr.id = p.id
  WHERE p.approved = true AND p.approval_status = 'approved'::text$projection$),
    ('public_professional_sport_merit', $projection$WITH verified_sport AS (
         SELECT c.professional_id,
            lower(btrim(COALESCE(c.discipline, ''::text))) AS discipline_code,
            upper(regexp_replace(btrim(COALESCE(c.achievement, ''::text)), '\s+'::text, ''::text, 'g'::text)) AS level_code,
            NULLIF(btrim(c.dog_name), ''::text) AS dog_name,
            c.event_scope,
            c.placement,
            c.issued_at
           FROM public.professional_credentials c
             JOIN public.professionals p ON p.id = c.professional_id
          WHERE c.verification_status = 'verified'::text AND (c.credential_type = ANY (ARRAY['official_test'::text, 'sport_result'::text])) AND c.is_public = true AND p.approved = true AND p.approval_status = 'approved'::text
        ), aggregated AS (
         SELECT verified_sport.professional_id,
            max(
                CASE
                    WHEN verified_sport.discipline_code = 'igp'::text AND verified_sport.level_code = 'IGP3'::text THEN 3
                    WHEN verified_sport.discipline_code = 'igp'::text AND verified_sport.level_code = 'IGP2'::text THEN 2
                    WHEN verified_sport.discipline_code = 'igp'::text AND verified_sport.level_code = 'IGP1'::text THEN 1
                    ELSE 0
                END) AS highest_igp_level,
            max(
                CASE
                    WHEN verified_sport.discipline_code = 'igp'::text THEN 30
                    WHEN verified_sport.discipline_code = 'obedience'::text THEN 20
                    WHEN verified_sport.discipline_code = 'agility'::text THEN 10
                    ELSE 5
                END) AS discipline_priority,
            count(*)::integer AS verified_sport_results,
            count(DISTINCT lower(verified_sport.dog_name)) FILTER (WHERE verified_sport.dog_name IS NOT NULL)::integer AS verified_sport_dogs,
            max(
                CASE verified_sport.event_scope
                    WHEN 'world'::text THEN 50
                    WHEN 'international'::text THEN 40
                    WHEN 'national'::text THEN 30
                    WHEN 'regional'::text THEN 20
                    WHEN 'club'::text THEN 10
                    ELSE 0
                END) AS best_scope_priority,
            min(verified_sport.placement) FILTER (WHERE verified_sport.placement IS NOT NULL) AS best_placement,
            max(verified_sport.issued_at) AS latest_verified_sport_result
           FROM verified_sport
          GROUP BY verified_sport.professional_id
        )
 SELECT professional_id,
    highest_igp_level,
        CASE highest_igp_level
            WHEN 3 THEN 'gold'::text
            WHEN 2 THEN 'silver'::text
            WHEN 1 THEN 'bronze'::text
            ELSE NULL::text
        END AS honor_tier,
    discipline_priority,
    verified_sport_results,
    verified_sport_dogs,
    best_scope_priority,
    best_placement,
    latest_verified_sport_result
   FROM aggregated$projection$),
    ('public_reviews', $projection$SELECT r.id,
    r.professional_id,
    r.rating,
    r.comment,
    COALESCE(NULLIF(split_part(btrim(pr.full_name), ' '::text, 1), ''::text), 'Cliente'::text) AS reviewer_name,
    r.created_at
   FROM public.reviews r
     JOIN public.professionals p ON p.id = r.professional_id
     LEFT JOIN public.profiles pr ON pr.id = r.owner_id
  WHERE p.approved = true AND p.approval_status = 'approved'::text$projection$)
  ) AS reviewed(view_name,projection)
  LOOP
    SELECT c.oid,c.relowner,c.relacl,pg_get_userbyid(c.relowner) AS owner_name
      INTO STRICT prior FROM pg_catalog.pg_class c
      WHERE c.relnamespace='public'::regnamespace AND c.relname=v.view_name AND c.relkind='v';
    EXECUTE 'CREATE TEMP VIEW pc_expected_public_projection AS '||v.projection;
    IF pg_get_viewdef(prior.oid,false) IS DISTINCT FROM
       pg_get_viewdef('pg_temp.pc_expected_public_projection'::regclass,false) THEN
      RAISE EXCEPTION 'Public view changed: %; review before migration',v.view_name;
    END IF;
    DROP VIEW pg_temp.pc_expected_public_projection;
    SELECT string_agg(format('%I',a.attname),', ' ORDER BY a.attnum),
      string_agg(format('%I %s',a.attname,format_type(a.atttypid,a.atttypmod)),', ' ORDER BY a.attnum)
      INTO col_list,col_declarations FROM pg_catalog.pg_attribute a
      WHERE a.attrelid=prior.oid AND a.attnum>0 AND NOT a.attisdropped;
    EXECUTE format('CREATE FUNCTION pc_private.read_%I() RETURNS TABLE(%s) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = %L AS %L',
      v.view_name,col_declarations,'',v.projection);
    EXECUTE format('ALTER FUNCTION pc_private.read_%I() OWNER TO %I',v.view_name,prior.owner_name);
    EXECUTE format('REVOKE ALL ON FUNCTION pc_private.read_%I() FROM PUBLIC, anon, authenticated, service_role',v.view_name);
    FOR permission IN
      SELECT pg_get_userbyid(grantee) AS role_name
      FROM aclexplode(coalesce(prior.relacl,acldefault('r',prior.relowner)))
      WHERE grantee<>0 AND privilege_type='SELECT'
    LOOP
      EXECUTE format('GRANT USAGE ON SCHEMA pc_private TO %I',permission.role_name);
      EXECUTE format('GRANT EXECUTE ON FUNCTION pc_private.read_%I() TO %I',v.view_name,permission.role_name);
    END LOOP;
    IF EXISTS(SELECT 1 FROM aclexplode(coalesce(prior.relacl,acldefault('r',prior.relowner)))
      WHERE grantee=0 AND privilege_type='SELECT') THEN
      RAISE EXCEPTION 'Unexpected PUBLIC view grant: %',v.view_name;
    END IF;
    EXECUTE format('CREATE OR REPLACE VIEW public.%I WITH (security_invoker=true,security_barrier=true) AS SELECT %s FROM pc_private.read_%I()',
      v.view_name,col_list,v.view_name);
  END LOOP;
END $views$;

DO $verify$
BEGIN
  IF EXISTS(SELECT 1 FROM pg_catalog.pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prosecdef
    AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))) THEN
    RAISE EXCEPTION 'Unreviewed callable SECURITY DEFINER function remains in public';
  END IF;
END $verify$;
NOTIFY pgrst, 'reload schema';
COMMIT;
