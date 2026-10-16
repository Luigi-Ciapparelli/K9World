CREATE OR REPLACE FUNCTION pg_temp.team_check(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAILED: %',message; END IF; END $$;
CREATE OR REPLACE FUNCTION pg_temp.team_reject(statement text,expected text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN EXECUTE statement;RAISE EXCEPTION 'Unexpected success: %',statement; EXCEPTION WHEN OTHERS THEN IF SQLSTATE<>expected THEN RAISE; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.team_check(boolean,text),pg_temp.team_reject(text,text) TO authenticated,anon,service_role;
CREATE TEMP TABLE permission_tokens(m uuid,a uuid);INSERT INTO permission_tokens DEFAULT VALUES;GRANT SELECT,UPDATE ON permission_tokens TO authenticated;
-- Separate person and instructor from the earlier concurrency fixtures.
INSERT INTO pc_private.centre_instructors(id,centre_id,display_name,active) VALUES('e8310000-0000-0000-0006-000000000020','e8310000-0000-0000-0000-000000000006','Istruttore delegato',true);
INSERT INTO pc_private.centre_memberships(id,centre_id,instructor_id,account_id,status,instructor_name,account_name,accepted_at)
VALUES('e8310000-0000-0000-0007-000000000020','e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0006-000000000020','e8310000-0000-0000-0000-000000000004','active','Istruttore delegato','Persona Quattro',now()-interval '2 days');
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status,notes)
SELECT ('e8310000-0000-0000-0005-'||lpad(n::text,12,'0'))::uuid,
 CASE WHEN n=23 THEN 'e8310000-0000-0000-0000-000000000004'::uuid ELSE 'e8310000-0000-0000-0000-000000000007'::uuid END,
 'e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0001-000000000006',
 now()+CASE WHEN n=21 THEN interval '2 hours' WHEN n=24 THEN interval '-3 days' ELSE interval '-3 hours' END,
 now()+CASE WHEN n=21 THEN interval '3 hours' WHEN n=24 THEN interval '-3 days 1 hour' ELSE interval '-2 hours' END,
 'pending','Private note never delegated' FROM generate_series(20,25) n;
SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);
SELECT public.change_booking_status(id,'accepted') FROM public.bookings WHERE id::text IN (SELECT 'e8310000-0000-0000-0005-'||lpad(n::text,12,'0') FROM generate_series(20,25)n);
SELECT public.assign_booking_instructor_checked(id,'e8310000-0000-0000-0006-000000000020',NULL,true) FROM public.bookings WHERE id::text IN (SELECT 'e8310000-0000-0000-0005-'||lpad(n::text,12,'0') FROM generate_series(20,25)n WHERE n<>22);
UPDATE permission_tokens SET m=(SELECT (x->>'version')::uuid FROM jsonb_array_elements(public.get_my_centre_memberships()) x WHERE x->>'id'='e8310000-0000-0000-0007-000000000020');
UPDATE permission_tokens SET a=(SELECT (x->>'version')::uuid FROM jsonb_array_elements(public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000020']::uuid[])) x);
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);
SELECT pg_temp.team_check((SELECT bool_and(NOT (x->>'can_complete')::boolean) FROM jsonb_array_elements(public.get_my_centre_lessons(now()-interval '1 day',now()+interval '1 day')->'items') x),'permission defaults to false');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000020','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),(SELECT a FROM permission_tokens))$q$,'42501');
SELECT pg_temp.team_reject($q$SELECT public.set_centre_lesson_permission('e8310000-0000-0000-0007-000000000020',true,(SELECT m FROM permission_tokens))$q$,'42501');
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);
UPDATE permission_tokens SET m=(public.set_centre_lesson_permission('e8310000-0000-0000-0007-000000000020',true,m)->>'version')::uuid;
SELECT pg_temp.team_check((public.set_centre_lesson_permission('e8310000-0000-0000-0007-000000000020',true,m)->>'version')::uuid=m,'same permission no duplicate audit') FROM permission_tokens;
SELECT pg_temp.team_reject($q$SELECT public.set_centre_lesson_permission('e8310000-0000-0000-0007-000000000020',false,gen_random_uuid())$q$,'40001');
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);
SELECT pg_temp.team_check((SELECT (x->>'can_complete')::boolean FROM jsonb_array_elements(public.get_my_centre_lessons(now()-interval '1 day',now()+interval '1 day')->'items')x WHERE x->>'id'='e8310000-0000-0000-0005-000000000020'),'only assigned ended lesson enabled');
SELECT pg_temp.team_check((SELECT bool_and(NOT (x->>'can_complete')::boolean) FROM jsonb_array_elements(public.get_my_centre_lessons(now()-interval '1 day',now()+interval '1 day')->'items')x WHERE x->>'id' IN ('e8310000-0000-0000-0005-000000000021','e8310000-0000-0000-0005-000000000023')),'future and own customer booking disabled');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000020','e8310000-0000-0000-0007-000000000020',gen_random_uuid(),(SELECT a FROM permission_tokens))$q$,'40001');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000020','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),gen_random_uuid())$q$,'40001');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000022','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),gen_random_uuid())$q$,'42501');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000023','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),gen_random_uuid())$q$,'42501');
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000024','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),gen_random_uuid())$q$,'42501');
SELECT pg_temp.team_reject($q$SELECT public.change_booking_status('e8310000-0000-0000-0005-000000000020','completed')$q$,'42501');
SELECT pg_temp.team_check(NOT (public.get_my_centre_lessons(now()-interval '1 day',now()+interval '1 day')#>'{items,0}') ?| ARRAY['notes','phone','email','price'],'minimal data retained');
SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000020','e8310000-0000-0000-0007-000000000020',m,a) FROM permission_tokens;
SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000020','e8310000-0000-0000-0007-000000000020',m,a) FROM permission_tokens;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','',false);
SELECT pg_temp.team_check((SELECT count(*)=1 FROM pc_private.centre_lesson_completions WHERE booking_id='e8310000-0000-0000-0005-000000000020' AND actor_id='e8310000-0000-0000-0000-000000000004'),'actor recorded once');
SELECT pg_temp.team_check((SELECT count(*)=1 FROM pc_private.service_review_threads WHERE latest_booking_id='e8310000-0000-0000-0005-000000000020' AND review_scope='booking_service'),'per-lesson review created once');
UPDATE permission_tokens SET a=(SELECT version FROM pc_private.booking_instructors WHERE booking_id='e8310000-0000-0000-0005-000000000021');
SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000021','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),(SELECT a FROM permission_tokens))$q$,'PCR01');
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);
SELECT pg_temp.team_check(public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000020']::uuid[])#>>'{0,completed_by}' IS NOT NULL,'centre sees actor');
UPDATE permission_tokens SET m=(public.set_centre_lesson_permission('e8310000-0000-0000-0007-000000000020',false,m)->>'version')::uuid;
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);
SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson('e8310000-0000-0000-0005-000000000021','e8310000-0000-0000-0007-000000000020',(SELECT m FROM permission_tokens),(SELECT a FROM permission_tokens))$q$,'42501');
SELECT pg_temp.team_check(jsonb_array_length(public.get_my_centre_lessons(now()-interval '1 day',now()+interval '1 day')->'items')>0,'removing permission preserves agenda');
SELECT pg_temp.team_reject('SELECT * FROM pc_private.centre_lesson_completions','42501');
RESET ROLE;SELECT set_config('request.jwt.claim.sub','',false);
SELECT pg_temp.team_check((SELECT relrowsecurity FROM pg_class WHERE oid='pc_private.centre_lesson_completions'::regclass),'RLS enabled');
SET ROLE anon;SELECT pg_temp.team_reject($q$SELECT public.complete_assigned_centre_lesson(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid())$q$,'42501');RESET ROLE;
SET ROLE service_role;SELECT pg_temp.team_reject('SELECT * FROM pc_private.centre_lesson_completions','42501');RESET ROLE;
