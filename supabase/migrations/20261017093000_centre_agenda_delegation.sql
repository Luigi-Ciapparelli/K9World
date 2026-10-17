-- Explicit, revocable scheduling permission. No impersonation or archive access.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.centre_memberships
 ADD COLUMN can_manage_agenda boolean NOT NULL DEFAULT false,
 ADD COLUMN agenda_granted_at timestamptz,
 ADD CONSTRAINT centre_agenda_grant CHECK(can_manage_agenda=(agenda_granted_at IS NOT NULL));
CREATE TABLE pc_private.centre_agenda_actions(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 centre_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
 booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
 membership_id uuid REFERENCES pc_private.centre_memberships(id) ON DELETE SET NULL,
 actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 actor_name text NOT NULL, assignment_version uuid NOT NULL UNIQUE,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE pc_private.centre_agenda_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.centre_agenda_actions FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE pc_private.centre_agenda_actions_id_seq FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX centre_agenda_actions_booking ON pc_private.centre_agenda_actions(booking_id);

CREATE FUNCTION pc_private.set_centre_agenda_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old pc_private.centre_memberships; r pc_private.centre_memberships;
BEGIN
 PERFORM 1 FROM public.professionals c JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id
 WHERE c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM pc_private.centre_memberships WHERE id=p_membership_id AND centre_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_allowed IS NULL OR old.status<>'active' THEN RAISE EXCEPTION 'Active membership required' USING ERRCODE='22023'; END IF;
 IF p_allowed AND NOT EXISTS(SELECT 1 FROM pc_private.centre_instructors i JOIN public.profiles p ON p.id=old.account_id JOIN auth.users u ON u.id=p.id
  WHERE i.id=old.instructor_id AND i.active AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL) THEN
  RAISE EXCEPTION 'Active verified colleague required' USING ERRCODE='42501'; END IF;
 IF p_expected_version IS DISTINCT FROM old.version THEN RAISE EXCEPTION 'Permission changed' USING ERRCODE='40001'; END IF;
 IF old.can_manage_agenda=p_allowed THEN RETURN jsonb_build_object('id',old.id,'version',old.version,'can_manage_agenda',p_allowed); END IF;
 UPDATE pc_private.centre_memberships SET can_manage_agenda=p_allowed,
 agenda_granted_at=CASE WHEN p_allowed THEN clock_timestamp() END,version=gen_random_uuid(),updated_at=clock_timestamp()
 WHERE id=old.id RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value)
 VALUES(r.id,r.centre_id,auth.uid(),to_jsonb(old),to_jsonb(r));
 RETURN jsonb_build_object('id',r.id,'version',r.version,'can_manage_agenda',r.can_manage_agenda);
END $$;

-- Internal accessor: clients cannot call it or the assignment core directly.
CREATE FUNCTION pc_private.centre_agenda_access(p_membership_id uuid) RETURNS pc_private.centre_memberships
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE m pc_private.centre_memberships;
BEGIN
 SELECT m1.* INTO m FROM pc_private.centre_memberships m1
 JOIN pc_private.centre_instructors i ON i.id=m1.instructor_id AND i.centre_id=m1.centre_id
 JOIN public.professionals c ON c.id=m1.centre_id JOIN public.profiles cp ON cp.id=c.id
 JOIN public.profiles person ON person.id=m1.account_id JOIN auth.users u ON u.id=person.id
 WHERE m1.id=p_membership_id AND m1.account_id=auth.uid() AND m1.status='active' AND m1.can_manage_agenda
 AND i.active AND c.listing_type='center' AND cp.role='professional'
 AND person.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Agenda permission unavailable' USING ERRCODE='42501'; END IF;
 RETURN m;
END $$;
REVOKE ALL ON FUNCTION pc_private.centre_agenda_access(uuid) FROM PUBLIC,anon,authenticated,service_role;

