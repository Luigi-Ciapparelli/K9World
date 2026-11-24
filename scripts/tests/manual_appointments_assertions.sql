-- These synthetic accounts/services are created by trainer_admission_before.sql.
CREATE FUNCTION pg_temp.ok(v boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF v IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAILED: %',msg; END IF; END $$;
CREATE FUNCTION pg_temp.denied(q text,code text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RAISE EXCEPTION 'Unexpected success: %',q;
EXCEPTION WHEN OTHERS THEN IF SQLSTATE<>code THEN RAISE; END IF; END $$;
CREATE FUNCTION pg_temp.uid(n int,group_id int DEFAULT 0) RETURNS uuid LANGUAGE sql AS $$
SELECT ('ad210000-0000-0000-'||lpad(group_id::text,4,'0')||'-'||lpad(n::text,12,'0'))::uuid $$;
CREATE FUNCTION pg_temp.save(n int,ver int,svc int,h time,dog text,coach uuid DEFAULT NULL) RETURNS int LANGUAGE sql AS $$
SELECT public.save_my_manual_appointment(pg_temp.uid(n,9),ver,pg_temp.uid(svc,1),current_date+12,h,dog,coach) $$;
GRANT EXECUTE ON FUNCTION pg_temp.ok(boolean,text),pg_temp.denied(text,text),pg_temp.uid(int,int),pg_temp.save(int,int,int,time,text,uuid) TO authenticated,anon;
SET LOCAL ROLE anon;
SELECT pg_temp.denied('SELECT public.list_my_manual_appointments(current_date,current_date+20,0)','42501');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
SELECT pg_temp.denied($q$SELECT pg_temp.save(1,0,1,'10:00','Fido')$q$,'42501');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(6)::text,true);
SELECT public.admin_approve_trainer(pg_temp.uid(n),public.admin_get_trainer_admission(pg_temp.uid(n))->>'token',pg_temp.uid(n,2),'CSEN',
 CASE n WHEN 1 THEN 'Persona 1' ELSE 'Istruttore qualificato del centro' END,true,true,'Registro e identità verificati su fonti sintetiche',NULL) FROM generate_series(1,2) n;
RESET ROLE;
INSERT INTO pc_private.centre_instructors(id,centre_id,display_name) VALUES(pg_temp.uid(1,8),pg_temp.uid(2),'Istruttore A'),(pg_temp.uid(2,8),pg_temp.uid(2),'Istruttore B');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
SELECT pg_temp.denied('SELECT * FROM pc_private.manual_appointments','42501');
SELECT pg_temp.denied($q$SELECT pg_temp.save(1,0,2,'10:00','Altro')$q$,'PCJ04');
SELECT pg_temp.ok(pg_temp.save(1,0,1,'10:00','Fido')=1,'New appointment without a client');
SELECT pg_temp.ok(pg_temp.save(1,0,1,'10:00','Fido')=1,'Double submit uses same id');
SELECT pg_temp.ok((SELECT jsonb_array_length(j)=1 AND j->0->>'dog_label'='Fido' AND (j->0->>'end_at')::timestamptz-(j->0->>'start_at')::timestamptz=interval '1 hour' FROM public.list_my_manual_appointments(current_date,current_date+20,0) j),'Duration/one row');
SELECT pg_temp.denied($q$SELECT pg_temp.save(2,0,1,'10:15','Altro')$q$,'PCJ01');
SELECT pg_temp.denied($q$SELECT pg_temp.save(2,0,1,'12:00','Altro',pg_temp.uid(1,8))$q$,'22023');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(5)::text,true);
SELECT pg_temp.denied('SELECT public.list_my_manual_appointments(current_date,current_date+20,0)','42501');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(2)::text,true);
SELECT pg_temp.ok(public.list_my_manual_appointments(current_date,current_date+20,0)='[]'::jsonb,'Other professional cannot list');
SELECT pg_temp.denied('SELECT public.cancel_my_manual_appointment(pg_temp.uid(1,9),1)','40001');
SELECT pg_temp.ok(pg_temp.save(3,0,2,'10:00','Uno',pg_temp.uid(1,8))=1 AND pg_temp.save(4,0,2,'10:00','Due',pg_temp.uid(2,8))=1,'Different instructors may work together');
SELECT pg_temp.denied($q$SELECT pg_temp.save(5,0,2,'10:00','Tre',pg_temp.uid(2,8))$q$,'PCJ01');
RESET ROLE;
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM public.bookings WHERE start_at::date=current_date+12),'Manual entries have not created portal bookings');
INSERT INTO public.bookings(id,professional_id,owner_id,service_id,start_at,end_at,price,status) VALUES
(pg_temp.uid(9,7),pg_temp.uid(1),pg_temp.uid(5),pg_temp.uid(1,1),((current_date+12)+time '10:00') AT TIME ZONE 'Europe/Rome',((current_date+12)+time '11:00') AT TIME ZONE 'Europe/Rome',30,'pending');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(1)::text,true);
SELECT pg_temp.denied($q$SELECT public.change_booking_status(pg_temp.uid(9,7),'accepted')$q$,'PCJ01');
SELECT pg_temp.ok(pg_temp.save(1,1,1,'14:00','Fido')=2,'Reschedule');
SELECT pg_temp.denied($q$SELECT pg_temp.save(1,1,1,'16:00','Wrong')$q$,'40001');
SELECT public.change_booking_status(pg_temp.uid(9,7),'accepted');
SELECT pg_temp.denied($q$SELECT pg_temp.save(8,0,1,'10:15','Overlap')$q$,'PCJ01');
SELECT pg_temp.ok(public.cancel_my_manual_appointment(pg_temp.uid(1,9),2),'Remove');
SELECT pg_temp.ok(public.cancel_my_manual_appointment(pg_temp.uid(1,9),2),'Retry remove');
SELECT pg_temp.denied($q$SELECT pg_temp.save(1,0,1,'10:00','Fido')$q$,'40001');
SELECT pg_temp.ok(public.list_my_manual_appointments(current_date,current_date+20,0)='[]'::jsonb,'Cancelled hidden');
SELECT public.add_my_time_off(pg_temp.uid(7,7),current_date+12,current_date+12,'Test');
SELECT pg_temp.denied($q$SELECT pg_temp.save(6,0,1,'16:00','')$q$,'PCA02');
SELECT set_config('request.jwt.claim.sub',pg_temp.uid(4)::text,true);
SELECT pg_temp.ok(pg_temp.save(1,0,4,'10:00','')=1 AND pg_temp.save(2,0,4,'10:00','')=1,'Boarding is not restricted to one dog');
RESET ROLE;
SELECT pg_temp.ok((SELECT dog_label='' FROM pc_private.manual_appointments WHERE professional_id=pg_temp.uid(1) AND cancelled),'Removed dog alias cleared');
