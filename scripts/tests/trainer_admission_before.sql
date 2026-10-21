INSERT INTO auth.users(id,email,email_confirmed_at,confirmation_sent_at,raw_user_meta_data)
SELECT ('ad210000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'admission'||n||'@example.invalid',NULL,now()-interval '1 minute',
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n<5 THEN 'professional' ELSE 'owner' END,
 'full_name','Persona '||n,'professional_type',CASE WHEN n=4 THEN 'boarding' ELSE 'trainer' END)
FROM generate_series(1,6) n;
UPDATE auth.users SET email_confirmed_at=now() WHERE id::text LIKE 'ad210000-%' AND id<>'ad210000-0000-0000-0000-000000000003';
UPDATE public.profiles SET role='admin' WHERE id='ad210000-0000-0000-0000-000000000006';
UPDATE public.professionals SET approved=true,approval_status='approved',admin_notes='Nota precedente',zone_text='AreaAmmissione' WHERE id::text LIKE 'ad210000-%';
UPDATE public.professionals SET listing_type='center',business_name='Centro sintetico' WHERE id='ad210000-0000-0000-0000-000000000002';
INSERT INTO public.services(id,professional_id,name,service_type,price,active)
SELECT ('ad210000-0000-0000-0001-'||lpad(n::text,12,'0'))::uuid,('ad210000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 'Servizio '||n,CASE WHEN n=4 THEN 'boarding' ELSE 'trainer' END,30,true FROM generate_series(1,4) n;
INSERT INTO public.bookings(professional_id,owner_id,start_at,end_at,price,status,notes)
VALUES('ad210000-0000-0000-0000-000000000001','ad210000-0000-0000-0000-000000000005',now(),now()+interval '1 hour',30,'accepted','Appuntamento da preservare');
INSERT INTO public.professional_credentials(id,professional_id,credential_type,title,issuer_name,external_url)
SELECT ('ad210000-0000-0000-0002-'||lpad(n::text,12,'0'))::uuid,('ad210000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 'professional_qualification','Addestratore di prova','CSEN','https://example.invalid/registro/'||n FROM generate_series(1,4) n;
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ad210000-0000-0000-0000-000000000006',false);
SELECT public.admin_review_credential_version(id,verification_version,'verified','Fonte sintetica verificata') FROM public.professional_credentials;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',false);
