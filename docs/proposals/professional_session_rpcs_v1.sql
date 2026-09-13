-- DRAFT: disposable test database only. No migration or production UI.
BEGIN;
CREATE FUNCTION public.record_professional_session(
 p_request_id uuid,p_relationship_id uuid,p_occurred_at timestamptz,
 p_activity text,p_body text,p_booking_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 v_uid uuid:=auth.uid(); r public.person_dog_relationships%ROWTYPE;
 s public.professional_sessions%ROWTYPE; v_dog uuid; v_owner uuid;
 v_note uuid; v_now timestamptz;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_occurred_at IS NULL OR p_activity IS NULL OR p_body IS NULL
 OR char_length(btrim(p_activity)) NOT BETWEEN 1 AND 200 OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 20000 THEN
   RAISE EXCEPTION 'Invalid session input' USING ERRCODE='22023';
 END IF;
 SELECT rel.* INTO r FROM public.person_dog_relationships rel
 JOIN public.professional_archive_actors a ON a.id=rel.professional_actor_id
 WHERE rel.id=p_relationship_id AND a.live_profile_id=v_uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_uid AND approved IS TRUE FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=v_uid AND role='professional';
 IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501'; END IF;
 SELECT live_dog_id INTO v_dog FROM public.professional_archive_dogs WHERE id=r.dog_archive_id;
 SELECT owner_id INTO v_owner FROM public.dogs WHERE id=v_dog FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Dog unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.person_dog_relationships WHERE id=p_relationship_id FOR UPDATE;
 IF r.status<>'active' OR NOT EXISTS(SELECT 1 FROM public.professional_archive_actors WHERE id=r.authorizing_owner_actor_id AND live_profile_id=v_owner) THEN
   RAISE EXCEPTION 'Active authorization required' USING ERRCODE='42501';
 END IF;
 v_now:=clock_timestamp();
 IF p_occurred_at<r.started_at OR p_occurred_at>v_now THEN RAISE EXCEPTION 'Activity outside authorized period' USING ERRCODE='22023'; END IF;
 IF p_booking_id IS NOT NULL THEN
   PERFORM 1 FROM public.bookings b WHERE b.id=p_booking_id AND b.professional_id=v_uid AND b.owner_id=v_owner
     AND b.status IN ('accepted','completed') AND EXISTS(SELECT 1 FROM public.booking_dogs bd WHERE bd.booking_id=b.id AND bd.dog_id=v_dog) FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Booking not authorized for this dog' USING ERRCODE='42501'; END IF;
 END IF;
 -- All record calls for a relationship serialize above. IDs are UUIDs supplied
 -- as retry keys, never authority to access someone else's session.
 SELECT * INTO s FROM public.professional_sessions WHERE id=p_request_id;
 IF FOUND THEN
   IF s.relationship_id<>r.id OR s.occurred_at<>p_occurred_at OR s.activity<>btrim(p_activity)
      OR s.source_booking_id IS DISTINCT FROM p_booking_id OR NOT EXISTS(
        SELECT 1 FROM public.dog_professional_notes n JOIN public.professional_note_revisions rev ON rev.note_id=n.id
        WHERE n.session_id=s.id AND rev.revision_number=1 AND rev.body=btrim(p_body)
      ) THEN RAISE EXCEPTION 'Request identifier already used' USING ERRCODE='22023'; END IF;
   RETURN s.id;
 END IF;
 INSERT INTO public.professional_sessions(id,relationship_id,booking_id,source_booking_id,occurred_at,activity,status,finalized_at)
 VALUES(p_request_id,r.id,p_booking_id,p_booking_id,p_occurred_at,btrim(p_activity),'finalized',v_now);
 INSERT INTO public.dog_professional_notes(session_id,status,finalized_at)
 VALUES(p_request_id,'finalized',v_now) RETURNING id INTO v_note;
 INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body)
 VALUES(v_note,1,r.professional_actor_id,btrim(p_body));
 RETURN p_request_id;
END;
$$;

CREATE FUNCTION public.revise_own_professional_note(p_note_id uuid,p_expected_revision integer,p_body text,p_reason text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_actor uuid; v_latest integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_expected_revision IS NULL OR p_expected_revision<1 OR p_body IS NULL OR p_reason IS NULL
 OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 20000 OR char_length(btrim(p_reason)) NOT BETWEEN 1 AND 1000 THEN
   RAISE EXCEPTION 'Invalid revision input' USING ERRCODE='22023';
 END IF;
 SELECT a.id INTO v_actor FROM public.dog_professional_notes n
 JOIN public.professional_sessions s ON s.id=n.session_id
 JOIN public.person_dog_relationships r ON r.id=s.relationship_id
 JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
 WHERE n.id=p_note_id AND a.live_profile_id=auth.uid() FOR UPDATE OF n;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT max(revision_number) INTO v_latest FROM public.professional_note_revisions WHERE note_id=p_note_id;
 IF v_latest IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE='40001'; END IF;
 INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
 VALUES(p_note_id,v_latest+1,v_actor,btrim(p_body),btrim(p_reason));
 RETURN v_latest+1;
END;
$$;

CREATE FUNCTION public.list_own_professional_note_revisions(p_limit integer DEFAULT 50,p_offset integer DEFAULT 0)
RETURNS TABLE(session_id uuid,note_id uuid,dog_name text,author_name text,occurred_at timestamptz,activity text,revision_number integer,body text,change_reason text,revision_created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid pagination' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT s.id,n.id,d.name_at_capture,a.display_name_at_capture,s.occurred_at,s.activity,rev.revision_number,rev.body,rev.change_reason,rev.created_at
 FROM public.professional_sessions s
 JOIN public.person_dog_relationships r ON r.id=s.relationship_id
 JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
 JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id
 JOIN public.dog_professional_notes n ON n.session_id=s.id
 JOIN public.professional_note_revisions rev ON rev.note_id=n.id
 WHERE a.live_profile_id=auth.uid()
 ORDER BY s.occurred_at DESC,s.id,n.id,rev.revision_number DESC
 LIMIT p_limit OFFSET p_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.record_professional_session(uuid,uuid,timestamptz,text,text,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.revise_own_professional_note(uuid,integer,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.list_own_professional_note_revisions(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_professional_session(uuid,uuid,timestamptz,text,text,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revise_own_professional_note(uuid,integer,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_own_professional_note_revisions(integer,integer) TO authenticated;
COMMIT;
