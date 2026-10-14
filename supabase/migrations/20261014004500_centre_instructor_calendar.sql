-- Centre calendar: explicit confirmation for overlapping lessons, including group lessons.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.booking_instructors ADD COLUMN overlap_confirmed boolean NOT NULL DEFAULT false;
CREATE FUNCTION pc_private.assign_booking_instructor_checked(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL,p_allow_overlap boolean DEFAULT false) RETURNS jsonb
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
-- Keep the old three-argument RPC safe: it cannot silently confirm an overlap.
CREATE OR REPLACE FUNCTION pc_private.assign_booking_instructor(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.assign_booking_instructor_checked(p_booking_id,p_instructor_id,p_expected_version,false);
$$;
CREATE FUNCTION public.assign_booking_instructor_checked(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL,p_allow_overlap boolean DEFAULT false)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.assign_booking_instructor_checked(p_booking_id,p_instructor_id,p_expected_version,p_allow_overlap);
$$;
REVOKE ALL ON FUNCTION pc_private.assign_booking_instructor_checked(uuid,uuid,uuid,boolean),public.assign_booking_instructor_checked(uuid,uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.assign_booking_instructor_checked(uuid,uuid,uuid,boolean),public.assign_booking_instructor_checked(uuid,uuid,uuid,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION pc_private.get_booking_instructors(p_booking_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Maximum 200 bookings' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('booking_id',b.id,'instructor_id',a.instructor_id,'instructor_name',a.name_at_assignment,
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
