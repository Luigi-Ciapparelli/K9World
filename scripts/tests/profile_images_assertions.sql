BEGIN;
CREATE FUNCTION pg_temp.uid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$ SELECT ('e9100000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid $$;
CREATE FUNCTION pg_temp.check_true(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'TEST FAILED: %',label; END IF; END $$;
CREATE FUNCTION pg_temp.denied(query text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN BEGIN EXECUTE query; EXCEPTION WHEN insufficient_privilege THEN RETURN; END; RAISE EXCEPTION 'TEST FAILED: allowed %',query; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.uid(integer),pg_temp.check_true(boolean,text),pg_temp.denied(text) TO anon,authenticated;
INSERT INTO auth.users(id,email,confirmation_sent_at,raw_user_meta_data)
SELECT pg_temp.uid(n),'images'||n||'@example.invalid',now(),jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN(2,3,5) THEN 'professional' ELSE 'owner' END,'full_name','Images '||n,'professional_type',CASE WHEN n=5 THEN 'handler' ELSE 'trainer' END)
FROM generate_series(1,5) n;
UPDATE auth.users SET email_confirmed_at=now() WHERE id::text LIKE 'e9100000-%';
UPDATE public.professionals SET approved=true,approval_status='approved',listing_type='individual',cover_photo_url='https://example.invalid/banner.webp',zone_text='Rimini',latitude=44,longitude=12 WHERE id::text LIKE 'e9100000-%';
INSERT INTO public.services(professional_id,service_type,name,price) SELECT id,professional_type,'Servizio',25 FROM public.professionals WHERE id::text LIKE 'e9100000-%';
INSERT INTO public.bookings(id,owner_id,professional_id,start_at,end_at,status) VALUES
 (pg_temp.uid(100),pg_temp.uid(1),pg_temp.uid(2),now()+interval '1 day',now()+interval '2 days','pending'),
 (pg_temp.uid(101),pg_temp.uid(4),pg_temp.uid(3),now()+interval '1 day',now()+interval '2 days','pending');
SELECT pg_temp.check_true((SELECT NOT public AND file_size_limit=131072 AND allowed_mime_types=ARRAY['image/webp'] FROM storage.buckets WHERE id='client-portraits'),'private bucket limits');
SELECT pg_temp.check_true((SELECT public AND file_size_limit=512000 AND allowed_mime_types=ARRAY['image/webp'] FROM storage.buckets WHERE id='professional-branding'),'public bucket limits');
SELECT pg_temp.check_true(NOT has_function_privilege('anon','public.get_client_portraits(uuid[],uuid[])','EXECUTE'),'anon RPC denied');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('client-portraits',pg_temp.uid(1)::text||'/portrait.webp');
SELECT pg_temp.check_true((SELECT count(*)=1 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'own portrait');
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)','client-portraits',pg_temp.uid(1)::text||'/extra.webp'));
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)','client-portraits',pg_temp.uid(4)::text||'/portrait.webp'));
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)','professional-branding',pg_temp.uid(1)::text||'/avatar.webp'));
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(4)::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('client-portraits',pg_temp.uid(4)::text||'/portrait.webp');
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'other owner cannot read');

