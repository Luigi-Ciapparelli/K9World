-- Attributed centre lesson notes reuse the existing sessions/revisions and selected sharing.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.centre_memberships ADD COLUMN can_record_notes boolean NOT NULL DEFAULT false;
CREATE TABLE pc_private.centre_session_authors(
 session_id uuid PRIMARY KEY REFERENCES public.professional_sessions(id) ON DELETE RESTRICT,
 centre_id uuid NOT NULL, membership_id uuid NOT NULL, assignment_version uuid NOT NULL,
 author_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
 author_name text NOT NULL, centre_name text NOT NULL
);
CREATE INDEX centre_session_authors_actor ON pc_private.centre_session_authors(author_actor_id,session_id);
CREATE TABLE pc_private.centre_note_consents(
 revision_id uuid PRIMARY KEY REFERENCES public.professional_note_revisions(id) ON DELETE RESTRICT,
 allow_continuity boolean NOT NULL DEFAULT false,
 requested_continuity boolean NOT NULL,
 revoked_at timestamptz,
 CHECK(revoked_at IS NULL OR NOT allow_continuity), CHECK(NOT allow_continuity OR requested_continuity)
);
ALTER TABLE pc_private.centre_session_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.centre_note_consents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.centre_session_authors,pc_private.centre_note_consents FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION pc_private.set_centre_note_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb
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
 IF old.can_record_notes=p_allowed THEN RETURN jsonb_build_object('id',old.id,'version',old.version,'can_record_notes',old.can_record_notes); END IF;
 UPDATE pc_private.centre_memberships SET can_record_notes=p_allowed,version=gen_random_uuid(),updated_at=clock_timestamp()
 WHERE id=old.id RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value)
 VALUES(r.id,r.centre_id,auth.uid(),to_jsonb(old),to_jsonb(r));
 RETURN jsonb_build_object('id',r.id,'version',r.version,'can_record_notes',r.can_record_notes);
