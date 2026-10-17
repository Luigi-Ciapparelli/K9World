-- Synthetic fixtures only. All rows are rolled back.
BEGIN;
CREATE FUNCTION pg_temp.check_ok(ok boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'Failed: %',label; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.check_ok(boolean,text) TO authenticated;
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data)
SELECT ('ea710000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 'analytics'||n||'@example.invalid',now(),
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n<=2 OR n=6 THEN 'professional' ELSE 'owner' END,
 'full_name','Analytics synthetic '||n,'professional_type','trainer')
FROM generate_series(1,7) n;
UPDATE public.profiles SET role='admin' WHERE id='ea710000-0000-0000-0000-000000000007';
UPDATE auth.users SET email_confirmed_at=NULL WHERE id='ea710000-0000-0000-0000-000000000006';
INSERT INTO public.services(id,professional_id,service_type,name,price,active)
SELECT ('ea710000-0000-0000-0001-'||lpad(n::text,12,'0'))::uuid,
 'ea710000-0000-0000-0000-000000000001','trainer','Current service '||n,99,true
FROM generate_series(1,6) n;

INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status,price,notes)
SELECT ('ea710000-0000-0000-0002-'||lpad(n::text,12,'0'))::uuid,
 ('ea710000-0000-0000-0000-'||lpad((CASE WHEN n<=1000 THEN 3 WHEN n=1001 THEN 4 ELSE 5 END)::text,12,'0'))::uuid,
 'ea710000-0000-0000-0000-000000000001',
 ('ea710000-0000-0000-0001-'||lpad(((n-1)%6+1)::text,12,'0'))::uuid,
 '2026-06-01 00:00 Europe/Rome'::timestamptz+(n-1)*interval '1 minute',
 '2026-06-01 01:00 Europe/Rome'::timestamptz+(n-1)*interval '1 minute',
 'completed',CASE WHEN n<=1100 THEN 2.5 WHEN n=1101 THEN 0 WHEN n=1102 THEN NULL WHEN n=1103 THEN -1 WHEN n=1104 THEN 'NaN'::numeric ELSE 'Infinity'::numeric END,
 'Private note must never leave the server'
FROM generate_series(1,1105) n;
INSERT INTO pc_private.review_experiences(booking_id,service_type,individual,service_id,service_name,context_captured_at)
SELECT b.id,'trainer',true,b.service_id,
 CASE WHEN b.service_id IN ('ea710000-0000-0000-0001-000000000002','ea710000-0000-0000-0001-000000000003') THEN 'Same service name'
 ELSE 'Historical service '||right(b.service_id::text,1) END,now()
FROM public.bookings b WHERE b.professional_id='ea710000-0000-0000-0000-000000000001';
-- Renaming/deleting a service must not merge distinct historical services.
UPDATE public.services SET name='New misleading name' WHERE professional_id='ea710000-0000-0000-0000-000000000001';
DELETE FROM public.services WHERE id='ea710000-0000-0000-0001-000000000001';
INSERT INTO public.bookings(owner_id,professional_id,status,start_at,end_at,price)
SELECT 'ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000001',
 CASE WHEN n<=4 THEN 'pending' WHEN n<=7 THEN 'accepted' WHEN n<=9 THEN 'declined' ELSE 'cancelled' END,
 '2026-06-15 12:00Z','2026-06-15 13:00Z',99999
FROM generate_series(1,10) n;
-- Another activity and two outside-range bookings are not counted.
INSERT INTO public.bookings(owner_id,professional_id,status,start_at,end_at,price) VALUES
 ('ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000002','completed','2026-06-15 12:00Z','2026-06-15 13:00Z',987654),
 ('ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000001','completed','2026-05-31 21:59:59.999Z','2026-06-01 01:00Z',10000),
 ('ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000001','completed','2026-06-30 22:00Z','2026-07-01 01:00Z',10000);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ea710000-0000-0000-0000-000000000001',true);
