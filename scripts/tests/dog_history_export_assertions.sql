BEGIN;
CREATE FUNCTION pg_temp.check_true(ok boolean,message text) RETURNS void LANGUAGE plpgsql AS $$BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION '%',message; END IF; END$$;
CREATE FUNCTION pg_temp.check_error(q text,code text) RETURNS void LANGUAGE plpgsql AS $$BEGIN BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN IF SQLSTATE=code THEN RETURN; END IF; RAISE; END; RAISE EXCEPTION 'Expected error %: %',code,q; END$$;
GRANT EXECUTE ON FUNCTION pg_temp.check_true(boolean,text),pg_temp.check_error(text,text) TO authenticated,anon;
-- User IDs: owner 1, author 2, recipient 3, unrelated owner 4.
INSERT INTO auth.users(id,email,email_confirmed_at,confirmation_sent_at,raw_user_meta_data)
SELECT ('e8100000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'export'||n||'@example.invalid',NULL,now()-interval '1 minute',
 jsonb_build_object('pawconnect_onboarding_version','1','role',CASE WHEN n IN (2,3) THEN 'professional' ELSE 'owner' END,'full_name','Synthetic '||n,'professional_type','trainer')
FROM generate_series(1,4) n;
UPDATE auth.users SET email_confirmed_at=now() WHERE id::text LIKE 'e8100000-%';
UPDATE public.professionals SET approved=true,approval_status='approved' WHERE id IN ('e8100000-0000-0000-0000-000000000002','e8100000-0000-0000-0000-000000000003');
INSERT INTO public.dogs(id,owner_id,name,breed,medical_notes,photo_url) VALUES
 ('e8100000-0000-0000-0000-000000000101','e8100000-0000-0000-0000-000000000001','Cane export','Meticcio / altra razza','Informazioni proprietario','e8100000-0000-0000-0000-000000000001/e8100000-0000-0000-0000-000000000101/profile'),
 ('e8100000-0000-0000-0000-000000000102','e8100000-0000-0000-0000-000000000004','ALTRO CANE RISERVATO','Meticcio / altra razza','SEGRETO ALTRO CANE','');
CREATE TEMP TABLE export_context(rel uuid, recipient uuid,note uuid,hidden_note uuid);
GRANT ALL ON export_context TO authenticated;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000001',true);
INSERT INTO export_context(rel,recipient) SELECT
 public.invite_dog_professional('e8100000-0000-0000-0000-000000000101','e8100000-0000-0000-0000-000000000002'),
 public.invite_dog_professional('e8100000-0000-0000-0000-000000000101','e8100000-0000-0000-0000-000000000003');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000002',true);
SELECT public.respond_dog_relationship(rel,true) FROM export_context;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000003',true);
SELECT public.respond_dog_relationship(recipient,true) FROM export_context;
RESET ROLE;
UPDATE public.person_dog_relationships SET authorized_at=now()-interval '20 days',accepted_at=now()-interval '19 days',started_at=now()-interval '19 days'
 WHERE id IN (SELECT rel FROM export_context UNION SELECT recipient FROM export_context);
INSERT INTO public.services(id,professional_id,service_type,name,price) VALUES ('e8100000-0000-0000-0000-000000000201','e8100000-0000-0000-0000-000000000002','trainer','Lezione export',25);
INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status,notes) VALUES
 ('e8100000-0000-0000-0000-000000000301','e8100000-0000-0000-0000-000000000001','e8100000-0000-0000-0000-000000000002','e8100000-0000-0000-0000-000000000201',now()-interval '2 days',now()-interval '47 hours','completed','NOTA PRENOTAZIONE'),
 ('e8100000-0000-0000-0000-000000000302','e8100000-0000-0000-0000-000000000004','e8100000-0000-0000-0000-000000000002','e8100000-0000-0000-0000-000000000201',now()-interval '2 days',now()-interval '47 hours','completed','ALTRA PRENOTAZIONE PRIVATA');