SELECT set_config('request.jwt.claim.sub',pg_temp.uid(2)::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('professional-branding',pg_temp.uid(2)::text||'/avatar.webp'),('professional-branding',pg_temp.uid(2)::text||'/cover.webp');
UPDATE storage.objects SET name=name WHERE bucket_id='professional-branding';
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)','professional-branding',pg_temp.uid(2)::text||'/third.webp'));
SELECT pg_temp.denied(format('UPDATE storage.objects SET name=%L WHERE name=%L',pg_temp.uid(2)::text||'/new.webp',pg_temp.uid(2)::text||'/avatar.webp'));
SELECT pg_temp.denied(format('INSERT INTO storage.objects(bucket_id,name) VALUES (%L,%L)','client-portraits',pg_temp.uid(2)::text||'/portrait.webp'));
SELECT pg_temp.check_true((SELECT count(*)=1 FROM storage.objects WHERE bucket_id='client-portraits'),'pending client visible, unrelated client hidden');
SELECT pg_temp.check_true((SELECT count(*)=1 FROM public.get_client_portraits('{}',ARRAY[pg_temp.uid(100)])),'booking to portrait');
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits('{}',ARRAY[pg_temp.uid(101)])),'another professional booking denied');
DELETE FROM storage.objects WHERE bucket_id='client-portraits';
SELECT pg_temp.check_true((SELECT count(*)=1 FROM storage.objects WHERE bucket_id='client-portraits'),'professional cannot delete client portrait');
DO $$ BEGIN BEGIN PERFORM public.get_client_portraits(array_fill(pg_temp.uid(1),ARRAY[101])); RAISE EXCEPTION 'Missing batch limit'; EXCEPTION WHEN invalid_parameter_value THEN NULL; END; END $$;
RESET ROLE;
UPDATE public.bookings SET status='declined' WHERE id=pg_temp.uid(100);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'declined-only relationship loses access');
RESET ROLE;
UPDATE public.bookings SET status='accepted' WHERE id=pg_temp.uid(100);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true((SELECT count(*)=1 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'accepted relationship');
RESET ROLE;
UPDATE public.professionals SET approved=false WHERE id=pg_temp.uid(2);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'unapproved professional blocked');
RESET ROLE;
UPDATE public.professionals SET approved=true WHERE id=pg_temp.uid(2);
UPDATE public.bookings SET status='completed',start_at=now()-interval '2 hours',end_at=now()-interval '1 hour' WHERE id=pg_temp.uid(100);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true((SELECT count(*)=1 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'completed relationship');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
DELETE FROM storage.objects WHERE bucket_id='client-portraits';
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(2)::text,true);
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'owner deletion removes future reads');
RESET ROLE;

-- An invitation alone grants nothing; the independent relationship path must
-- lose access on either an ownership change or revocation.
INSERT INTO public.dogs(id,owner_id,name,breed) VALUES (pg_temp.uid(200),pg_temp.uid(1),'Cane di prova','Meticcio / altra razza');
CREATE TEMP TABLE image_test_relationship(id uuid);
GRANT SELECT,INSERT ON image_test_relationship TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('client-portraits',pg_temp.uid(1)::text||'/portrait.webp');
INSERT INTO image_test_relationship SELECT public.invite_dog_professional(pg_temp.uid(200),pg_temp.uid(3));
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(3)::text,true);
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'invitation is insufficient');
SELECT public.respond_dog_relationship((SELECT id FROM image_test_relationship),true);
SELECT pg_temp.check_true((SELECT count(*)=1 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'active bilateral relationship');
RESET ROLE;
UPDATE public.dogs SET owner_id=pg_temp.uid(4) WHERE id=pg_temp.uid(200);
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'changed ownership revokes portrait access');
RESET ROLE;
UPDATE public.dogs SET owner_id=pg_temp.uid(1) WHERE id=pg_temp.uid(200);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
SELECT public.close_dog_relationship((SELECT id FROM image_test_relationship));
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(3)::text,true);
SELECT pg_temp.check_true((SELECT count(*)=0 FROM public.get_client_portraits(ARRAY[pg_temp.uid(1)])),'revoked relationship loses portrait access');
RESET ROLE;

-- Public read contracts and approval filtering still apply to individuals/handlers.
SET LOCAL ROLE anon;
SELECT pg_temp.check_true((SELECT cover_photo_url='https://example.invalid/banner.webp' FROM public.public_professional_profiles WHERE id=pg_temp.uid(2)),'individual banner visible');
SELECT pg_temp.check_true((SELECT cover_photo_url='https://example.invalid/banner.webp' FROM public.public_professional_profiles WHERE id=pg_temp.uid(5)),'handler banner visible');
SELECT pg_temp.check_true((SELECT count(*)=0 FROM storage.objects WHERE bucket_id='client-portraits'),'anonymous portrait read denied');
SELECT pg_temp.denied('SELECT * FROM public.get_client_portraits()');
RESET ROLE;
SELECT pg_temp.check_true(NOT EXISTS(SELECT 1 FROM pg_proc p WHERE pronamespace='public'::regnamespace AND prosecdef AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))),'public API boundary');
ROLLBACK;
