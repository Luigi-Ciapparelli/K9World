-- Explicit, narrowly scoped permission to mark assigned lessons performed.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.centre_memberships ADD COLUMN can_complete_lessons boolean NOT NULL DEFAULT false;
CREATE TABLE pc_private.centre_lesson_completions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 booking_id uuid UNIQUE REFERENCES public.bookings(id) ON DELETE SET NULL,
 centre_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
 membership_id uuid NOT NULL, actor_id uuid NOT NULL, actor_name text NOT NULL,
 instructor_name text NOT NULL, assignment_version uuid NOT NULL,
 completed_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE pc_private.centre_lesson_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.centre_lesson_completions FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX centre_lesson_completions_centre ON pc_private.centre_lesson_completions(centre_id,completed_at);

CREATE FUNCTION pc_private.set_centre_lesson_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old pc_private.centre_memberships; r pc_private.centre_memberships;
BEGIN
 PERFORM 1 FROM public.professionals c JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id
 WHERE c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM pc_private.centre_memberships WHERE id=p_membership_id AND centre_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_allowed IS NULL OR old.status<>'active' THEN RAISE EXCEPTION 'Active membership required' USING ERRCODE='22023'; END IF;
 -- Check version before same-value return: a stale administrator cannot overwrite a later decision.
 IF p_expected_version IS DISTINCT FROM old.version THEN RAISE EXCEPTION 'Permission changed' USING ERRCODE='40001'; END IF;
 IF old.can_complete_lessons=p_allowed THEN RETURN jsonb_build_object('id',old.id,'version',old.version,'can_complete_lessons',old.can_complete_lessons); END IF;
 UPDATE pc_private.centre_memberships SET can_complete_lessons=p_allowed,version=gen_random_uuid(),updated_at=clock_timestamp()
 WHERE id=old.id RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value)
 VALUES(r.id,r.centre_id,auth.uid(),to_jsonb(old),to_jsonb(r));
 RETURN jsonb_build_object('id',r.id,'version',r.version,'can_complete_lessons',r.can_complete_lessons);
END $$;

