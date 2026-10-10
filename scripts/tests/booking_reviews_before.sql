-- Synthetic data before REV-02, including a relationship review with history.
INSERT INTO auth.users(id,email,email_confirmed_at,confirmation_sent_at,raw_user_meta_data)
SELECT ('e8210000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'experience'||n||'@example.invalid',NULL,now()-interval '1 minute',
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN(2,3,5) THEN 'professional' ELSE 'owner' END,'full_name','Synthetic '||n,'professional_type','trainer')
FROM generate_series(1,5) n;
UPDATE auth.users SET email_confirmed_at=now() WHERE id::text LIKE 'e8210000-%';
UPDATE public.professionals SET approved=true,approval_status='approved',listing_type=CASE WHEN id='e8210000-0000-0000-0000-000000000005' THEN 'center' ELSE 'individual' END WHERE id::text LIKE 'e8210000-%';
INSERT INTO public.services(id,professional_id,service_type,name,price) VALUES
 ('e8210000-0000-0000-0000-000000000201','e8210000-0000-0000-0000-000000000002','trainer','Lezione individuale',25),
 ('e8210000-0000-0000-0000-000000000202','e8210000-0000-0000-0000-000000000002','boarding','Soggiorno',25),
 ('e8210000-0000-0000-0000-000000000203','e8210000-0000-0000-0000-000000000002','groomer','Toelettatura',25),
 ('e8210000-0000-0000-0000-000000000204','e8210000-0000-0000-0000-000000000003','trainer','Altro professionista',25),
 ('e8210000-0000-0000-0000-000000000205','e8210000-0000-0000-0000-000000000005','trainer','Lezione nel centro',25),
 ('e8210000-0000-0000-0000-000000000206','e8210000-0000-0000-0000-000000000005','boarding','Centro pensione',25),
 ('e8210000-0000-0000-0000-000000000207','e8210000-0000-0000-0000-000000000005','enci_course','Corso nel centro',25);
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status)
SELECT ('e8210000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 'e8210000-0000-0000-0000-000000000001','e8210000-0000-0000-0000-000000000002','e8210000-0000-0000-0000-000000000201',now()-interval '20 days',now()-interval '19 days','pending'
FROM generate_series(301,303) n;
UPDATE public.bookings SET status='accepted' WHERE id IN('e8210000-0000-0000-0000-000000000301','e8210000-0000-0000-0000-000000000302');
UPDATE public.bookings SET status='completed' WHERE id IN('e8210000-0000-0000-0000-000000000301','e8210000-0000-0000-0000-000000000302');
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8210000-0000-0000-0000-000000000001',false);
SELECT public.submit_review('e8210000-0000-0000-0000-000000000302',3,'TESTO STORICO DEL RAPPORTO');
RESET ROLE;
-- Existing thread pointed at a newer booking, not necessarily the reviewed one.
UPDATE public.bookings SET status='accepted' WHERE id='e8210000-0000-0000-0000-000000000303';
UPDATE public.bookings SET status='completed' WHERE id='e8210000-0000-0000-0000-000000000303';
CREATE TEMP TABLE pc_reviews_before AS SELECT * FROM public.reviews WHERE professional_id='e8210000-0000-0000-0000-000000000002';
