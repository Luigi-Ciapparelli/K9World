CREATE OR REPLACE FUNCTION pg_temp.team_check(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAILED: %',message; END IF; END $$;
CREATE OR REPLACE FUNCTION pg_temp.team_reject(statement text,expected text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN EXECUTE statement;RAISE EXCEPTION 'Unexpected success: %',statement; EXCEPTION WHEN OTHERS THEN IF SQLSTATE<>expected THEN RAISE; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.team_check(boolean,text),pg_temp.team_reject(text,text) TO authenticated,anon,service_role;
CREATE TEMP TABLE hour_tokens(v uuid);INSERT INTO hour_tokens DEFAULT VALUES;GRANT SELECT,UPDATE ON hour_tokens TO authenticated;
CREATE TEMP TABLE hour_dates(d date,spring date,autumn date);
INSERT INTO hour_dates SELECT (now() AT TIME ZONE 'Europe/Rome')::date+7,
 make_date(extract(year FROM now())::int+1,3,31)-extract(dow FROM make_date(extract(year FROM now())::int+1,3,31))::int,
 make_date(extract(year FROM now())::int+1,10,31)-extract(dow FROM make_date(extract(year FROM now())::int+1,10,31))::int;
GRANT SELECT ON hour_dates TO authenticated;
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status)
SELECT ('e8310000-0000-0000-0005-'||lpad(n::text,12,'0'))::uuid,
'e8310000-0000-0000-0000-000000000007','e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0001-000000000006',
(d+CASE n WHEN 40 THEN time '08:00' WHEN 41 THEN time '09:00' WHEN 42 THEN time '11:00' WHEN 43 THEN time '10:30' ELSE time '12:00' END) AT TIME ZONE 'Europe/Rome',
(d+CASE n WHEN 40 THEN time '09:00' WHEN 41 THEN time '10:00' WHEN 42 THEN time '12:00' WHEN 43 THEN time '11:30' ELSE time '13:00' END) AT TIME ZONE 'Europe/Rome',
'pending' FROM generate_series(40,44)n CROSS JOIN hour_dates;
SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);
SELECT public.change_booking_status(id,'accepted') FROM public.bookings WHERE id::text IN (SELECT 'e8310000-0000-0000-0005-'||lpad(n::text,12,'0') FROM generate_series(40,44)n);
UPDATE hour_tokens SET v=(public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000040','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'09:00','11:00')->>'version')::uuid;
SELECT pg_temp.team_check((public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000040','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'09:00','11:00')->>'version')::uuid=(SELECT v FROM hour_tokens),'hourly retry stable');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000040','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'10:00','11:00')$q$,'40001');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off('e8310000-0000-0000-0009-000000000040','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),(SELECT d FROM hour_dates))$q$,'40001');
SELECT public.assign_booking_instructor_checked(id,'e8310000-0000-0000-0006-000000000020',NULL,true) FROM public.bookings WHERE id IN ('e8310000-0000-0000-0005-000000000040','e8310000-0000-0000-0005-000000000042','e8310000-0000-0000-0005-000000000044');
SELECT pg_temp.team_reject($q$SELECT public.assign_booking_instructor_checked('e8310000-0000-0000-0005-000000000041','e8310000-0000-0000-0006-000000000020',NULL,true)$q$,'PCX02');
SELECT pg_temp.team_reject($q$SELECT public.assign_booking_instructor('e8310000-0000-0000-0005-000000000043','e8310000-0000-0000-0006-000000000020')$q$,'PCX02');
SELECT pg_temp.team_check((public.get_instructor_time_off('e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),(SELECT d+1 FROM hour_dates))#>>'{0,affected_bookings}')::int=0,'touching endpoints do not count');
SELECT public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000041','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'12:00','13:00');
SELECT pg_temp.team_check((SELECT (x->>'affected_bookings')::int=1 AND x->>'start_time'='12:00:00' AND x->>'end_time'='13:00:00' FROM jsonb_array_elements(public.get_instructor_time_off('e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),(SELECT d+1 FROM hour_dates)))x WHERE x->>'id'='e8310000-0000-0000-0009-000000000041'),'only overlapped existing lesson counted');
SELECT pg_temp.team_check((public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000044']::uuid[])#>>'{0,instructor_unavailable}')::boolean,'centre warning for overlapping lesson');
SELECT pg_temp.team_check(NOT (public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000042']::uuid[])#>>'{0,instructor_unavailable}')::boolean,'adjacent lesson unblocked');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'16:00','14:00')$q$,'22023');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',current_date-1,'09:00','11:00')$q$,'22023');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',current_date+731,'09:00','11:00')$q$,'22023');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'09:00:30','11:00')$q$,'22023');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',(SELECT spring FROM hour_dates),'02:30','03:30')$q$,'PCX03');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',(SELECT autumn FROM hour_dates),'02:15','03:30')$q$,'PCX03');
SELECT public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000042','e8310000-0000-0000-0006-000000000020',(SELECT spring FROM hour_dates),'01:30','03:30');
SELECT public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000043','e8310000-0000-0000-0006-000000000020',(SELECT autumn FROM hour_dates),'01:30','03:30');
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000007',false);
SELECT pg_temp.team_check(NOT (public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000044']::uuid[])#>>'{0,instructor_unavailable}')::boolean,'absence hours not leaked to customer');
SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),'e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'14:00','15:00')$q$,'42501');
SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);
SELECT pg_temp.team_reject($q$SELECT public.cancel_instructor_time_off('e8310000-0000-0000-0009-000000000040',(SELECT v FROM hour_tokens))$q$,'42501');
SELECT public.add_instructor_time_off_hours('e8310000-0000-0000-0009-000000000044','e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),'18:00','19:00');
UPDATE hour_tokens SET v=(SELECT (x->>'version')::uuid FROM jsonb_array_elements(public.get_instructor_time_off('e8310000-0000-0000-0006-000000000020',(SELECT d FROM hour_dates),(SELECT d+1 FROM hour_dates)))x WHERE x->>'id'='e8310000-0000-0000-0009-000000000044');
SELECT pg_temp.team_reject($q$SELECT public.cancel_instructor_time_off('e8310000-0000-0000-0009-000000000044',gen_random_uuid())$q$,'40001');
SELECT public.cancel_instructor_time_off('e8310000-0000-0000-0009-000000000044',(SELECT v FROM hour_tokens));
SELECT public.cancel_instructor_time_off('e8310000-0000-0000-0009-000000000044',(SELECT v FROM hour_tokens));
RESET ROLE;SELECT set_config('request.jwt.claim.sub','',false);
SELECT pg_temp.team_check((SELECT count(*)=1 FROM pc_private.instructor_time_off_events WHERE period_id='e8310000-0000-0000-0009-000000000040'),'creation retry single audit');
SELECT pg_temp.team_check((SELECT count(*)=2 FROM pc_private.instructor_time_off_events WHERE period_id='e8310000-0000-0000-0009-000000000044'),'creation cancellation audit, no retry duplicates');
SELECT pg_temp.team_check((SELECT status='accepted' FROM public.bookings WHERE id='e8310000-0000-0000-0005-000000000044'),'existing lesson retained');
SELECT pg_temp.team_check((SELECT start_time IS NULL AND end_time IS NULL FROM pc_private.instructor_time_off WHERE id='e8310000-0000-0000-0009-000000000001'),'previous all-day API unchanged');
SET ROLE anon;SELECT pg_temp.team_reject($q$SELECT public.add_instructor_time_off_hours(gen_random_uuid(),gen_random_uuid(),current_date+1,'09:00','10:00')$q$,'42501');RESET ROLE;
SET ROLE service_role;SELECT pg_temp.team_reject('SELECT * FROM pc_private.instructor_time_off','42501');RESET ROLE;
