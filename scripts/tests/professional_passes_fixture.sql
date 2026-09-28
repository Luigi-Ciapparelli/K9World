-- Synthetic accounts only. Executed before the new migration, locally.
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
('d0000000-0000-0000-0000-000000000001','packs-pro@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Pro Uno","role":"professional","professional_type":"trainer"}'),
('d0000000-0000-0000-0000-000000000002','packs-other-pro@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Pro Due","role":"professional","professional_type":"trainer"}'),
('d0000000-0000-0000-0000-000000000011','packs-owner@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Cliente Uno","role":"owner"}'),
('d0000000-0000-0000-0000-000000000012','packs-other@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Cliente Due","role":"owner"}'),
('d0000000-0000-0000-0000-000000000013','packs-unrelated@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Estraneo","role":"owner"}');
UPDATE public.professionals SET approved=true,approval_status='approved' WHERE id IN ('d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000002');
INSERT INTO public.services(id,professional_id,name,service_type) VALUES
('d0000000-0000-0000-0000-000000000101','d0000000-0000-0000-0000-000000000001','Lezione individuale','trainer'),
('d0000000-0000-0000-0000-000000000102','d0000000-0000-0000-0000-000000000002','Altro professionista','trainer'),
('d0000000-0000-0000-0000-000000000103','d0000000-0000-0000-0000-000000000001','Altro servizio','trainer');
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) VALUES
('d0000000-0000-0000-0000-000000000201','d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000101',now()-interval '2 hours',now()-interval '1 hour','completed'),
('d0000000-0000-0000-0000-000000000202','d0000000-0000-0000-0000-000000000012','d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000101',now()-interval '2 hours',now()-interval '1 hour','completed'),
('d0000000-0000-0000-0000-000000000203','d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000103',now()-interval '2 hours',now()-interval '1 hour','completed'),
('d0000000-0000-0000-0000-000000000204','d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000001','d0000000-0000-0000-0000-000000000101',now()-interval '2 hours',now()-interval '1 hour','pending');
INSERT INTO public.passes(id,professional_id,name,total_uses,price,valid_days) VALUES
('d0000000-0000-0000-0000-000000000300','d0000000-0000-0000-0000-000000000001','Vecchia beta',10,200,90);
INSERT INTO public.client_passes(id,pass_id,client_id,professional_id,remaining_uses) VALUES
('d0000000-0000-0000-0000-000000000400','d0000000-0000-0000-0000-000000000300','d0000000-0000-0000-0000-000000000011','d0000000-0000-0000-0000-000000000001',7);