INSERT INTO public.booking_dogs VALUES ('e8100000-0000-0000-0000-000000000301','e8100000-0000-0000-0000-000000000101'),('e8100000-0000-0000-0000-000000000302','e8100000-0000-0000-0000-000000000102');
INSERT INTO public.booking_messages(booking_id,sequence,sender_id,sender_kind,body) VALUES
 ('e8100000-0000-0000-0000-000000000301',1,'e8100000-0000-0000-0000-000000000002','professional','MESSAGGIO AUTORIZZATO'),
 ('e8100000-0000-0000-0000-000000000302',1,'e8100000-0000-0000-0000-000000000002','professional','MESSAGGIO ALTRUI');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000002',true);
SELECT public.record_professional_session('e8100000-0000-0000-0000-000000000401',rel,now()-interval '2 days','Attività test','REVISIONE PRIVATA PRECEDENTE','e8100000-0000-0000-0000-000000000301') FROM export_context;
SELECT public.record_professional_session('e8100000-0000-0000-0000-000000000402',rel,now()-interval '1 day','Attività privata','NOTA MAI CONDIVISA') FROM export_context;
RESET ROLE;
UPDATE export_context SET note=(SELECT id FROM public.dog_professional_notes WHERE session_id='e8100000-0000-0000-0000-000000000401'),hidden_note=(SELECT id FROM public.dog_professional_notes WHERE session_id='e8100000-0000-0000-0000-000000000402');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000002',true);
SELECT public.revise_own_professional_note(note,1,'CONTRIBUTO CONDIVISO','MOTIVO PRIVATO') FROM export_context;
SELECT public.prepare_my_continuity_note('e8100000-0000-0000-0000-000000000501',note,2) FROM export_context;
SELECT pg_temp.check_true((public.export_dog_history('professional',rel,NULL,NULL,false)#>>'{counts,notes}')::int=3,'Author must receive every own revision') FROM export_context;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000001',true);
SELECT public.grant_dog_continuity_access('e8100000-0000-0000-0000-000000000601',recipient,ARRAY['e8100000-0000-0000-0000-000000000501']::uuid[],30,'Continuità test') FROM export_context;
DO $$DECLARE j jsonb;BEGIN
 j:=public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',NULL,NULL,false);
 PERFORM pg_temp.check_true((j#>>'{counts,notes}')::int=1,'Owner only published revision');
 PERFORM pg_temp.check_true((j#>>'{counts,bookings}')::int=1 AND (j#>>'{counts,messages}')::int=1,'Own booking and messages missing');
 PERFORM pg_temp.check_true(j::text LIKE '%CONTRIBUTO CONDIVISO%' AND j::text LIKE '%NOTA PRENOTAZIONE%' AND j::text LIKE '%MESSAGGIO AUTORIZZATO%','Missing accessible data');
 PERFORM pg_temp.check_true(j::text NOT LIKE '%PRIVAT%' AND j::text NOT LIKE '%ALTRUI%' AND j::text NOT LIKE '%SEGRETO%' AND j::text NOT LIKE '%MAI CONDIVISA%','Reserved content leaked');
 j:=public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101');
 PERFORM pg_temp.check_true(NOT(j?'dog') AND NOT(j?'notes') AND j::text NOT LIKE '%CONTRIBUTO CONDIVISO%','Preview exposed body');
 j:=public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',now()-interval '1 hour',NULL,false);
 PERFORM pg_temp.check_true((j#>>'{counts,notes}')::int=0 AND (j#>>'{counts,bookings}')::int=0,'Period ignored');
END$$;
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('owner','e8100000-0000-0000-0000-000000000102')$q$,'42501');
SELECT pg_temp.check_error(format('SELECT public.export_dog_history(''professional'',%L)',rel),'42501') FROM export_context;
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('received','e8100000-0000-0000-0000-000000000601')$q$,'42501');
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',now(),now()-interval '1 day')$q$,'22023');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000003',true);
DO $$DECLARE j jsonb;BEGIN
 j:=public.export_dog_history('received','e8100000-0000-0000-0000-000000000601',NULL,NULL,false);
 PERFORM pg_temp.check_true((j#>>'{counts,notes}')::int=1 AND (j#>>'{counts,bookings}')::int=0,'Received selection wrong');
 PERFORM pg_temp.check_true(j::text NOT LIKE '%Informazioni proprietario%' AND j::text NOT LIKE '%PRIVAT%' AND j::text NOT LIKE '%PRENOTAZIONE%' AND j::text NOT LIKE '%photo_path%','Recipient received reserved data');
END$$;
-- Preview then revocation: delivery must re-evaluate, not reuse cached body.
SELECT public.export_dog_history('received','e8100000-0000-0000-0000-000000000601');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000001',true);
SELECT public.revoke_dog_continuity_access('e8100000-0000-0000-0000-000000000601');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000003',true);
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('received','e8100000-0000-0000-0000-000000000601',NULL,NULL,false)$q$,'42501');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000001',true);
SELECT public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000002',true);
SELECT public.withdraw_my_continuity_note('e8100000-0000-0000-0000-000000000501');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000001',true);
SELECT pg_temp.check_true((public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',NULL,NULL,false)#>>'{counts,notes}')::int=0,'Withdrawal during preparation ignored');
-- Transfer invalidates the old owner. New owner must not inherit old conversations.
RESET ROLE;
UPDATE public.dogs SET owner_id='e8100000-0000-0000-0000-000000000004' WHERE id='e8100000-0000-0000-0000-000000000101';
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',NULL,NULL,false)$q$,'42501');
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000004',true);
SELECT pg_temp.check_true((public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101',NULL,NULL,false)#>>'{counts,messages}')::int=0,'New owner inherited old conversation');
RESET ROLE;
DELETE FROM public.dogs WHERE id='e8100000-0000-0000-0000-000000000101';
DELETE FROM auth.users WHERE id='e8100000-0000-0000-0000-000000000001';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e8100000-0000-0000-0000-000000000002',true);
SELECT pg_temp.check_true((public.export_dog_history('professional',rel,NULL,NULL,false)#>>'{counts,notes}')::int=3,'Deletion destroyed professional export') FROM export_context;
-- No silent row truncation and no oversized partial export.
RESET ROLE;
INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
SELECT e.hidden_note,n,r.professional_actor_id,repeat('a',20000),'Size check' FROM export_context e JOIN public.person_dog_relationships r ON r.id=e.rel CROSS JOIN generate_series(2,430) n;
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_error(format('SELECT public.export_dog_history(''professional'',%L,NULL,NULL,false)',rel),'54000') FROM export_context;
RESET ROLE;
UPDATE public.professional_note_revisions SET body='Small' WHERE note_id=(SELECT hidden_note FROM export_context) AND revision_number>=2;
INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
SELECT e.hidden_note,n,r.professional_actor_id,'Small','Row check' FROM export_context e JOIN public.person_dog_relationships r ON r.id=e.rel CROSS JOIN generate_series(431,2001) n;
SET LOCAL ROLE authenticated;
SELECT pg_temp.check_error(format('SELECT public.export_dog_history(''professional'',%L,NULL,NULL,false)',rel),'54000') FROM export_context;
RESET ROLE;
SELECT pg_temp.check_true(NOT has_function_privilege('anon','public.export_dog_history(text,uuid,timestamptz,timestamptz,boolean)','EXECUTE'),'Anonymous export');
SELECT pg_temp.check_true(NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.export_dog_history(text,uuid,timestamptz,timestamptz,boolean)'::regprocedure),'Public definer boundary');
SELECT pg_temp.check_true(NOT has_table_privilege('authenticated','public.professional_note_revisions','SELECT'),'Direct archive access');
SET LOCAL ROLE anon;
SELECT pg_temp.check_error($q$SELECT public.export_dog_history('owner','e8100000-0000-0000-0000-000000000101')$q$,'42501');
ROLLBACK;