-- Extract the already-tested assignment rules without changing the caller identity.
-- Keep weekly shifts, hourly absences, group confirmation and version checks identical.
DO $patch$ DECLARE definition text; marker text:=$m$VALUES(auth.uid(),b.id,auth.uid(),'assignment'$m$; BEGIN
 SELECT pg_get_functiondef('pc_private.assign_booking_instructor_checked(uuid,uuid,uuid,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,marker,'')))/length(marker)<>1
 OR position('instructor_shift_covers' IN definition)=0 OR position('t.end_time' IN definition)=0 THEN
 RAISE EXCEPTION 'Unexpected assignment contract'; END IF;
 definition:=replace(definition,'pc_private.assign_booking_instructor_checked(', 'pc_private.assign_centre_instructor_core(p_centre_id uuid, ');
 definition:=replace(definition,marker,$m$VALUES(auth.uid(),b.id,pc_actor(),'assignment'$m$);
 definition:=replace(definition,'auth.uid()','p_centre_id');
 definition:=replace(definition,'pc_actor()','auth.uid()');
 EXECUTE definition;
END $patch$;
REVOKE ALL ON FUNCTION pc_private.assign_centre_instructor_core(uuid,uuid,uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
CREATE OR REPLACE FUNCTION pc_private.assign_booking_instructor_checked(p_booking_id uuid,p_instructor_id uuid,p_expected_version uuid DEFAULT NULL,p_allow_overlap boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN pc_private.assign_centre_instructor_core(auth.uid(),p_booking_id,p_instructor_id,p_expected_version,p_allow_overlap);
END $$;

CREATE FUNCTION pc_private.get_delegated_centre_agenda(p_membership_id uuid,p_day date,p_page integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE m pc_private.centre_memberships; rows jsonb; total integer; roster jsonb; centre_name text; begins timestamptz; ends timestamptz;
BEGIN
 m:=pc_private.centre_agenda_access(p_membership_id);
 IF p_day IS NULL OR NOT isfinite(p_day) OR p_page IS NULL OR p_page<0 OR p_page>1000 THEN RAISE EXCEPTION 'Invalid day or page' USING ERRCODE='22023'; END IF;
 begins:=p_day::timestamp AT TIME ZONE 'Europe/Rome'; ends:=(p_day+1)::timestamp AT TIME ZONE 'Europe/Rome';
 SELECT coalesce(nullif(full_name,''),'Centro cinofilo') INTO centre_name FROM public.profiles WHERE id=m.centre_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'name',display_name) ORDER BY display_name,id),'[]') INTO roster
 FROM pc_private.centre_instructors WHERE centre_id=m.centre_id AND active AND id<>m.instructor_id;
 WITH allowed AS (
 SELECT b.id,b.start_at,b.end_at,b.status,e.service_name,
 coalesce(nullif(op.full_name,''),'Cliente') client_name,
 (SELECT coalesce(jsonb_agg(d.name ORDER BY d.name),'[]') FROM public.booking_dogs bd JOIN public.dogs d ON d.id=bd.dog_id WHERE bd.booking_id=b.id) dog_names,
 a.instructor_id,a.name_at_assignment instructor_name,a.version assignment_version,
 (b.status='accepted' AND b.start_at>statement_timestamp() AND b.owner_id<>auth.uid() AND a.instructor_id IS DISTINCT FROM m.instructor_id) can_assign,
 (a.instructor_id=m.instructor_id OR b.owner_id=auth.uid()) managed_by_centre,
 (a.instructor_id IS NOT NULL AND NOT pc_private.instructor_shift_covers(a.instructor_id,b.start_at,b.end_at)) outside_shift,
 EXISTS(SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=a.instructor_id AND NOT t.cancelled AND b.start_at<CASE WHEN t.end_time IS NULL THEN ((t.end_date+1)::timestamp AT TIME ZONE 'Europe/Rome') ELSE ((t.end_date+t.end_time) AT TIME ZONE 'Europe/Rome') END AND b.end_at>((t.start_date+coalesce(t.start_time,time '00:00')) AT TIME ZONE 'Europe/Rome')) instructor_unavailable,
 coalesce(a.overlap_confirmed,false) overlap_confirmed,
 (SELECT h.actor_name FROM pc_private.centre_agenda_actions h WHERE h.booking_id=b.id AND h.assignment_version=a.version) assigned_by
 FROM public.bookings b JOIN pc_private.review_experiences e ON e.booking_id=b.id
 LEFT JOIN public.profiles op ON op.id=b.owner_id LEFT JOIN pc_private.booking_instructors a ON a.booking_id=b.id
 WHERE b.professional_id=m.centre_id AND b.status IN ('accepted','completed') AND e.service_type IN ('trainer','enci_course')
 AND b.start_at>=m.agenda_granted_at AND b.start_at<ends AND b.end_at>begins)
 SELECT count(*),coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.start_at,t.id) FROM (SELECT * FROM allowed ORDER BY start_at,id LIMIT 50 OFFSET p_page*50) t),'[]') INTO total,rows FROM allowed;
 RETURN jsonb_build_object('centre_name',centre_name,'membership_version',m.version,'day',p_day,'page',p_page,'total',total,'items',rows,'members',roster);
END $$;

