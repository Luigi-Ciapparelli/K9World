-- Synthetic fixtures and contract snapshots, isolated database only.
SET search_path=public;
CREATE TEMP TABLE pc_api_functions_before AS
SELECT p.oid,p.proname,p.prosrc,p.proowner,p.proargtypes,p.proallargtypes,p.proargmodes,p.proargnames,
 p.proretset,p.prorettype,p.provolatile,p.proisstrict,p.proparallel,
 pg_get_function_arguments(p.oid) AS args,pg_get_function_result(p.oid) AS result,
 has_function_privilege('anon',p.oid,'EXECUTE') AS anon,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated,
 has_function_privilege('service_role',p.oid,'EXECUTE') AS service_role
FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prosecdef
 AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'));
CREATE TEMP TABLE pc_api_relation_permissions AS
SELECT c.oid,c.relacl,c.relowner,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c WHERE c.relnamespace IN ('public'::regnamespace,'storage'::regnamespace) AND c.relkind IN ('r','p','v');
CREATE TEMP TABLE pc_api_policies_before AS SELECT p.* FROM pg_policy p;

INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
('f0000000-0000-0000-0000-000000000001','api-admin@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Admin Prova","role":"owner"}'),
('f0000000-0000-0000-0000-000000000002','api-pro@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Anna Professionista","role":"professional","professional_type":"trainer"}'),
('f0000000-0000-0000-0000-000000000003','api-pending@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"In Attesa","role":"professional","professional_type":"trainer"}'),
('f0000000-0000-0000-0000-000000000004','api-owner@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Maria CognomePrivato","role":"owner"}');
UPDATE public.profiles SET role='admin' WHERE id='f0000000-0000-0000-0000-000000000001';
UPDATE public.professionals SET approved=true,approval_status='approved',zone_text='Rimini'
 WHERE id='f0000000-0000-0000-0000-000000000002';
INSERT INTO public.services(id,professional_id,name,service_type,price,duration_minutes) VALUES
('f0000000-0000-0000-0000-000000000101','f0000000-0000-0000-0000-000000000002','Lezione','trainer',25,60);
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status,notes) VALUES
('f0000000-0000-0000-0000-000000000201','f0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000002','f0000000-0000-0000-0000-000000000101',now()-interval '2 days',now()-interval '47 hours','completed','NOTA PRIVATA');
INSERT INTO public.reviews(id,booking_id,owner_id,professional_id,rating,comment) VALUES
('f0000000-0000-0000-0000-000000000301','f0000000-0000-0000-0000-000000000201','f0000000-0000-0000-0000-000000000004','f0000000-0000-0000-0000-000000000002',5,'Recensione pubblica');
INSERT INTO public.professional_credentials(professional_id,credential_type,title,discipline,achievement,verification_status,is_public,dog_name) VALUES
('f0000000-0000-0000-0000-000000000002','sport_result','Pubblico','IGP','IGP3','verified',true,'Cane Uno'),
('f0000000-0000-0000-0000-000000000002','sport_result','PRIVATO','IGP','IGP3','verified',false,'Cane Due'),
('f0000000-0000-0000-0000-000000000003','sport_result','Non approvato','IGP','IGP3','verified',true,'Cane Tre');
CREATE TEMP TABLE pc_api_public_rows(view_name text,rows jsonb);
INSERT INTO pc_api_public_rows SELECT 'public_professional_profiles',jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.public_professional_profiles v;
INSERT INTO pc_api_public_rows SELECT 'public_professional_sport_merit',jsonb_agg(to_jsonb(v) ORDER BY professional_id) FROM public.public_professional_sport_merit v;
INSERT INTO pc_api_public_rows SELECT 'public_reviews',jsonb_agg(to_jsonb(v) ORDER BY id) FROM public.public_reviews v;
GRANT SELECT ON pc_api_public_rows TO anon,authenticated;
