-- Synthetic accounts; no real personal data.
INSERT INTO auth.users(id,email,raw_user_meta_data)
SELECT ('e8310000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'training'||n||'@example.invalid',
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n<7 THEN 'professional' ELSE 'owner' END,'full_name','Activity test '||n,'professional_type','trainer')
FROM generate_series(1,8) n;
UPDATE public.profiles SET role='admin' WHERE id='e8310000-0000-0000-0000-000000000008';
UPDATE public.professionals SET approved=true,approval_status='approved',zone_text='AreaTest',latitude=44,longitude=12,coverage_radius_km=10,
 listing_type=CASE WHEN id='e8310000-0000-0000-0000-000000000006' THEN 'center' ELSE 'individual' END WHERE id::text LIKE 'e8310000-%';
UPDATE public.professionals SET approved=false,approval_status='pending' WHERE id='e8310000-0000-0000-0000-000000000004';
INSERT INTO public.services(id,professional_id,service_type,name,price,active)
SELECT ('e8310000-0000-0000-0001-'||lpad(n::text,12,'0'))::uuid,('e8310000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
 'trainer','Training test '||n,25,n<>5 FROM generate_series(1,6) n;
INSERT INTO public.services(professional_id,service_type,name,price,active) VALUES
 ('e8310000-0000-0000-0000-000000000002','boarding','Boarding test',40,true),
 ('e8310000-0000-0000-0000-000000000002','handler','Handling test',50,true);
CREATE TEMP TABLE trainer_services_before AS SELECT to_jsonb(s) row FROM public.services s;
CREATE TEMP TABLE trainer_professionals_before AS SELECT to_jsonb(p) row FROM public.professionals p;

INSERT INTO public.professional_credentials(id,professional_id,credential_type,title,discipline,achievement,external_url,dog_name,event_name,is_public,verification_status,verification_method)
VALUES('e8310000-0000-0000-0003-000000000001','e8310000-0000-0000-0000-000000000001','sport_result','Risultato sintetico','igp','IGP1','https://www.working-dog.com/results/synthetic-1','Cane test','Evento test',true,'verified','manual_admin');