DO $$ DECLARE r jsonb; BEGIN
 r:=public.get_professional_activity_summary('2026-06-01','2026-06-30');
 PERFORM pg_temp.check_ok((r->>'total')::int=1115 AND (r->>'completed')::int=1105,'complete aggregation beyond API row limit');
 PERFORM pg_temp.check_ok((r->>'completed_value')::numeric=2750 AND (r->>'missing_prices')::int=4,'finite nonnegative booking prices only; real zero retained');
 PERFORM pg_temp.check_ok((r->>'pending')::int=4 AND (r->>'accepted')::int=3 AND (r->>'declined')::int=2 AND (r->>'cancelled')::int=1,'distinct states');
 PERFORM pg_temp.check_ok((r->>'customers')::int=3 AND (r->>'returning_customers')::int=2 AND (r->>'returning_percent')::numeric=66.7,'all clients form the denominator');
 PERFORM pg_temp.check_ok((r->>'service_groups')::int=6 AND jsonb_array_length(r->'top_services')=5,'same names do not merge and five is not the global count');
 PERFORM pg_temp.check_ok(r->'top_services'->0->>'name'='Historical service 1','deleted service snapshot preserved');
 PERFORM pg_temp.check_ok(r::text NOT LIKE '%ea710000%' AND r::text NOT LIKE '%Private note%' AND r::text NOT LIKE '%Analytics synthetic%','no client ids, names, notes or booking ids');
 r:=public.get_professional_activity_summary('2026-02-01','2026-02-28');
 PERFORM pg_temp.check_ok((r->>'total')::int=0 AND r->>'returning_percent' IS NULL AND r->'top_services'='[]'::jsonb,'empty period is not a fabricated zero-percent rate');
 BEGIN PERFORM public.get_professional_activity_summary(NULL,'2026-01-01'); RAISE EXCEPTION 'NULL accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_professional_activity_summary('2026-06-30','2026-06-01'); RAISE EXCEPTION 'Reverse accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_professional_activity_summary('2024-01-01','2025-01-01'); RAISE EXCEPTION '367 days accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN PERFORM public.get_professional_activity_summary('2024-01-01','infinity'); RAISE EXCEPTION 'Infinity accepted'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 PERFORM public.get_professional_activity_summary('2024-01-01','2024-12-31');
END $$;
SELECT set_config('request.jwt.claim.sub','ea710000-0000-0000-0000-000000000002',true);
SELECT pg_temp.check_ok((public.get_professional_activity_summary('2026-06-01','2026-06-30')->>'completed')::int=1,'other professional sees only own activity');
-- Authenticated without identity, owner, admin and unconfirmed professional are rejected.
DO $$ DECLARE actor text; BEGIN
 FOREACH actor IN ARRAY ARRAY['','ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000007','ea710000-0000-0000-0000-000000000006'] LOOP
  PERFORM set_config('request.jwt.claim.sub',actor,true);
  BEGIN PERFORM public.get_professional_activity_summary('2026-06-01','2026-06-30'); RAISE EXCEPTION 'Unauthorized reader'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
END $$;
RESET ROLE;
SELECT pg_temp.check_ok(NOT has_function_privilege('anon','public.get_professional_activity_summary(date,date)','EXECUTE')
 AND NOT has_function_privilege('service_role','public.get_professional_activity_summary(date,date)','EXECUTE')
 AND has_function_privilege('authenticated','public.get_professional_activity_summary(date,date)','EXECUTE'),'public wrapper grants');
SELECT pg_temp.check_ok(NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.get_professional_activity_summary(date,date)'::regprocedure)
 AND (SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid='pc_private.get_professional_activity_summary(date,date)'::regprocedure),'invoker boundary and empty definer search path');
-- Both DST transitions: compare instants around midnight, including both repeated hours.
INSERT INTO public.bookings(owner_id,professional_id,status,start_at,end_at,price)
SELECT 'ea710000-0000-0000-0000-000000000003','ea710000-0000-0000-0000-000000000001','pending',t,t+interval '30 minutes',1
FROM unnest(ARRAY[
 '2026-03-28 22:59:59Z'::timestamptz,'2026-03-28 23:00Z','2026-03-29 21:59:59Z','2026-03-29 22:00Z',
 '2026-10-24 21:59:59Z','2026-10-24 22:00Z','2026-10-25 00:30Z','2026-10-25 01:30Z','2026-10-25 22:59:59Z','2026-10-25 23:00Z']) t;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ea710000-0000-0000-0000-000000000001',true);
SELECT pg_temp.check_ok((public.get_professional_activity_summary('2026-03-29','2026-03-29')->>'total')::int=2,'23-hour Italian day');
SELECT pg_temp.check_ok((public.get_professional_activity_summary('2026-10-25','2026-10-25')->>'total')::int=4,'25-hour Italian day');
RESET ROLE;
ROLLBACK;