CREATE FUNCTION pc_private.assign_delegated_centre_instructor(p_membership_id uuid,p_membership_version uuid,p_booking_id uuid,p_instructor_id uuid,p_assignment_version uuid,p_allow_overlap boolean DEFAULT false) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; m pc_private.centre_memberships; b public.bookings; old pc_private.booking_instructors; result jsonb; actor_name text;
BEGIN
 SELECT centre_id INTO centre FROM pc_private.centre_memberships WHERE id=p_membership_id AND account_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Agenda permission unavailable' USING ERRCODE='42501'; END IF;
 -- Shared lock order with grants, revocations, roster, assignments, shifts and absences.
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 m:=pc_private.centre_agenda_access(p_membership_id);
 IF m.version IS DISTINCT FROM p_membership_version THEN RAISE EXCEPTION 'Permission changed' USING ERRCODE='40001'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND professional_id=m.centre_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM pc_private.booking_instructors WHERE booking_id=b.id FOR UPDATE;
 -- A coordinator cannot self-assign to gain conversation/note access or alter own bookings.
 IF p_instructor_id=m.instructor_id OR old.instructor_id=m.instructor_id OR b.owner_id=auth.uid() THEN
 RAISE EXCEPTION 'Own lessons require the centre' USING ERRCODE='PCA01'; END IF;
 IF b.start_at<m.agenda_granted_at OR b.start_at<=clock_timestamp() THEN
 RAISE EXCEPTION 'Future lesson required' USING ERRCODE='22023'; END IF;
 result:=pc_private.assign_centre_instructor_core(m.centre_id,b.id,p_instructor_id,p_assignment_version,p_allow_overlap);
 IF old.version IS DISTINCT FROM (result->>'version')::uuid THEN
 SELECT coalesce(nullif(btrim(full_name),''),'Collaboratore del centro') INTO actor_name FROM public.profiles WHERE id=auth.uid();
 INSERT INTO pc_private.centre_agenda_actions(centre_id,booking_id,membership_id,actor_id,actor_name,assignment_version)
 VALUES(m.centre_id,b.id,m.id,auth.uid(),actor_name,(result->>'version')::uuid);
 END IF;
 RETURN jsonb_build_object('booking_id',b.id,'version',result->>'version');
END $$;

CREATE FUNCTION public.set_centre_agenda_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.set_centre_agenda_permission(p_membership_id,p_allowed,p_expected_version); $$;
CREATE FUNCTION public.get_delegated_centre_agenda(p_membership_id uuid,p_day date,p_page integer DEFAULT 0) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_delegated_centre_agenda(p_membership_id,p_day,p_page); $$;
CREATE FUNCTION public.assign_delegated_centre_instructor(p_membership_id uuid,p_membership_version uuid,p_booking_id uuid,p_instructor_id uuid,p_assignment_version uuid,p_allow_overlap boolean DEFAULT false) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.assign_delegated_centre_instructor(p_membership_id,p_membership_version,p_booking_id,p_instructor_id,p_assignment_version,p_allow_overlap); $$;
REVOKE ALL ON FUNCTION public.set_centre_agenda_permission(uuid,boolean,uuid),pc_private.set_centre_agenda_permission(uuid,boolean,uuid),public.get_delegated_centre_agenda(uuid,date,integer),pc_private.get_delegated_centre_agenda(uuid,date,integer),public.assign_delegated_centre_instructor(uuid,uuid,uuid,uuid,uuid,boolean),pc_private.assign_delegated_centre_instructor(uuid,uuid,uuid,uuid,uuid,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_centre_agenda_permission(uuid,boolean,uuid),pc_private.set_centre_agenda_permission(uuid,boolean,uuid),public.get_delegated_centre_agenda(uuid,date,integer),pc_private.get_delegated_centre_agenda(uuid,date,integer),public.assign_delegated_centre_instructor(uuid,uuid,uuid,uuid,uuid,boolean),pc_private.assign_delegated_centre_instructor(uuid,uuid,uuid,uuid,uuid,boolean) TO authenticated;
DO $patch$ DECLARE definition text; BEGIN
 SELECT pg_get_functiondef('pc_private.get_my_centre_memberships()'::regprocedure) INTO definition;
 IF position('SELECT m.id,' IN definition)=0 THEN RAISE EXCEPTION 'Unexpected membership contract'; END IF;
 EXECUTE replace(definition,'SELECT m.id,','SELECT m.id,m.can_manage_agenda,m.agenda_granted_at,');
 SELECT pg_get_functiondef('pc_private.get_booking_instructors(uuid[])'::regprocedure) INTO definition;
 IF position($m$'version',a.version$m$ IN definition)=0 THEN RAISE EXCEPTION 'Unexpected assignment reader'; END IF;
 EXECUTE replace(definition,$m$'version',a.version$m$,$m$'assigned_by',CASE WHEN b.professional_id=auth.uid() THEN (SELECT h.actor_name FROM pc_private.centre_agenda_actions h WHERE h.booking_id=b.id AND h.assignment_version=a.version) END,'version',a.version$m$);
END $patch$;
NOTIFY pgrst,'reload schema';
COMMIT;
