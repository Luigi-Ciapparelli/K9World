-- Individual full-day unavailability. No health or personal reasons collected.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TABLE pc_private.instructor_time_off(
 id uuid PRIMARY KEY, instructor_id uuid NOT NULL REFERENCES pc_private.centre_instructors(id) ON DELETE CASCADE,
 start_date date NOT NULL, end_date date NOT NULL, created_by uuid NOT NULL,
 cancelled boolean NOT NULL DEFAULT false, version uuid NOT NULL DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(end_date>=start_date AND end_date-start_date<366)
);
CREATE INDEX instructor_time_off_dates ON pc_private.instructor_time_off(instructor_id,start_date,end_date) WHERE NOT cancelled;
CREATE TABLE pc_private.instructor_time_off_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, period_id uuid NOT NULL, actor_id uuid NOT NULL,
 previous_value jsonb, new_value jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE pc_private.instructor_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.instructor_time_off_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.instructor_time_off,pc_private.instructor_time_off_events FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE pc_private.instructor_time_off_events_id_seq FROM PUBLIC,anon,authenticated,service_role;
-- Internal helper is not callable by client roles. All writers lock the centre first.
CREATE FUNCTION pc_private.can_manage_instructor_time_off(p_instructor_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM pc_private.centre_instructors i JOIN public.professionals c ON c.id=i.centre_id
 JOIN public.profiles cp ON cp.id=c.id
 WHERE i.id=p_instructor_id AND c.listing_type='center' AND cp.role='professional' AND
 (i.centre_id=auth.uid() OR (i.active AND EXISTS(SELECT 1 FROM pc_private.centre_memberships m
 JOIN public.profiles p ON p.id=m.account_id JOIN auth.users u ON u.id=p.id
 WHERE m.instructor_id=i.id AND m.centre_id=i.centre_id AND m.account_id=auth.uid() AND m.status='active'
 AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL))));
$$;
REVOKE ALL ON FUNCTION pc_private.can_manage_instructor_time_off(uuid) FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION pc_private.get_instructor_time_off(p_instructor_id uuid,p_from date,p_until date) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT pc_private.can_manage_instructor_time_off(p_instructor_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_until IS NULL OR p_until<=p_from OR p_until-p_from>366 THEN RAISE EXCEPTION 'Invalid dates' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',t.id,'start_date',t.start_date,'end_date',t.end_date,'version',t.version,
 'can_cancel',auth.uid() IN (i.centre_id,t.created_by),'source',CASE WHEN t.created_by=i.centre_id THEN 'centre' ELSE 'instructor' END,
 'affected_bookings',(SELECT count(*) FROM pc_private.booking_instructors a JOIN public.bookings b ON b.id=a.booking_id
 WHERE a.instructor_id=i.id AND b.status='accepted' AND b.start_at<((t.end_date+1)::timestamp AT TIME ZONE 'Europe/Rome')
 AND b.end_at>(t.start_date::timestamp AT TIME ZONE 'Europe/Rome'))) ORDER BY t.start_date,t.id),'[]') INTO result
 FROM pc_private.instructor_time_off t JOIN pc_private.centre_instructors i ON i.id=t.instructor_id
 WHERE t.instructor_id=p_instructor_id AND NOT t.cancelled AND t.start_date<p_until AND t.end_date>=p_from;
 RETURN result;
