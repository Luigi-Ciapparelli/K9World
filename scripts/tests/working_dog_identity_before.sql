-- Synthetic legacy name-only verification, to check safe migration of existing data.
INSERT INTO public.professional_external_identities(professional_id,provider,profile_url,verification_status,verification_method)
 VALUES('e8310000-0000-0000-0000-000000000001','working_dog','https://www.working-dog.com/user/Owner-Test-34','verified','working_dog_auto');
SELECT public.commit_working_dog_check('e8310000-0000-0000-0003-000000000001',
 (SELECT verification_version FROM public.professional_credentials WHERE id='e8310000-0000-0000-0003-000000000001'),
 'e8310000-0000-0000-0000-000000000001','matched',repeat('a',64),'Legacy synthetic name match',4,'264.38');
INSERT INTO public.professional_credentials(id,professional_id,credential_type,title,verification_status,verification_method)
 VALUES('e8310000-0000-0000-0003-000000000002','e8310000-0000-0000-0000-000000000001','professional_qualification','Manual qualification','verified','manual_admin');
