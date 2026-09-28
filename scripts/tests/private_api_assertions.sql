SET search_path=public;
CREATE FUNCTION pg_temp.api_ok(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'TEST FAILED: %',message; END IF; END $$;
CREATE FUNCTION pg_temp.api_denied(statement text,expected text DEFAULT '42501') RETURNS void LANGUAGE plpgsql AS $$
BEGIN EXECUTE statement; RAISE EXCEPTION 'TEST FAILED: operation succeeded: %',statement;
EXCEPTION WHEN OTHERS THEN IF sqlstate<>expected THEN RAISE; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.api_ok(boolean,text),pg_temp.api_denied(text,text) TO anon,authenticated;
SELECT pg_temp.api_ok((SELECT count(*) IN (50,60) FROM pc_api_functions_before),'unexpected API count');
DO $$ DECLARE old record; fn record; impl record; actor text; BEGIN
 FOR old IN SELECT * FROM pc_api_functions_before LOOP
  SELECT * INTO STRICT fn FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname=old.proname AND proargtypes=old.proargtypes;
  SELECT * INTO STRICT impl FROM pg_proc WHERE oid=old.oid;
  PERFORM pg_temp.api_ok(NOT fn.prosecdef AND impl.prosecdef AND impl.pronamespace='pc_private'::regnamespace,'API boundary '||old.proname);
  PERFORM pg_temp.api_ok(impl.prosrc=old.prosrc AND impl.proowner=old.proowner,'implementation/owner changed '||old.proname);
  PERFORM pg_temp.api_ok(pg_get_function_arguments(fn.oid)=old.args AND pg_get_function_result(fn.oid)=old.result
   AND fn.proowner=old.proowner AND fn.proretset=old.proretset AND fn.provolatile=old.provolatile
   AND fn.proisstrict=old.proisstrict AND fn.proparallel=old.proparallel
   AND fn.proargnames IS NOT DISTINCT FROM old.proargnames AND fn.proargmodes IS NOT DISTINCT FROM old.proargmodes,'API contract changed '||old.proname);
  PERFORM pg_temp.api_ok(fn.proconfig @> ARRAY['search_path=""'] AND impl.proconfig @> ARRAY['search_path=""'],'mutable search path');
  PERFORM pg_temp.api_ok(has_function_privilege('anon',fn.oid,'EXECUTE')=old.anon
    AND has_function_privilege('authenticated',fn.oid,'EXECUTE')=old.authenticated
    AND has_function_privilege('service_role',fn.oid,'EXECUTE')=old.service_role,'API privilege changed '||old.proname);
 END LOOP;
END $$;
SELECT pg_temp.api_ok(NOT EXISTS(SELECT 1 FROM pc_api_relation_permissions b JOIN pg_class c USING(oid)
 WHERE b.relacl IS DISTINCT FROM c.relacl OR b.relowner<>c.relowner OR b.relrowsecurity<>c.relrowsecurity
 OR b.relforcerowsecurity<>c.relforcerowsecurity),'table/view grants or RLS changed');
SELECT pg_temp.api_ok(NOT EXISTS(SELECT * FROM pg_policy EXCEPT SELECT * FROM pc_api_policies_before)
 AND NOT EXISTS(SELECT * FROM pc_api_policies_before EXCEPT SELECT * FROM pg_policy),'policy expressions or dependencies changed');
SELECT pg_temp.api_ok((SELECT count(*)=3 FROM pg_class WHERE relnamespace='public'::regnamespace AND relkind='v'
 AND relname IN ('public_reviews','public_professional_profiles','public_professional_sport_merit')
 AND reloptions @> ARRAY['security_invoker=true','security_barrier=true']),'view options');
SELECT pg_temp.api_ok(NOT has_schema_privilege('anon','pc_private','CREATE')
 AND NOT has_schema_privilege('authenticated','pc_private','CREATE'),'private schema allows client DDL');
CREATE FUNCTION pc_private.test_default_acl() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
SELECT pg_temp.api_ok(NOT has_function_privilege('anon','pc_private.test_default_acl()','EXECUTE')
 AND NOT has_function_privilege('authenticated','pc_private.test_default_acl()','EXECUTE'),'new private function exposed');
DROP FUNCTION pc_private.test_default_acl();

BEGIN;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.api_ok((SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.public_professional_profiles v)
 IS NOT DISTINCT FROM (SELECT rows FROM pc_api_public_rows WHERE view_name='public_professional_profiles'),'public profile rows changed');
SELECT pg_temp.api_ok((SELECT jsonb_agg(to_jsonb(v) ORDER BY professional_id) FROM public.public_professional_sport_merit v)
 IS NOT DISTINCT FROM (SELECT rows FROM pc_api_public_rows WHERE view_name='public_professional_sport_merit'),'public merit rows changed');
SELECT pg_temp.api_ok((SELECT jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.public_reviews v)
 IS NOT DISTINCT FROM (SELECT rows FROM pc_api_public_rows WHERE view_name='public_reviews'),'public review rows changed');
SELECT pg_temp.api_ok((SELECT count(*)=1 FROM public.public_professional_profiles WHERE id::text LIKE 'f000%'),'pending professional exposed');
SELECT pg_temp.api_ok((SELECT verified_sport_results=1 FROM public.public_professional_sport_merit WHERE professional_id='f0000000-0000-0000-0000-000000000002'),'private credentials exposed');
SELECT pg_temp.api_ok((SELECT reviewer_name='Maria' AND NOT (to_jsonb(v) ? 'owner_id') FROM public.public_reviews v WHERE id='f0000000-0000-0000-0000-000000000301'),'review exposes owner data');
SELECT pg_temp.api_denied('SELECT * FROM public.profiles');
SELECT pg_temp.api_denied('SELECT * FROM public.professionals');
SELECT pg_temp.api_denied('SELECT * FROM public.reviews');
SELECT pg_temp.api_denied('SELECT * FROM public.professional_note_revisions');
SELECT pg_temp.api_denied('SELECT * FROM pc_private.get_professional_bookings()');
SELECT pg_temp.api_denied('SELECT pc_private.is_admin()');
SELECT pg_temp.api_denied('SELECT public.is_admin()');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','f0000000-0000-0000-0000-000000000004',true);
SELECT pg_temp.api_ok((SELECT count(*)=1 FROM public.profiles),'owner reads other profiles');
SELECT pg_temp.api_ok(NOT public.is_admin() AND NOT pc_private.is_admin(),'owner admin escalation');
SELECT pg_temp.api_denied($q$SELECT public.admin_set_professional_approval('f0000000-0000-0000-0000-000000000003','approved')$q$,'P0001');
SELECT pg_temp.api_denied($q$SELECT pc_private.admin_set_professional_approval('f0000000-0000-0000-0000-000000000003','approved')$q$,'P0001');
SELECT pg_temp.api_denied('SELECT * FROM public.get_professional_bookings()');
SELECT set_config('request.jwt.claim.sub','f0000000-0000-0000-0000-000000000002',true);
SELECT pg_temp.api_ok((SELECT client_name='Maria CognomePrivato' AND notes='NOTA PRIVATA' FROM public.get_professional_bookings() WHERE id='f0000000-0000-0000-0000-000000000201'),'professional loses booking details');
SELECT set_config('request.jwt.claim.sub','f0000000-0000-0000-0000-000000000001',true);
SELECT pg_temp.api_ok(public.is_admin(),'admin not recognized');
SELECT public.admin_set_professional_approval('f0000000-0000-0000-0000-000000000003','approved');
SELECT pg_temp.api_ok((SELECT count(*)=2 FROM public.public_professional_profiles WHERE id::text LIKE 'f000%'),'admin approval broken');
RESET ROLE;
ROLLBACK;
BEGIN;
DELETE FROM auth.users WHERE id::text LIKE 'f0000000-%';
DROP TABLE pc_api_functions_before,pc_api_relation_permissions,pc_api_policies_before,pc_api_public_rows;
COMMIT;