END $$;
CREATE FUNCTION pc_private.add_instructor_time_off(p_id uuid,p_instructor_id uuid,p_start date,p_end date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; old_row pc_private.instructor_time_off; new_row pc_private.instructor_time_off;
BEGIN
 SELECT centre_id INTO centre FROM pc_private.centre_instructors WHERE id=p_instructor_id;
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 IF NOT pc_private.can_manage_instructor_time_off(p_instructor_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old_row FROM pc_private.instructor_time_off WHERE id=p_id;
 IF FOUND THEN
  IF old_row.instructor_id=p_instructor_id AND old_row.created_by=auth.uid() AND old_row.start_date=p_start AND old_row.end_date=p_end AND NOT old_row.cancelled THEN RETURN to_jsonb(old_row); END IF;
  RAISE EXCEPTION 'Request changed' USING ERRCODE='40001';
 END IF;
 IF p_id IS NULL OR p_start IS NULL OR p_end IS NULL OR p_end<p_start OR p_end-p_start>=366 OR p_end<(now() AT TIME ZONE 'Europe/Rome')::date
 OR p_start>(now() AT TIME ZONE 'Europe/Rome')::date+730 THEN RAISE EXCEPTION 'Invalid dates' USING ERRCODE='22023'; END IF;
 IF (SELECT count(*) FROM pc_private.instructor_time_off WHERE instructor_id=p_instructor_id AND NOT cancelled AND end_date>=(now() AT TIME ZONE 'Europe/Rome')::date)>=200 THEN RAISE EXCEPTION 'Too many periods' USING ERRCODE='54000'; END IF;
 INSERT INTO pc_private.instructor_time_off(id,instructor_id,start_date,end_date,created_by) VALUES(p_id,p_instructor_id,p_start,p_end,auth.uid()) RETURNING * INTO new_row;
 INSERT INTO pc_private.instructor_time_off_events(period_id,actor_id,new_value) VALUES(p_id,auth.uid(),to_jsonb(new_row));
 RETURN to_jsonb(new_row);
END $$;
CREATE FUNCTION pc_private.cancel_instructor_time_off(p_id uuid,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; old_row pc_private.instructor_time_off; new_row pc_private.instructor_time_off;
BEGIN
 SELECT i.centre_id INTO centre FROM pc_private.instructor_time_off t JOIN pc_private.centre_instructors i ON i.id=t.instructor_id WHERE t.id=p_id;
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 SELECT * INTO old_row FROM pc_private.instructor_time_off WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR NOT pc_private.can_manage_instructor_time_off(old_row.instructor_id) OR auth.uid() NOT IN (centre,old_row.created_by) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF old_row.cancelled THEN RETURN to_jsonb(old_row); END IF;
 IF p_expected_version IS DISTINCT FROM old_row.version THEN RAISE EXCEPTION 'Period changed' USING ERRCODE='40001'; END IF;
 UPDATE pc_private.instructor_time_off SET cancelled=true,version=gen_random_uuid(),updated_at=clock_timestamp() WHERE id=p_id RETURNING * INTO new_row;
 INSERT INTO pc_private.instructor_time_off_events(period_id,actor_id,previous_value,new_value) VALUES(p_id,auth.uid(),to_jsonb(old_row),to_jsonb(new_row));
 RETURN to_jsonb(new_row);
END $$;
CREATE FUNCTION public.get_instructor_time_off(p_instructor_id uuid,p_from date,p_until date) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_instructor_time_off(p_instructor_id,p_from,p_until); $$;
REVOKE ALL ON FUNCTION public.get_instructor_time_off(uuid,date,date),pc_private.get_instructor_time_off(uuid,date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_instructor_time_off(uuid,date,date),pc_private.get_instructor_time_off(uuid,date,date) TO authenticated;
CREATE FUNCTION public.add_instructor_time_off(p_id uuid,p_instructor_id uuid,p_start date,p_end date) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.add_instructor_time_off(p_id,p_instructor_id,p_start,p_end); $$;
REVOKE ALL ON FUNCTION public.add_instructor_time_off(uuid,uuid,date,date),pc_private.add_instructor_time_off(uuid,uuid,date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.add_instructor_time_off(uuid,uuid,date,date),pc_private.add_instructor_time_off(uuid,uuid,date,date) TO authenticated;
CREATE FUNCTION public.cancel_instructor_time_off(p_id uuid,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.cancel_instructor_time_off(p_id,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.cancel_instructor_time_off(uuid,uuid),pc_private.cancel_instructor_time_off(uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.cancel_instructor_time_off(uuid,uuid),pc_private.cancel_instructor_time_off(uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION pc_private.assign_booking_instructor_checked(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL,p_allow_overlap boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings; m pc_private.centre_instructors; old_row pc_private.booking_instructors; new_row pc_private.booking_instructors; overlapping boolean;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='professional') THEN
 RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same order as change_booking_status and roster writes: centre, booking, assignment.
 PERFORM 1 FROM public.professionals WHERE id=auth.uid() AND listing_type='center' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Centre required' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND professional_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF b.status IS DISTINCT FROM 'accepted' OR NOT EXISTS(SELECT 1 FROM pc_private.review_experiences WHERE booking_id=b.id AND service_type IN ('trainer','enci_course')) THEN
 RAISE EXCEPTION 'L’istruttore si assegna a una lezione accettata, prima di segnarla completata.' USING ERRCODE='22023'; END IF;
 IF p_instructor_id IS NOT NULL THEN
  SELECT * INTO m FROM pc_private.centre_instructors WHERE id=p_instructor_id AND centre_id=auth.uid() AND active;
  IF NOT FOUND THEN RAISE EXCEPTION 'Scegli un istruttore attivo del tuo centro.' USING ERRCODE='22023'; END IF;
 END IF;
 SELECT * INTO old_row FROM pc_private.booking_instructors WHERE booking_id=b.id FOR UPDATE;
 IF FOUND THEN
  IF old_row.instructor_id IS NOT DISTINCT FROM p_instructor_id AND old_row.name_at_assignment IS NOT DISTINCT FROM m.display_name THEN RETURN to_jsonb(old_row); END IF;
  IF p_expected_version IS NULL OR old_row.version<>p_expected_version THEN RAISE EXCEPTION 'Assegnazione cambiata. Ricarica prima di modificarla.' USING ERRCODE='40001'; END IF;
 ELSE
  IF p_expected_version IS NOT NULL THEN RAISE EXCEPTION 'Assegnazione cambiata. Ricarica prima di modificarla.' USING ERRCODE='40001'; END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=p_instructor_id AND NOT t.cancelled
 AND b.start_at<((t.end_date+1)::timestamp AT TIME ZONE 'Europe/Rome') AND b.end_at>(t.start_date::timestamp AT TIME ZONE 'Europe/Rome')) THEN
 RAISE EXCEPTION 'Istruttore indisponibile in questa data. Scegli un altro istruttore o aggiorna il periodo di assenza.' USING ERRCODE='PCX02'; END IF;
 SELECT EXISTS(SELECT 1 FROM pc_private.booking_instructors a JOIN public.bookings other ON other.id=a.booking_id
 WHERE a.centre_id=auth.uid() AND a.instructor_id=p_instructor_id AND a.booking_id<>b.id
 AND other.status IN ('accepted','completed') AND other.start_at<b.end_at AND b.start_at<other.end_at) INTO overlapping;
 IF overlapping AND NOT coalesce(p_allow_overlap,false) THEN
  RAISE EXCEPTION 'Istruttore già assegnato a una lezione nello stesso orario. Conferma soltanto se gli impegni possono essere svolti insieme.' USING ERRCODE='PCX01';
 END IF;
 INSERT INTO pc_private.booking_instructors(booking_id,centre_id,instructor_id,name_at_assignment,overlap_confirmed)
 VALUES(b.id,auth.uid(),p_instructor_id,m.display_name,overlapping AND coalesce(p_allow_overlap,false)) ON CONFLICT(booking_id) DO UPDATE
 SET instructor_id=excluded.instructor_id,name_at_assignment=excluded.name_at_assignment,overlap_confirmed=excluded.overlap_confirmed,version=gen_random_uuid(),updated_at=clock_timestamp()
 RETURNING * INTO new_row;
 INSERT INTO pc_private.centre_team_history(centre_id,booking_id,actor_id,kind,previous_value,new_value)
 VALUES(auth.uid(),b.id,auth.uid(),'assignment',CASE WHEN old_row.booking_id IS NOT NULL THEN to_jsonb(old_row) END,to_jsonb(new_row));
 RETURN to_jsonb(new_row);
END $$;
CREATE OR REPLACE FUNCTION pc_private.get_booking_instructors(p_booking_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Maximum 200 bookings' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('booking_id',b.id,'instructor_id',a.instructor_id,'instructor_name',a.name_at_assignment,
 'instructor_unavailable',CASE WHEN b.professional_id=auth.uid() AND b.status='accepted' THEN EXISTS(
 SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=a.instructor_id AND NOT t.cancelled
 AND b.start_at<((t.end_date+1)::timestamp AT TIME ZONE 'Europe/Rome') AND b.end_at>(t.start_date::timestamp AT TIME ZONE 'Europe/Rome')) ELSE false END,
 'version',a.version,'instructor_active',i.active,'overlap_confirmed',coalesce(a.overlap_confirmed,false),'can_assign',
 b.professional_id=auth.uid() AND p.listing_type='center' AND b.status='accepted'
 AND e.service_type IN ('trainer','enci_course') AND EXISTS(SELECT 1 FROM public.profiles pr WHERE pr.id=auth.uid() AND pr.role='professional')) ORDER BY b.id),'[]') INTO result
 FROM public.bookings b JOIN public.professionals p ON p.id=b.professional_id
 LEFT JOIN pc_private.booking_instructors a ON a.booking_id=b.id
 LEFT JOIN pc_private.centre_instructors i ON i.id=a.instructor_id
 LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
 WHERE b.id=ANY(p_booking_ids) AND auth.uid() IN (b.owner_id,b.professional_id)
 AND (a.booking_id IS NOT NULL OR (p.listing_type='center' AND e.service_type IN ('trainer','enci_course')));
 RETURN result;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
