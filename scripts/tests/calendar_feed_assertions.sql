-- Synthetic fixture only; roll back the entire exercise. Never request a real user's feed.
CREATE FUNCTION pg_temp.cid(n int,g int DEFAULT 0) RETURNS uuid LANGUAGE sql AS $$
 SELECT ('ad210000-0000-0000-'||lpad(g::text,4,'0')||'-'||lpad(n::text,12,'0'))::uuid $$;
CREATE FUNCTION pg_temp.chk(b boolean,descr text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF b IS DISTINCT FROM true THEN RAISE EXCEPTION 'Calendar check: %',descr; END IF; END $$;
CREATE FUNCTION pg_temp.hash_token(t text) RETURNS text LANGUAGE sql AS $$ SELECT encode(sha256(convert_to(t,'UTF8')),'hex') $$;
GRANT EXECUTE ON FUNCTION pg_temp.cid(int,int),pg_temp.chk(boolean,text),pg_temp.hash_token(text) TO authenticated,service_role;
SELECT pg_temp.chk(NOT has_function_privilege('anon','public.my_calendar_version(text)','EXECUTE')
 AND NOT has_function_privilege('authenticated','public.read_personal_calendar_feed(text)','EXECUTE')
 AND NOT has_table_privilege('service_role','pc_private.calendar_connections','SELECT'),'privilege separation');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.cid(6)::text,true);
SELECT public.admin_approve_trainer(pg_temp.cid(n),public.admin_get_trainer_admission(pg_temp.cid(n))->>'token',pg_temp.cid(n,2),'CSEN',
 CASE n WHEN 1 THEN 'Persona 1' ELSE 'Istruttore qualificato del centro' END,true,true,'Controllo sintetico per il calendario',NULL) FROM generate_series(1,2) n;
RESET ROLE;
INSERT INTO public.bookings(id,professional_id,owner_id,service_id,start_at,end_at,price,status,notes)
SELECT pg_temp.cid(n,7),pg_temp.cid(2),pg_temp.cid(5),pg_temp.cid(2,1),now()+n*interval '1 day',now()+n*interval '1 day'+interval '45 min',35,
 CASE n WHEN 7 THEN 'pending' ELSE 'accepted' END,'PRIVATE-SENTINEL' FROM generate_series(6,7) n;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.cid(5)::text,true);
SELECT pg_temp.chk(public.my_calendar_version('google') IS NULL,'opt in only');
SELECT set_config('test.owner_feed',public.change_my_calendar_connection('google',NULL,true)->>'token',true);
SELECT set_config('test.owner_old',current_setting('test.owner_feed'),true);
SELECT set_config('test.apple',public.change_my_calendar_connection('apple',NULL,true)->>'token',true);
SELECT set_config('request.jwt.claim.sub',pg_temp.cid(2)::text,true);
SELECT set_config('test.pro_feed',public.change_my_calendar_connection('outlook',NULL,true)->>'token',true);
SELECT public.save_my_manual_appointment(pg_temp.cid(8,8),0,pg_temp.cid(2,1),current_date+10,'12:00','PRIVATE-SENTINEL',NULL);
SELECT public.add_my_time_off(pg_temp.cid(9,8),current_date+14,current_date+15,'PRIVATE-SENTINEL');
SELECT set_config('request.jwt.claim.sub',pg_temp.cid(4)::text,true);
SELECT set_config('test.other',public.change_my_calendar_connection('samsung',NULL,true)->>'token',true);
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT pg_temp.chk(public.read_personal_calendar_feed(repeat('f',64)) IS NULL,'unknown hash');
SELECT pg_temp.chk(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.other')))='[]'::jsonb,'other activity isolated');
SELECT pg_temp.chk((SELECT jsonb_array_length(j)=2 AND j::text NOT LIKE '%PRIVATE-SENTINEL%' AND NOT EXISTS(
 SELECT 1 FROM jsonb_array_elements(j) x WHERE x->>'kind'='unavailable' OR x ?| ARRAY['owner','dog','notes','email','price','token'])
 FROM public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.owner_feed'))) j),'owner has only confirmed online appointments');
SELECT pg_temp.chk((SELECT jsonb_array_length(j)=3 AND j::text NOT LIKE '%PRIVATE-SENTINEL%' AND EXISTS(
 SELECT 1 FROM jsonb_array_elements(j) x WHERE x->>'kind'='unavailable' AND (x->>'dayTo')::date=(x->>'dayFrom')::date+2)
 FROM public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.pro_feed'))) j),'centre includes manual and exclusive-end closure');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.cid(5)::text,true);
DO $$ BEGIN PERFORM public.change_my_calendar_connection('google',NULL,true); RAISE EXCEPTION 'stale version accepted'; EXCEPTION WHEN serialization_failure THEN NULL; END $$;
SELECT set_config('test.owner_feed',public.change_my_calendar_connection('google',public.my_calendar_version('google'),true)->>'token',true);
SELECT public.change_my_calendar_connection('google',public.my_calendar_version('google'),false);
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT pg_temp.chk(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.owner_old'))) IS NULL AND
 public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.owner_feed'))) IS NULL AND
 public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.apple'))) IS NOT NULL,'rotation and revocation scoped to one app');
RESET ROLE;
INSERT INTO pc_private.centre_instructors(id,centre_id,display_name) VALUES(pg_temp.cid(3,8),pg_temp.cid(2),'Coach');
INSERT INTO pc_private.centre_memberships(id,centre_id,instructor_id,account_id,status,instructor_name,account_name,accepted_at)
VALUES(pg_temp.cid(1,4),pg_temp.cid(2),pg_temp.cid(3,8),pg_temp.cid(4),'active','Coach','Member',now());
INSERT INTO pc_private.booking_instructors(booking_id,centre_id,instructor_id,name_at_assignment) VALUES(pg_temp.cid(6,7),pg_temp.cid(2),pg_temp.cid(3,8),'Coach');
SELECT pg_temp.chk(jsonb_array_length(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.other'))))=1,'only assigned lesson, no centre closure or manual item');
UPDATE pc_private.centre_memberships SET status='revoked' WHERE id=pg_temp.cid(1,4);
SELECT pg_temp.chk(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.other')))='[]'::jsonb,'membership revocation removes lesson');
SELECT set_config('test.event_uid',(SELECT x->>'uid' FROM jsonb_array_elements(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.pro_feed')))) x WHERE (x->>'start')::date=(now()+interval '6 days')::date),true);
UPDATE public.bookings SET start_at=start_at+interval '1 hour',end_at=end_at+interval '1 hour' WHERE id=pg_temp.cid(6,7);
SELECT pg_temp.chk(EXISTS(SELECT 1 FROM jsonb_array_elements(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.pro_feed')))) x WHERE x->>'uid'=current_setting('test.event_uid') AND (x->>'start')::timestamptz=(SELECT start_at FROM public.bookings WHERE id=pg_temp.cid(6,7))),'reschedule keeps UID and changes time');
UPDATE public.bookings SET status='cancelled' WHERE id=pg_temp.cid(6,7);
SELECT pg_temp.chk(NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.pro_feed')))) x WHERE x->>'uid'=current_setting('test.event_uid')),'cancelled event removed');
UPDATE public.professionals SET approved=false,approval_status='pending' WHERE id=pg_temp.cid(2);
SELECT pg_temp.chk(public.read_personal_calendar_feed(pg_temp.hash_token(current_setting('test.pro_feed'))) IS NULL,'approval revocation invalidates refresh');
