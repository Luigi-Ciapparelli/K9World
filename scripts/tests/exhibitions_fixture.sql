-- Synthetic legacy account created BEFORE migration. Nothing online is read.
INSERT INTO auth.users(id,email,email_confirmed_at,confirmation_sent_at,raw_user_meta_data) VALUES
 ('a8100000-0000-0000-0000-000000000001','legacy@example.invalid',now(),now()-interval '1 minute','{"pawconnect_onboarding_version":"1","full_name":"Legacy","role":"professional","professional_type":"walker"}'),
 ('a8100000-0000-0000-0000-000000000002','mixed@example.invalid',now(),now()-interval '1 minute','{"pawconnect_onboarding_version":"1","full_name":"Mixed","role":"professional","professional_type":"trainer"}'),
 ('a8100000-0000-0000-0000-000000000003','owner@example.invalid',NULL,now()-interval '1 minute','{"pawconnect_onboarding_version":"1","full_name":"Owner","role":"owner"}');
UPDATE auth.users SET email_confirmed_at=now() WHERE id='a8100000-0000-0000-0000-000000000003';
UPDATE public.professionals SET approved=true,approval_status='approved',zone_text='Testville',latitude=44,longitude=12,coverage_radius_km=10
 WHERE id IN ('a8100000-0000-0000-0000-000000000001','a8100000-0000-0000-0000-000000000002');
INSERT INTO public.services(id,professional_id,name,service_type,price,duration_minutes,active) VALUES
 ('a8100000-0000-0000-0000-000000000101','a8100000-0000-0000-0000-000000000001','Legacy walk','walker',15,60,true),
 ('a8100000-0000-0000-0000-000000000102','a8100000-0000-0000-0000-000000000002','Trainer','trainer',25,60,true),
 ('a8100000-0000-0000-0000-000000000103','a8100000-0000-0000-0000-000000000002','Boarding','boarding',40,1440,true),
 ('a8100000-0000-0000-0000-000000000104','a8100000-0000-0000-0000-000000000002','Grooming','groomer',35,60,true),
 ('a8100000-0000-0000-0000-000000000105','a8100000-0000-0000-0000-000000000002','Handling','handler',50,60,true),
 ('a8100000-0000-0000-0000-000000000106','a8100000-0000-0000-0000-000000000002','Legacy sitting','sitter',15,60,true);
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status,notes,price) VALUES
 ('a8100000-0000-0000-0000-000000000201','a8100000-0000-0000-0000-000000000003','a8100000-0000-0000-0000-000000000001','a8100000-0000-0000-0000-000000000101',now()-interval '2 days',now()-interval '47 hours','completed','Historical private note',15);
INSERT INTO public.dogs(id,owner_id,name,breed) VALUES ('a8100000-0000-0000-0000-000000000301','a8100000-0000-0000-0000-000000000003','Synthetic dog','Meticcio / altra razza');
CREATE TEMP TABLE exhibition_before_services AS SELECT to_jsonb(s) AS row FROM public.services s;
CREATE TEMP TABLE exhibition_before_bookings AS SELECT to_jsonb(b) AS row FROM public.bookings b;