CREATE FUNCTION pc_private.complete_assigned_centre_lesson(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; m pc_private.centre_memberships; b public.bookings; a pc_private.booking_instructors; person_name text; completion pc_private.centre_lesson_completions;
BEGIN
 SELECT centre_id INTO centre FROM pc_private.centre_memberships WHERE id=p_membership_id AND account_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same first lock as assignments, absences, membership/permission revocation and centre completion.
 PERFORM 1 FROM public.professionals c JOIN public.profiles cp ON cp.id=c.id
 WHERE c.id=centre AND c.listing_type='center' AND cp.role='professional' FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO m FROM pc_private.centre_memberships WHERE id=p_membership_id AND account_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR m.status<>'active' OR NOT m.can_complete_lessons OR NOT EXISTS(
 SELECT 1 FROM pc_private.centre_instructors WHERE id=m.instructor_id AND centre_id=centre AND active) THEN
 RAISE EXCEPTION 'Lesson permission unavailable' USING ERRCODE='42501'; END IF;
 SELECT p.full_name INTO person_name FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.id=auth.uid() AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id AND professional_id=centre FOR UPDATE;
 IF NOT FOUND OR b.owner_id=auth.uid() OR b.start_at<m.accepted_at OR NOT EXISTS(
 SELECT 1 FROM pc_private.review_experiences WHERE booking_id=b.id AND service_type IN ('trainer','enci_course')) THEN
 RAISE EXCEPTION 'Lesson unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM pc_private.booking_instructors WHERE booking_id=b.id AND centre_id=centre AND instructor_id=m.instructor_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Lesson no longer assigned' USING ERRCODE='42501'; END IF;
 IF p_membership_version IS DISTINCT FROM m.version OR p_assignment_version IS DISTINCT FROM a.version THEN
 RAISE EXCEPTION 'Assignment or permission changed' USING ERRCODE='40001'; END IF;
 IF b.status='completed' THEN RETURN jsonb_build_object('id',b.id,'status',b.status,'already_completed',true); END IF;
 IF b.status<>'accepted' THEN RAISE EXCEPTION 'Accepted lesson required' USING ERRCODE='22023'; END IF;
 IF b.end_at IS NULL OR b.end_at>clock_timestamp() OR b.end_at<b.start_at THEN
 RAISE EXCEPTION 'Wait until the scheduled lesson ends' USING ERRCODE='PCR01'; END IF;
 -- Existing completion trigger retains review eligibility and the per-booking review scope.
 UPDATE public.bookings SET status='completed' WHERE id=b.id;
 INSERT INTO pc_private.centre_lesson_completions(booking_id,centre_id,membership_id,actor_id,actor_name,instructor_name,assignment_version)
 VALUES(b.id,centre,m.id,auth.uid(),coalesce(nullif(btrim(person_name),''),'Istruttore collegato'),a.name_at_assignment,a.version) RETURNING * INTO completion;
 RETURN jsonb_build_object('id',b.id,'status','completed','already_completed',false,'completed_at',completion.completed_at);
END $$;
CREATE FUNCTION public.set_centre_lesson_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.set_centre_lesson_permission(p_membership_id,p_allowed,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.set_centre_lesson_permission(uuid,boolean,uuid),pc_private.set_centre_lesson_permission(uuid,boolean,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_centre_lesson_permission(uuid,boolean,uuid),pc_private.set_centre_lesson_permission(uuid,boolean,uuid) TO authenticated;
CREATE FUNCTION public.complete_assigned_centre_lesson(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.complete_assigned_centre_lesson(p_booking_id,p_membership_id,p_membership_version,p_assignment_version); $$;
REVOKE ALL ON FUNCTION public.complete_assigned_centre_lesson(uuid,uuid,uuid,uuid),pc_private.complete_assigned_centre_lesson(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.complete_assigned_centre_lesson(uuid,uuid,uuid,uuid),pc_private.complete_assigned_centre_lesson(uuid,uuid,uuid,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION pc_private.get_my_centre_memberships() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.invited_at DESC),'[]') INTO result FROM (
 SELECT m.id,m.can_complete_lessons,m.instructor_id,m.instructor_name,m.account_name,m.version,m.invited_at,m.expires_at,m.accepted_at,
 CASE WHEN m.status='pending' AND m.expires_at<=statement_timestamp() THEN 'expired' ELSE m.status END status,
 m.centre_id=auth.uid() is_centre,coalesce(nullif(p.full_name,''),'Centro cinofilo') centre_name,
 (i.active AND c.listing_type='center' AND p.role='professional') instructor_active
 FROM pc_private.centre_memberships m JOIN public.profiles p ON p.id=m.centre_id
 JOIN public.professionals c ON c.id=m.centre_id JOIN pc_private.centre_instructors i ON i.id=m.instructor_id
 WHERE auth.uid() IN (m.centre_id,m.account_id)
 ORDER BY (m.status IN ('active','pending')) DESC,m.invited_at DESC LIMIT 400) x;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION pc_private.get_my_centre_lessons(p_from timestamptz,p_until timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb; total integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_until IS NULL OR p_until<=p_from OR p_until-p_from>interval '32 days' THEN
 RAISE EXCEPTION 'Scegli un intervallo massimo di 32 giorni.' USING ERRCODE='22023'; END IF;
 -- Only lesson data, no notes, contact details, prices, photos, messages or dog archive.
 WITH allowed AS (
 SELECT b.id,b.start_at,b.end_at,b.status,e.service_name,e.service_type,
 m.id membership_id,m.version membership_version,a.version assignment_version,
 (m.can_complete_lessons AND b.status='accepted' AND b.end_at<=statement_timestamp() AND b.owner_id<>auth.uid()) can_complete,
 (SELECT x.actor_name FROM pc_private.centre_lesson_completions x WHERE x.booking_id=b.id) completed_by,

 coalesce(nullif(cp.full_name,''),'Centro cinofilo') centre_name,a.name_at_assignment instructor_name,
 coalesce(nullif(op.full_name,''),'Cliente') client_name,
 (SELECT coalesce(jsonb_agg(d.name ORDER BY d.name),'[]') FROM public.booking_dogs bd JOIN public.dogs d ON d.id=bd.dog_id WHERE bd.booking_id=b.id) dog_names
 FROM pc_private.centre_memberships m JOIN pc_private.centre_instructors i ON i.id=m.instructor_id AND i.centre_id=m.centre_id
 JOIN pc_private.booking_instructors a ON a.instructor_id=i.id AND a.centre_id=m.centre_id
 JOIN public.bookings b ON b.id=a.booking_id AND b.professional_id=m.centre_id
 JOIN pc_private.review_experiences e ON e.booking_id=b.id
 JOIN public.professionals c ON c.id=m.centre_id JOIN public.profiles cp ON cp.id=c.id
 LEFT JOIN public.profiles op ON op.id=b.owner_id
 JOIN public.profiles person ON person.id=m.account_id JOIN auth.users u ON u.id=person.id
 WHERE m.account_id=auth.uid() AND m.status='active' AND i.active AND c.listing_type='center' AND cp.role='professional'
 AND person.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL
 AND b.status IN ('accepted','completed') AND e.service_type IN ('trainer','enci_course')
 AND b.start_at>=m.accepted_at AND b.start_at<p_until AND b.end_at>p_from)
 SELECT count(*),coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.start_at,t.id) FROM (SELECT * FROM allowed ORDER BY start_at,id LIMIT 300) t),'[]') INTO total,rows FROM allowed;
 RETURN jsonb_build_object('items',rows,'truncated',total>300);
END $$;

CREATE OR REPLACE FUNCTION pc_private.get_booking_instructors(p_booking_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Maximum 200 bookings' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('booking_id',b.id,'instructor_id',a.instructor_id,'instructor_name',a.name_at_assignment,
 'completed_by',CASE WHEN b.professional_id=auth.uid() THEN (SELECT x.actor_name FROM pc_private.centre_lesson_completions x WHERE x.booking_id=b.id) ELSE NULL END,
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
