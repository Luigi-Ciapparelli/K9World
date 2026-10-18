BEGIN;
CREATE FUNCTION pg_temp.check_ok(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Failed: %',label; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.check_ok(boolean,text) TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
SELECT ('bd720000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'booking'||n||'@example.invalid',now(),
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN(1,2) THEN 'professional' ELSE 'owner' END,
 'full_name','Partecipante test '||n,'professional_type','trainer') FROM generate_series(1,5) n;
UPDATE auth.users SET email_confirmed_at=NULL WHERE id='bd720000-0000-0000-0000-000000000005';
INSERT INTO public.services(id,professional_id,name,service_type,price,duration_minutes)
VALUES('bd720000-0000-0000-0001-000000000001','bd720000-0000-0000-0000-000000000001','Lezione registrata','trainer',35,60);
INSERT INTO public.bookings(id,professional_id,owner_id,service_id,status,start_at,end_at,price,notes)
SELECT ('bd720000-0000-0000-0002-'||lpad(n::text,12,'0'))::uuid,'bd720000-0000-0000-0000-000000000001',
 'bd720000-0000-0000-0000-000000000003','bd720000-0000-0000-0001-000000000001','pending',
 now()-interval '2 days',now()-interval '2 days'+interval '1 hour',35,'Nota richiesta' FROM generate_series(1,3) n;
UPDATE public.bookings SET status='accepted' WHERE id='bd720000-0000-0000-0002-000000000001';
UPDATE public.services SET name='Nuovo nome di catalogo' WHERE id='bd720000-0000-0000-0001-000000000001';
INSERT INTO public.dogs(id,owner_id,name,breed) VALUES
 ('bd720000-0000-0000-0003-000000000001','bd720000-0000-0000-0000-000000000003','Cane prenotato','Meticcio / altra razza'),
 ('bd720000-0000-0000-0003-000000000002','bd720000-0000-0000-0000-000000000003','Altro cane privato','Meticcio / altra razza'),
 ('bd720000-0000-0000-0003-000000000003','bd720000-0000-0000-0000-000000000004','Nome privato nuovo proprietario','Meticcio / altra razza');
INSERT INTO public.booking_dogs(booking_id,dog_id) VALUES
 ('bd720000-0000-0000-0002-000000000001','bd720000-0000-0000-0003-000000000001'),
 ('bd720000-0000-0000-0002-000000000001','bd720000-0000-0000-0003-000000000003'),
 ('bd720000-0000-0000-0002-000000000002','bd720000-0000-0000-0003-000000000001');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bd720000-0000-0000-0000-000000000001',true);
DO $$ DECLARE r record; BEGIN
 SELECT * INTO r FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001']::uuid[]);
 PERFORM pg_temp.check_ok(r.service_name='Lezione registrata' AND r.service_source='recorded','recorded service survives catalogue rename');
 PERFORM pg_temp.check_ok(r.dog_names=ARRAY['Cane prenotato']::text[] AND r.dogs_unavailable,'only booked dogs still owned by booking owner');
 PERFORM pg_temp.check_ok(r.end_at IS NOT NULL,'scheduled end included');
 SELECT * INTO r FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000002']::uuid[]);
 PERFORM pg_temp.check_ok(r.service_name='Nuovo nome di catalogo' AND r.service_source='catalogue','pending booking uses current catalogue');
 PERFORM pg_temp.check_ok((SELECT count(*)=1 FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001','bd720000-0000-0000-0002-000000000001']::uuid[])),'duplicates do not multiply rows');
 PERFORM pg_temp.check_ok((SELECT count(*)=0 FROM public.get_booking_details(ARRAY[]::uuid[])),'empty batch');
 PERFORM pg_temp.check_ok((SELECT count(*)=0 FROM public.get_booking_details(ARRAY[gen_random_uuid()])),'unknown ID');
 BEGIN PERFORM public.get_booking_details(NULL); RAISE EXCEPTION 'null input accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_booking_details(ARRAY[NULL]::uuid[]); RAISE EXCEPTION 'null ID accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_booking_details(array_fill(gen_random_uuid(),ARRAY[101])); RAISE EXCEPTION 'large batch accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claim.sub','bd720000-0000-0000-0000-000000000003',true);
SELECT pg_temp.check_ok((SELECT count(*)=2 FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001','bd720000-0000-0000-0002-000000000002']::uuid[])),'owner reads context');
SELECT set_config('request.jwt.claim.sub','bd720000-0000-0000-0000-000000000002',true);
SELECT pg_temp.check_ok((SELECT count(*)=0 FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001']::uuid[])),'other professional denied');
SELECT set_config('request.jwt.claim.sub','bd720000-0000-0000-0000-000000000004',true);
SELECT pg_temp.check_ok((SELECT count(*)=0 FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001']::uuid[])),'new dog owner cannot read former owner booking');
DO $$ DECLARE actor text; BEGIN
 FOREACH actor IN ARRAY ARRAY['','bd720000-0000-0000-0000-000000000005'] LOOP
  PERFORM set_config('request.jwt.claim.sub',actor,true);
  BEGIN PERFORM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001']::uuid[]); RAISE EXCEPTION 'unconfirmed actor accepted'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
END $$;
RESET ROLE;
DELETE FROM public.services WHERE id='bd720000-0000-0000-0001-000000000001';
DELETE FROM public.dogs WHERE id='bd720000-0000-0000-0003-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','bd720000-0000-0000-0000-000000000001',true);
SELECT pg_temp.check_ok((SELECT service_name='Lezione registrata' AND service_source='recorded' AND cardinality(dog_names)=0
 FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000001']::uuid[])),'snapshot retained, deleted dog not invented');
SELECT pg_temp.check_ok((SELECT service_source='unavailable' FROM public.get_booking_details(ARRAY['bd720000-0000-0000-0002-000000000002']::uuid[])),'missing service without snapshot');
RESET ROLE;
SELECT pg_temp.check_ok(NOT has_function_privilege('anon','public.get_booking_details(uuid[])','EXECUTE')
 AND NOT has_function_privilege('service_role','pc_private.get_booking_details(uuid[])','EXECUTE')
 AND NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.get_booking_details(uuid[])'::regprocedure)
 AND (SELECT prosecdef AND proconfig=ARRAY['search_path=""'] FROM pg_proc WHERE oid='pc_private.get_booking_details(uuid[])'::regprocedure),'private API boundary');
SELECT pg_temp.check_ok((SELECT proargnames=ARRAY['p_booking_ids','booking_id','end_at','service_name','service_source','dog_names','dogs_unavailable'] FROM pg_proc WHERE oid='public.get_booking_details(uuid[])'::regprocedure),'minimal projection');
ROLLBACK;