END $$;
CREATE FUNCTION pc_private.centre_note_access(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE x record;
BEGIN
 SELECT m.version membership_version,a.version assignment_version,m.centre_id,
 coalesce(nullif(btrim(person.full_name),''),'Istruttore del centro') actor_name,a.name_at_assignment instructor_name
 INTO x
 FROM pc_private.centre_memberships m
 JOIN pc_private.centre_instructors i ON i.id=m.instructor_id AND i.centre_id=m.centre_id AND i.active
 JOIN pc_private.booking_instructors a ON a.instructor_id=i.id AND a.centre_id=m.centre_id
 JOIN public.bookings b ON b.id=a.booking_id AND b.professional_id=m.centre_id
 JOIN pc_private.review_experiences e ON e.booking_id=b.id
 JOIN public.professionals c ON c.id=m.centre_id JOIN public.profiles cp ON cp.id=c.id
 JOIN public.profiles person ON person.id=m.account_id JOIN auth.users u ON u.id=person.id
 WHERE m.id=p_membership_id AND m.account_id=auth.uid() AND m.status='active' AND m.can_record_notes
 AND c.approved IS TRUE AND c.listing_type='center' AND cp.role='professional' AND person.role IN ('owner','professional')
 AND u.email_confirmed_at IS NOT NULL AND b.owner_id<>auth.uid() AND b.start_at>=m.accepted_at
 AND b.id=p_booking_id AND b.status IN ('accepted','completed') AND e.service_type IN ('trainer','enci_course');
 IF NOT FOUND THEN RAISE EXCEPTION 'Note permission unavailable' USING ERRCODE='42501'; END IF;
 IF x.membership_version IS DISTINCT FROM p_membership_version OR x.assignment_version IS DISTINCT FROM p_assignment_version THEN
 RAISE EXCEPTION 'Assignment or permission changed' USING ERRCODE='40001'; END IF;
 RETURN to_jsonb(x);
END $$;
REVOKE ALL ON FUNCTION pc_private.centre_note_access(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;


CREATE FUNCTION pc_private.centre_note_relationship(p_booking_id uuid,p_relationship_id uuid,p_centre_id uuid) RETURNS public.person_dog_relationships
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.person_dog_relationships;
BEGIN
 SELECT rel.* INTO r FROM public.person_dog_relationships rel
 JOIN public.professional_archive_actors a ON a.id=rel.professional_actor_id AND a.live_profile_id=p_centre_id
 JOIN public.professional_archive_actors o ON o.id=rel.authorizing_owner_actor_id
 JOIN public.professional_archive_dogs d ON d.id=rel.dog_archive_id JOIN public.dogs live ON live.id=d.live_dog_id AND live.owner_id=o.live_profile_id
 JOIN public.booking_dogs bd ON bd.dog_id=live.id AND bd.booking_id=p_booking_id
 JOIN public.bookings b ON b.id=bd.booking_id AND b.owner_id=live.owner_id AND b.professional_id=p_centre_id
 WHERE rel.id=p_relationship_id AND rel.status='active' AND b.start_at>=rel.started_at
 AND b.end_at<=statement_timestamp() AND b.status IN ('accepted','completed');
 IF NOT FOUND THEN RAISE EXCEPTION 'Active relationship for this completed lesson required' USING ERRCODE='42501'; END IF;
 RETURN r;
END $$;
REVOKE ALL ON FUNCTION pc_private.centre_note_relationship(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.get_centre_lesson_note_context(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE access jsonb; relationships jsonb;
BEGIN
 access:=pc_private.centre_note_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'dog_name',d.name_at_capture) ORDER BY d.name_at_capture,r.id),'[]') INTO relationships
 FROM public.person_dog_relationships r
 JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id AND a.live_profile_id=(access->>'centre_id')::uuid
 JOIN public.professional_archive_actors o ON o.id=r.authorizing_owner_actor_id
 JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id JOIN public.dogs live ON live.id=d.live_dog_id AND live.owner_id=o.live_profile_id
 JOIN public.booking_dogs bd ON bd.dog_id=live.id AND bd.booking_id=p_booking_id JOIN public.bookings b ON b.id=bd.booking_id AND b.owner_id=live.owner_id
 WHERE r.status='active' AND b.start_at>=r.started_at AND b.end_at<=statement_timestamp();
 RETURN jsonb_build_object('relationships',relationships,'author_name',access->>'actor_name');
END $$;

CREATE FUNCTION pc_private.record_centre_lesson_note(p_request_id uuid,p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_relationship_id uuid,p_activity text,p_body text,p_allow_continuity boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; dog uuid; access jsonb; r public.person_dog_relationships; s public.professional_sessions;
 actor uuid; note uuid; revision uuid; started timestamptz; stamp timestamptz:=clock_timestamp();
BEGIN
 IF p_request_id IS NULL OR p_activity IS NULL OR char_length(btrim(p_activity)) NOT BETWEEN 1 AND 200
 OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 20000 OR p_allow_continuity IS NULL THEN RAISE EXCEPTION 'Invalid note' USING ERRCODE='22023'; END IF;
 SELECT cm.centre_id INTO centre FROM pc_private.centre_memberships cm WHERE cm.id=p_membership_id AND cm.account_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same order as archive registration/relationship closure: centre, dog, relationship, booking.
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 access:=pc_private.centre_note_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 r:=pc_private.centre_note_relationship(p_booking_id,p_relationship_id,centre);
 SELECT live_dog_id INTO dog FROM public.professional_archive_dogs WHERE id=r.dog_archive_id;
 PERFORM 1 FROM public.dogs WHERE id=dog FOR UPDATE;
 PERFORM 1 FROM public.person_dog_relationships WHERE id=r.id FOR UPDATE;
 SELECT start_at INTO started FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 access:=pc_private.centre_note_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 r:=pc_private.centre_note_relationship(p_booking_id,p_relationship_id,centre);
 SELECT * INTO s FROM public.professional_sessions WHERE id=p_request_id;
 IF FOUND THEN
 IF s.relationship_id IS DISTINCT FROM p_relationship_id OR s.source_booking_id IS DISTINCT FROM p_booking_id OR s.activity<>btrim(p_activity)
 OR NOT EXISTS(SELECT 1 FROM pc_private.centre_session_authors ca JOIN public.professional_archive_actors a ON a.id=ca.author_actor_id WHERE ca.session_id=s.id AND a.live_profile_id=auth.uid() AND ca.membership_id=p_membership_id AND ca.assignment_version=p_assignment_version)
 OR NOT EXISTS(SELECT 1 FROM public.dog_professional_notes n JOIN public.professional_note_revisions rev ON rev.note_id=n.id JOIN pc_private.centre_note_consents co ON co.revision_id=rev.id WHERE n.session_id=s.id AND rev.revision_number=1 AND rev.body=btrim(p_body) AND co.requested_continuity=p_allow_continuity)
 THEN RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
 RETURN s.id;
 END IF;
 INSERT INTO public.professional_archive_actors(source_profile_id,live_profile_id,display_name_at_capture)
 VALUES(auth.uid(),auth.uid(),access->>'actor_name') ON CONFLICT(source_profile_id) DO NOTHING;
 SELECT id INTO actor FROM public.professional_archive_actors WHERE live_profile_id=auth.uid();
 INSERT INTO public.professional_sessions(id,relationship_id,booking_id,source_booking_id,occurred_at,activity,status,finalized_at)
 VALUES(p_request_id,r.id,p_booking_id,p_booking_id,started,btrim(p_activity),'finalized',stamp);
 INSERT INTO pc_private.centre_session_authors(session_id,centre_id,membership_id,assignment_version,author_actor_id,author_name,centre_name)
 SELECT p_request_id,centre,p_membership_id,p_assignment_version,actor,access->>'actor_name',a.display_name_at_capture FROM public.professional_archive_actors a WHERE a.id=r.professional_actor_id;
 INSERT INTO public.dog_professional_notes(session_id,status,finalized_at) VALUES(p_request_id,'finalized',stamp) RETURNING id INTO note;
 INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body) VALUES(note,1,actor,btrim(p_body)) RETURNING id INTO revision;
 INSERT INTO pc_private.centre_note_consents(revision_id,allow_continuity,requested_continuity) VALUES(revision,p_allow_continuity,p_allow_continuity);
 RETURN p_request_id;
END $$;

CREATE FUNCTION pc_private.revise_centre_lesson_note(p_note_id uuid,p_expected_revision integer,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_body text,p_reason text,p_allow_continuity boolean DEFAULT false) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE ctx record; dog uuid; latest integer; revision uuid; current_body text; current_reason text; current_allow boolean;
BEGIN
 IF p_expected_revision IS NULL OR p_expected_revision<1 OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 20000
 OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 1 AND 1000 OR p_allow_continuity IS NULL THEN RAISE EXCEPTION 'Invalid revision' USING ERRCODE='22023'; END IF;
 SELECT ca.*,s.booking_id,s.relationship_id INTO ctx FROM public.dog_professional_notes n JOIN public.professional_sessions s ON s.id=n.session_id
 JOIN pc_private.centre_session_authors ca ON ca.session_id=s.id JOIN public.professional_archive_actors a ON a.id=ca.author_actor_id
 WHERE n.id=p_note_id AND a.live_profile_id=auth.uid() AND ca.membership_id=p_membership_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Own centre note required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=ctx.centre_id FOR UPDATE;
 PERFORM pc_private.centre_note_access(ctx.booking_id,p_membership_id,p_membership_version,p_assignment_version);
 PERFORM pc_private.centre_note_relationship(ctx.booking_id,ctx.relationship_id,ctx.centre_id);
 SELECT d.live_dog_id INTO dog FROM public.person_dog_relationships r JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id WHERE r.id=ctx.relationship_id;
 PERFORM 1 FROM public.dogs WHERE id=dog FOR UPDATE;
 PERFORM 1 FROM public.person_dog_relationships WHERE id=ctx.relationship_id FOR UPDATE;
 PERFORM 1 FROM public.bookings WHERE id=ctx.booking_id FOR UPDATE;
 PERFORM pc_private.centre_note_access(ctx.booking_id,p_membership_id,p_membership_version,p_assignment_version);
 PERFORM pc_private.centre_note_relationship(ctx.booking_id,ctx.relationship_id,ctx.centre_id);
 PERFORM 1 FROM public.dog_professional_notes WHERE id=p_note_id FOR UPDATE;
 SELECT rev.revision_number,rev.body,rev.change_reason,c.requested_continuity INTO latest,current_body,current_reason,current_allow
 FROM public.professional_note_revisions rev JOIN pc_private.centre_note_consents c ON c.revision_id=rev.id WHERE rev.note_id=p_note_id ORDER BY rev.revision_number DESC LIMIT 1;
 -- Identical retry after a lost response does not add a second revision or restore revoked consent.
 IF latest=p_expected_revision+1 AND current_body=btrim(p_body) AND current_reason=btrim(p_reason) AND current_allow=p_allow_continuity THEN RETURN latest; END IF;
 IF latest IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE='40001'; END IF;
 INSERT INTO public.professional_note_revisions(note_id,revision_number,editor_actor_id,body,change_reason)
 VALUES(p_note_id,latest+1,ctx.author_actor_id,btrim(p_body),btrim(p_reason)) RETURNING id INTO revision;
 INSERT INTO pc_private.centre_note_consents(revision_id,allow_continuity,requested_continuity) VALUES(revision,p_allow_continuity,p_allow_continuity);
 RETURN latest+1;
END $$;

-- Historical author access is limited to their own text and captured context; no new client data.
CREATE FUNCTION pc_private.list_my_centre_note_revisions(p_booking_id uuid DEFAULT NULL,p_limit integer DEFAULT 30,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid()) THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.occurred_at DESC,x.note_id,x.revision_number DESC),'[]') INTO rows FROM (
 SELECT s.id session_id,n.id note_id,s.source_booking_id booking_id,ca.membership_id,ca.author_name,ca.centre_name,d.name_at_capture dog_name,
 s.occurred_at,s.activity,rev.revision_number,rev.body,rev.change_reason,rev.created_at revision_created_at,c.allow_continuity,
 (EXISTS(SELECT 1 FROM public.professional_continuity_publications pub WHERE pub.note_id=n.id AND pub.withdrawn_at IS NULL)) has_publication,
 count(*) OVER() total_count
 FROM pc_private.centre_session_authors ca JOIN public.professional_archive_actors author ON author.id=ca.author_actor_id AND author.live_profile_id=auth.uid()
 JOIN public.professional_sessions s ON s.id=ca.session_id JOIN public.person_dog_relationships r ON r.id=s.relationship_id
 JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id JOIN public.dog_professional_notes n ON n.session_id=s.id
 JOIN public.professional_note_revisions rev ON rev.note_id=n.id JOIN pc_private.centre_note_consents c ON c.revision_id=rev.id
 WHERE p_booking_id IS NULL OR s.source_booking_id=p_booking_id
 ORDER BY s.occurred_at DESC,n.id,rev.revision_number DESC LIMIT p_limit OFFSET p_offset) x;
 RETURN rows;
