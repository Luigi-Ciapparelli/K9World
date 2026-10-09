-- Synthetic data only; run before the candidate migration to check preservation.
INSERT INTO auth.users(id,email,email_confirmed_at,confirmation_sent_at,raw_user_meta_data)
SELECT ('e8200000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'review'||n||'@example.invalid',NULL,now()-interval '1 minute',
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN(2,3,5) THEN 'professional' ELSE 'owner' END,'full_name','Synthetic '||n,'professional_type','trainer')
FROM generate_series(1,5) n;
UPDATE auth.users SET email_confirmed_at=now() WHERE id::text LIKE 'e8200000-%';
UPDATE public.professionals SET approved=true,approval_status='approved',listing_type=CASE WHEN id='e8200000-0000-0000-0000-000000000005' THEN 'center' ELSE 'individual' END WHERE id::text LIKE 'e8200000-%';
INSERT INTO public.services(id,professional_id,service_type,name,price) VALUES
 ('e8200000-0000-0000-0000-000000000201','e8200000-0000-0000-0000-000000000002','trainer','Lezione uno',25),
 ('e8200000-0000-0000-0000-000000000202','e8200000-0000-0000-0000-000000000002','boarding','Soggiorno',25),
 ('e8200000-0000-0000-0000-000000000203','e8200000-0000-0000-0000-000000000002','groomer','Toelettatura',25),
 ('e8200000-0000-0000-0000-000000000204','e8200000-0000-0000-0000-000000000003','trainer','Altro professionista',25),
 ('e8200000-0000-0000-0000-000000000205','e8200000-0000-0000-0000-000000000005','trainer','Centro lezione',25),
 ('e8200000-0000-0000-0000-000000000206','e8200000-0000-0000-0000-000000000005','boarding','Centro pensione',25),
 ('e8200000-0000-0000-0000-000000000207','e8200000-0000-0000-0000-000000000002','trainer','Altra lezione',25);
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) VALUES
 ('e8200000-0000-0000-0000-000000000301','e8200000-0000-0000-0000-000000000001','e8200000-0000-0000-0000-000000000002','e8200000-0000-0000-0000-000000000201',now()-interval '20 days',now()-interval '19 days','completed');
INSERT INTO public.reviews(id,booking_id,rating,comment) VALUES
 ('e8200000-0000-0000-0000-000000000501','e8200000-0000-0000-0000-000000000301',3,'RECENSIONE PRECEDENTE DA CONSERVARE');
