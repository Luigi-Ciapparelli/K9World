-- Synthetic data only, executed exclusively in the temporary test cluster.
INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES (
 'ac290000-0000-0000-0000-000000000001','recovery@example.invalid',
 '{"pawconnect_onboarding_version":"1","role":"owner","full_name":"Persona ripristino sintetica","dog_name":"Cane sintetico","dog_breed":"Meticcio / altra razza","legal_declaration":{"source":"website-signup","terms_accepted":true,"terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1"}}'
);
DO $$
DECLARE pro uuid; owner_actor uuid; dog_archive uuid; relationship uuid; session uuid; note uuid;
BEGIN
 INSERT INTO public.professional_archive_actors(source_profile_id,live_profile_id,display_name_at_capture)
 VALUES('ad210000-0000-0000-0000-000000000001','ad210000-0000-0000-0000-000000000001','Professionista sintetico') RETURNING id INTO pro;
 INSERT INTO public.professional_archive_actors(source_profile_id,live_profile_id,display_name_at_capture)
 VALUES('ac290000-0000-0000-0000-000000000001','ac290000-0000-0000-0000-000000000001','Proprietario sintetico') RETURNING id INTO owner_actor;
 INSERT INTO public.professional_archive_dogs(source_dog_id,live_dog_id,name_at_capture)
 SELECT id,id,name FROM public.dogs WHERE owner_id='ac290000-0000-0000-0000-000000000001' RETURNING id INTO dog_archive;
 INSERT INTO public.person_dog_relationships(dog_archive_id,professional_actor_id,authorizing_owner_actor_id,status,accepted_at,started_at)
 VALUES(dog_archive,pro,owner_actor,'active',now(),now()) RETURNING id INTO relationship;
 INSERT INTO public.professional_sessions(relationship_id,occurred_at,activity,status,finalized_at)
 VALUES(relationship,now(),'Attività sintetica di recupero','finalized',now()) RETURNING id INTO session;
 INSERT INTO public.dog_professional_notes(session_id,status,finalized_at)
 VALUES(session,'finalized',now()) RETURNING id INTO note;
 INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
 VALUES(note,1,pro,'Prima nota sintetica',NULL),(note,2,pro,'Nota sintetica rettificata','Motivo sintetico');
END $$;
INSERT INTO storage.objects(bucket_id,name) VALUES ('dog-photos','synthetic-owner/synthetic-dog/profile');