END $$;
CREATE FUNCTION pc_private.withdraw_my_centre_note_consent(p_note_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.dog_professional_notes n JOIN pc_private.centre_session_authors ca ON ca.session_id=n.session_id JOIN public.professional_archive_actors a ON a.id=ca.author_actor_id WHERE n.id=p_note_id AND a.live_profile_id=auth.uid()) THEN RAISE EXCEPTION 'Own centre note required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.dog_professional_notes WHERE id=p_note_id FOR UPDATE;
 UPDATE pc_private.centre_note_consents c SET allow_continuity=false,revoked_at=clock_timestamp()
 FROM public.professional_note_revisions r WHERE r.id=c.revision_id AND r.note_id=p_note_id AND c.allow_continuity;
 WITH removed AS (UPDATE public.professional_continuity_publications SET withdrawn_at=clock_timestamp(),withdrawal_reason='author' WHERE note_id=p_note_id AND withdrawn_at IS NULL RETURNING id)
 INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) SELECT 'withdrawn',id,auth.uid(),'author' FROM removed;
 RETURN true;
END $$;

DO $patch$ DECLARE definition text; old text:=$old$m.id,m.can_complete_lessons,m.can_message_clients,m.instructor_id$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.get_my_centre_memberships()'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.get_my_centre_memberships()'; END IF;
 EXECUTE replace(definition,old,$new$m.id,m.can_complete_lessons,m.can_message_clients,m.can_record_notes,m.instructor_id$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$(m.can_message_clients AND b.owner_id<>auth.uid()) can_message,$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.get_my_centre_lessons(timestamp with time zone,timestamp with time zone)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.get_my_centre_lessons(timestamp with time zone,timestamp with time zone)'; END IF;
 EXECUTE replace(definition,old,$new$(m.can_record_notes AND c.approved IS TRUE AND b.owner_id<>auth.uid() AND b.end_at<=statement_timestamp()) can_record_notes,
 (m.can_message_clients AND b.owner_id<>auth.uid()) can_message,$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.revise_own_professional_note(uuid,integer,text,text)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.revise_own_professional_note(uuid,integer,text,text)'; END IF;
 EXECUTE replace(definition,old,$new$IF auth.uid() IS NULL OR EXISTS(SELECT 1 FROM public.dog_professional_notes n JOIN pc_private.centre_session_authors ca ON ca.session_id=n.session_id WHERE n.id=p_note_id) THEN RAISE EXCEPTION 'Use author note revision' USING ERRCODE='42501'; END IF;$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.record_professional_session(uuid,uuid,timestamp with time zone,text,text,uuid)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.record_professional_session(uuid,uuid,timestamp with time zone,text,text,uuid)'; END IF;
 EXECUTE replace(definition,old,$new$IF v_uid IS NULL OR EXISTS(SELECT 1 FROM pc_private.centre_session_authors WHERE session_id=p_request_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$PERFORM 1 FROM public.dog_professional_notes WHERE id=p_note_id FOR UPDATE;$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.prepare_my_continuity_note(uuid,uuid,integer,uuid)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.prepare_my_continuity_note(uuid,uuid,integer,uuid)'; END IF;
 EXECUTE replace(definition,old,$new$PERFORM 1 FROM public.dog_professional_notes WHERE id=p_note_id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.dog_professional_notes n JOIN pc_private.centre_session_authors ca ON ca.session_id=n.session_id WHERE n.id=p_note_id)
 AND NOT EXISTS(SELECT 1 FROM public.professional_note_revisions rev JOIN pc_private.centre_note_consents c ON c.revision_id=rev.id WHERE rev.note_id=p_note_id AND rev.revision_number=p_expected_revision AND c.allow_continuity) THEN RAISE EXCEPTION 'Author consent required' USING ERRCODE='42501'; END IF;$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$coalesce(live.owner_id=o.live_profile_id AND pr.approved IS TRUE AND f.role='professional',false),count(*) OVER()$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.list_my_continuity_notes(integer,integer)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.list_my_continuity_notes(integer,integer)'; END IF;
 EXECUTE replace(definition,old,$new$coalesce(live.owner_id=o.live_profile_id AND pr.approved IS TRUE AND f.role='professional',false) AND (NOT EXISTS(SELECT 1 FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id) OR EXISTS(SELECT 1 FROM pc_private.centre_note_consents c JOIN public.professional_note_revisions nr ON nr.id=c.revision_id WHERE nr.note_id=n.id AND nr.revision_number=rev.revision_number AND c.allow_continuity)),count(*) OVER()$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$d.name_at_capture,a.display_name_at_capture,s.occurred_at$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.list_own_professional_note_revisions(integer,integer)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.list_own_professional_note_revisions(integer,integer)'; END IF;
 EXECUTE replace(definition,old,$new$d.name_at_capture,coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture),s.occurred_at$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$d.name_at_capture,a.display_name_at_capture,s.activity$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.list_owner_continuity_publications(uuid,integer,integer)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.list_owner_continuity_publications(uuid,integer,integer)'; END IF;
 EXECUTE replace(definition,old,$new$d.name_at_capture,coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture),s.activity$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$d.name_at_capture,a.display_name_at_capture,s.activity$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.read_received_continuity_notes(uuid,integer,integer)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.read_received_continuity_notes(uuid,integer,integer)'; END IF;
 EXECUTE replace(definition,old,$new$d.name_at_capture,coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture),s.activity$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$rev.change_reason,rev.created_at revision_created_at,a.display_name_at_capture author_name$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.export_dog_history(text,uuid,timestamp with time zone,timestamp with time zone,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.export_dog_history(text,uuid,timestamp with time zone,timestamp with time zone,boolean)'; END IF;
 EXECUTE replace(definition,old,$new$rev.change_reason,rev.created_at revision_created_at,coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture) author_name$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$NULL::text,rev.created_at,a.display_name_at_capture,a.display_name_at_capture,'shared_revision'$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.export_dog_history(text,uuid,timestamp with time zone,timestamp with time zone,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.export_dog_history(text,uuid,timestamp with time zone,timestamp with time zone,boolean)'; END IF;
 EXECUTE replace(definition,old,$new$NULL::text,rev.created_at,coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture),coalesce((SELECT ca.author_name||' · per '||ca.centre_name FROM pc_private.centre_session_authors ca WHERE ca.session_id=s.id),a.display_name_at_capture),'shared_revision'$new$); END $patch$;

CREATE FUNCTION pc_private.list_professional_note_revisions_v2(p_limit integer DEFAULT 50,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('can_revise',NOT EXISTS(SELECT 1 FROM pc_private.centre_session_authors ca WHERE ca.session_id=x.session_id))),'[]') FROM pc_private.list_own_professional_note_revisions(p_limit,p_offset) x
$$;

CREATE FUNCTION public.set_centre_note_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.set_centre_note_permission(p_membership_id,p_allowed,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.set_centre_note_permission(uuid,boolean,uuid),pc_private.set_centre_note_permission(uuid,boolean,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_centre_note_permission(uuid,boolean,uuid),pc_private.set_centre_note_permission(uuid,boolean,uuid) TO authenticated;

CREATE FUNCTION public.get_centre_lesson_note_context(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_centre_lesson_note_context(p_booking_id,p_membership_id,p_membership_version,p_assignment_version); $$;
REVOKE ALL ON FUNCTION public.get_centre_lesson_note_context(uuid,uuid,uuid,uuid),pc_private.get_centre_lesson_note_context(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_centre_lesson_note_context(uuid,uuid,uuid,uuid),pc_private.get_centre_lesson_note_context(uuid,uuid,uuid,uuid) TO authenticated;

CREATE FUNCTION public.record_centre_lesson_note(p_request_id uuid,p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_relationship_id uuid,p_activity text,p_body text,p_allow_continuity boolean DEFAULT false) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.record_centre_lesson_note(p_request_id,p_booking_id,p_membership_id,p_membership_version,p_assignment_version,p_relationship_id,p_activity,p_body,p_allow_continuity); $$;
REVOKE ALL ON FUNCTION public.record_centre_lesson_note(uuid,uuid,uuid,uuid,uuid,uuid,text,text,boolean),pc_private.record_centre_lesson_note(uuid,uuid,uuid,uuid,uuid,uuid,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.record_centre_lesson_note(uuid,uuid,uuid,uuid,uuid,uuid,text,text,boolean),pc_private.record_centre_lesson_note(uuid,uuid,uuid,uuid,uuid,uuid,text,text,boolean) TO authenticated;

CREATE FUNCTION public.revise_centre_lesson_note(p_note_id uuid,p_expected_revision integer,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_body text,p_reason text,p_allow_continuity boolean DEFAULT false) RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.revise_centre_lesson_note(p_note_id,p_expected_revision,p_membership_id,p_membership_version,p_assignment_version,p_body,p_reason,p_allow_continuity); $$;
REVOKE ALL ON FUNCTION public.revise_centre_lesson_note(uuid,integer,uuid,uuid,uuid,text,text,boolean),pc_private.revise_centre_lesson_note(uuid,integer,uuid,uuid,uuid,text,text,boolean) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.revise_centre_lesson_note(uuid,integer,uuid,uuid,uuid,text,text,boolean),pc_private.revise_centre_lesson_note(uuid,integer,uuid,uuid,uuid,text,text,boolean) TO authenticated;

CREATE FUNCTION public.list_my_centre_note_revisions(p_booking_id uuid DEFAULT NULL,p_limit integer DEFAULT 30,p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.list_my_centre_note_revisions(p_booking_id,p_limit,p_offset); $$;
REVOKE ALL ON FUNCTION public.list_my_centre_note_revisions(uuid,integer,integer),pc_private.list_my_centre_note_revisions(uuid,integer,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.list_my_centre_note_revisions(uuid,integer,integer),pc_private.list_my_centre_note_revisions(uuid,integer,integer) TO authenticated;

CREATE FUNCTION public.withdraw_my_centre_note_consent(p_note_id uuid) RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.withdraw_my_centre_note_consent(p_note_id); $$;
REVOKE ALL ON FUNCTION public.withdraw_my_centre_note_consent(uuid),pc_private.withdraw_my_centre_note_consent(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.withdraw_my_centre_note_consent(uuid),pc_private.withdraw_my_centre_note_consent(uuid) TO authenticated;

CREATE FUNCTION public.list_professional_note_revisions_v2(p_limit integer DEFAULT 50,p_offset integer DEFAULT 0) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.list_professional_note_revisions_v2(p_limit,p_offset); $$;
REVOKE ALL ON FUNCTION public.list_professional_note_revisions_v2(integer,integer),pc_private.list_professional_note_revisions_v2(integer,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.list_professional_note_revisions_v2(integer,integer),pc_private.list_professional_note_revisions_v2(integer,integer) TO authenticated;

NOTIFY pgrst,'reload schema';
COMMIT;
