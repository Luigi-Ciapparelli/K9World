-- Private professional relationships, sessions and note revisions.
-- Promoted from the three integration-tested proposals; no backfill or media.
BEGIN;

-- Source proposal: professional_continuity_v1.sql
-- Persistent historical identities. No independent public/person/dog profile.
-- Snapshot values must eventually be captured server-side from existing rows;
-- they must not be accepted as authoritative values supplied by a client.
CREATE TABLE public.professional_archive_actors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_profile_id uuid NOT NULL UNIQUE,
  live_profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name_at_capture text NOT NULL CHECK (char_length(display_name_at_capture) BETWEEN 1 AND 200),
  captured_at timestamptz NOT NULL DEFAULT now(),
  CHECK (live_profile_id IS NULL OR live_profile_id = source_profile_id)
);

CREATE TABLE public.professional_archive_dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_dog_id uuid NOT NULL UNIQUE,
  live_dog_id uuid UNIQUE REFERENCES public.dogs(id) ON DELETE SET NULL,
  name_at_capture text NOT NULL CHECK (char_length(name_at_capture) BETWEEN 1 AND 200),
  captured_at timestamptz NOT NULL DEFAULT now(),
  CHECK (live_dog_id IS NULL OR live_dog_id = source_dog_id)
);

-- Initial use case is trainer only. This is not a backfill/replacement of
-- dogs.owner_id. Future handler/co-owner roles need their own reviewed rules.
-- Two-sided activation: owner authorization + professional acceptance.
CREATE TABLE public.person_dog_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_archive_id uuid NOT NULL REFERENCES public.professional_archive_dogs(id) ON DELETE RESTRICT,
  professional_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  authorizing_owner_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  relationship_type text NOT NULL DEFAULT 'trainer' CHECK (relationship_type = 'trainer'),
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'ended', 'revoked', 'declined')),
  authorized_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  revoked_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (professional_actor_id <> authorizing_owner_actor_id),
  CHECK (accepted_at IS NULL OR accepted_at >= authorized_at),
  CHECK (started_at IS NULL OR (accepted_at IS NOT NULL AND started_at >= accepted_at)),
  CHECK (ended_at IS NULL OR (started_at IS NOT NULL AND ended_at >= started_at)),
  CHECK (revoked_at IS NULL OR revoked_at >= authorized_at),
  CHECK (declined_at IS NULL OR declined_at >= authorized_at),
  CHECK (
    (status = 'invited' AND accepted_at IS NULL AND started_at IS NULL AND ended_at IS NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'active' AND accepted_at IS NOT NULL AND started_at IS NOT NULL AND ended_at IS NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'ended' AND accepted_at IS NOT NULL AND started_at IS NOT NULL AND ended_at IS NOT NULL AND revoked_at IS NULL AND declined_at IS NULL)
    OR (status = 'revoked' AND revoked_at IS NOT NULL AND declined_at IS NULL AND (started_at IS NULL OR ended_at IS NOT NULL))
    OR (status = 'declined' AND declined_at IS NOT NULL AND accepted_at IS NULL AND started_at IS NULL AND ended_at IS NULL AND revoked_at IS NULL)
  )
);
CREATE UNIQUE INDEX person_dog_relationships_one_open_trainer
ON public.person_dog_relationships(dog_archive_id, professional_actor_id)
WHERE status IN ('invited', 'active');
CREATE INDEX person_dog_relationships_author ON public.person_dog_relationships(professional_actor_id, created_at DESC);
CREATE INDEX person_dog_relationships_owner ON public.person_dog_relationships(authorizing_owner_actor_id, created_at DESC);

-- Session references relationship to derive the historical dog and author.
-- Removing a booking only clears an optional operational link.
CREATE TABLE public.professional_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_id uuid NOT NULL REFERENCES public.person_dog_relationships(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  source_booking_id uuid,
  occurred_at timestamptz NOT NULL,
  activity text NOT NULL CHECK (char_length(btrim(activity)) BETWEEN 1 AND 200),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  CHECK (booking_id IS NULL OR (source_booking_id IS NOT NULL AND booking_id = source_booking_id)),
  CHECK ((status = 'draft' AND finalized_at IS NULL) OR (status = 'finalized' AND finalized_at IS NOT NULL AND finalized_at >= created_at))
);
CREATE INDEX professional_sessions_relationship ON public.professional_sessions(relationship_id, occurred_at DESC);
CREATE INDEX professional_sessions_booking ON public.professional_sessions(booking_id) WHERE booking_id IS NOT NULL;

-- Phase one is PRIVATE ONLY. Sharing is deliberately not represented as a
-- boolean flag that might accidentally bypass the future grant model.
CREATE TABLE public.dog_professional_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.professional_sessions(id) ON DELETE RESTRICT,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility = 'private'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'finalized')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finalized_at timestamptz,
  CHECK ((status = 'draft' AND finalized_at IS NULL) OR (status = 'finalized' AND finalized_at IS NOT NULL AND finalized_at >= created_at))
);
CREATE INDEX dog_professional_notes_session ON public.dog_professional_notes(session_id, created_at);

CREATE TABLE public.professional_note_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.dog_professional_notes(id) ON DELETE RESTRICT,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  editor_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 20000),
  change_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, revision_number),
  CHECK (revision_number = 1 OR (change_reason IS NOT NULL AND char_length(btrim(change_reason)) BETWEEN 1 AND 1000))
);
CREATE INDEX professional_note_revisions_editor ON public.professional_note_revisions(editor_actor_id);

-- Fail closed explicitly, independently of default privileges.
ALTER TABLE public.professional_archive_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_archive_dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_dog_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dog_professional_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_note_revisions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE
  public.professional_archive_actors,
  public.professional_archive_dogs,
  public.person_dog_relationships,
  public.professional_sessions,
  public.dog_professional_notes,
  public.professional_note_revisions
FROM PUBLIC, anon, authenticated;

-- No policies, application RPCs, buckets, grants, backfills, jobs or changes
-- to current profiles/dogs/bookings/storage. PostgreSQL owners and privileged
-- server roles are NOT constrained by this application-level denial.

-- Source proposal: professional_relationship_rpcs_v1.sql
CREATE FUNCTION public.invite_dog_professional(p_dog_id uuid, p_professional_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid := auth.uid(); v_dog public.dogs%ROWTYPE;
  v_owner public.profiles%ROWTYPE; v_pro public.profiles%ROWTYPE;
  v_actor uuid; v_owner_actor uuid; v_dog_archive uuid;
  v_rel public.person_dog_relationships%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR p_professional_id IS NULL OR p_professional_id = v_uid THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  -- Lock professional approval, then dog, then relationship.
  PERFORM 1 FROM public.professionals WHERE id=p_professional_id AND approved IS TRUE FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_pro FROM public.profiles WHERE id=p_professional_id;
  IF NOT FOUND OR v_pro.role <> 'professional' OR v_pro.role IS NULL THEN
    RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v_dog FROM public.dogs WHERE id=p_dog_id FOR UPDATE;
  IF NOT FOUND OR v_dog.owner_id <> v_uid THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_owner FROM public.profiles WHERE id=v_uid;
  IF NOT FOUND OR v_owner.role IS DISTINCT FROM 'owner' OR v_owner.email_verified IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Verified owner required' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.professional_archive_actors(source_profile_id,live_profile_id,display_name_at_capture)
    VALUES(v_uid,v_uid,left(coalesce(nullif(btrim(v_owner.full_name),''),'Proprietario'),200))
    ON CONFLICT(source_profile_id) DO NOTHING;
  INSERT INTO public.professional_archive_actors(source_profile_id,live_profile_id,display_name_at_capture)
    VALUES(p_professional_id,p_professional_id,left(coalesce(nullif(btrim(v_pro.full_name),''),'Professionista'),200))
    ON CONFLICT(source_profile_id) DO NOTHING;
  SELECT id INTO v_owner_actor FROM public.professional_archive_actors WHERE source_profile_id=v_uid AND live_profile_id=v_uid;
  SELECT id INTO v_actor FROM public.professional_archive_actors WHERE source_profile_id=p_professional_id AND live_profile_id=p_professional_id;
  IF v_owner_actor IS NULL OR v_actor IS NULL THEN RAISE EXCEPTION 'Archive identity unavailable' USING ERRCODE='42501'; END IF;
  INSERT INTO public.professional_archive_dogs(source_dog_id,live_dog_id,name_at_capture)
    VALUES(p_dog_id,p_dog_id,left(coalesce(nullif(btrim(v_dog.name),''),'Cane'),200))
    ON CONFLICT(source_dog_id) DO NOTHING;
  SELECT id INTO v_dog_archive FROM public.professional_archive_dogs WHERE source_dog_id=p_dog_id AND live_dog_id=p_dog_id;
  IF v_dog_archive IS NULL THEN RAISE EXCEPTION 'Archive identity unavailable' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_rel FROM public.person_dog_relationships
    WHERE dog_archive_id=v_dog_archive AND professional_actor_id=v_actor AND status IN ('invited','active') FOR UPDATE;
  IF FOUND THEN
    IF v_rel.authorizing_owner_actor_id<>v_owner_actor THEN
      RAISE EXCEPTION 'Previous authorization must be revoked' USING ERRCODE='55000';
    END IF;
    RETURN v_rel.id;
  END IF;
  INSERT INTO public.person_dog_relationships(dog_archive_id,professional_actor_id,authorizing_owner_actor_id)
    VALUES(v_dog_archive,v_actor,v_owner_actor) RETURNING id INTO v_rel.id;
  RETURN v_rel.id;
END;
$$;

CREATE FUNCTION public.respond_dog_relationship(p_relationship_id uuid,p_accept boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid:=auth.uid(); v_rel public.person_dog_relationships%ROWTYPE;
  v_pro uuid; v_owner uuid; v_dog uuid; v_now timestamptz;
BEGIN
  IF v_uid IS NULL OR p_accept IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  SELECT r.* INTO v_rel FROM public.person_dog_relationships r
    JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
    WHERE r.id=p_relationship_id AND a.live_profile_id=v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.professionals WHERE id=v_uid AND approved IS TRUE FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.profiles WHERE id=v_uid AND role='professional';
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional unavailable' USING ERRCODE='42501'; END IF;
  SELECT live_dog_id INTO v_dog FROM public.professional_archive_dogs WHERE id=v_rel.dog_archive_id;
  SELECT owner_id INTO v_owner FROM public.dogs WHERE id=v_dog FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dog unavailable' USING ERRCODE='42501'; END IF;
  SELECT * INTO v_rel FROM public.person_dog_relationships WHERE id=p_relationship_id FOR UPDATE;
  IF NOT EXISTS(SELECT 1 FROM public.professional_archive_actors WHERE id=v_rel.authorizing_owner_actor_id AND live_profile_id=v_owner) THEN
    RAISE EXCEPTION 'Owner authorization no longer valid' USING ERRCODE='42501';
  END IF;
  IF (p_accept AND v_rel.status='active') OR (NOT p_accept AND v_rel.status='declined') THEN RETURN v_rel.status; END IF;
  IF v_rel.status<>'invited' THEN RAISE EXCEPTION 'Invitation is no longer pending' USING ERRCODE='55000'; END IF;
  v_now:=clock_timestamp();
  IF p_accept THEN
    UPDATE public.person_dog_relationships SET status='active',accepted_at=v_now,started_at=v_now WHERE id=p_relationship_id;
    RETURN 'active';
  ELSE
    UPDATE public.person_dog_relationships SET status='declined',declined_at=v_now WHERE id=p_relationship_id;
    RETURN 'declined';
  END IF;
END;
$$;

CREATE FUNCTION public.close_dog_relationship(p_relationship_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_uid uuid:=auth.uid(); v_rel public.person_dog_relationships%ROWTYPE;
  v_pro uuid; v_original_owner uuid; v_current_owner uuid; v_dog uuid; v_now timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  -- Resolve identifiers; ownership and relationship are rechecked under locks.
  SELECT * INTO v_rel FROM public.person_dog_relationships WHERE id=p_relationship_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  SELECT live_profile_id INTO v_pro FROM public.professional_archive_actors WHERE id=v_rel.professional_actor_id;
  SELECT live_profile_id INTO v_original_owner FROM public.professional_archive_actors WHERE id=v_rel.authorizing_owner_actor_id;
  SELECT live_dog_id INTO v_dog FROM public.professional_archive_dogs WHERE id=v_rel.dog_archive_id;
  SELECT owner_id INTO v_current_owner FROM public.dogs WHERE id=v_dog;
  IF v_uid IS DISTINCT FROM v_pro AND v_uid IS DISTINCT FROM v_original_owner AND v_uid IS DISTINCT FROM v_current_owner THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  PERFORM 1 FROM public.professionals WHERE id=v_pro FOR UPDATE;
  v_current_owner:=NULL;
  SELECT owner_id INTO v_current_owner FROM public.dogs WHERE id=v_dog FOR UPDATE;
  SELECT * INTO v_rel FROM public.person_dog_relationships WHERE id=p_relationship_id FOR UPDATE;
  IF v_uid IS DISTINCT FROM v_pro AND v_uid IS DISTINCT FROM v_original_owner AND v_uid IS DISTINCT FROM v_current_owner THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501';
  END IF;
  IF v_rel.status IN ('revoked','ended','declined') THEN RETURN v_rel.status; END IF;
  v_now:=clock_timestamp();
  IF v_uid=v_pro AND v_rel.status='active' THEN
    UPDATE public.person_dog_relationships SET status='ended',ended_at=v_now WHERE id=p_relationship_id;
    RETURN 'ended';
  ELSE
    UPDATE public.person_dog_relationships SET status='revoked',revoked_at=v_now,
      ended_at=CASE WHEN started_at IS NULL THEN NULL ELSE v_now END WHERE id=p_relationship_id;
    RETURN 'revoked';
  END IF;
END;
$$;

-- Minimal inbox/history projection. Not dog/profile/general archive access.
CREATE FUNCTION public.list_my_dog_relationships()
RETURNS TABLE(id uuid,dog_name text,professional_name text,status text,authorized_at timestamptz,accepted_at timestamptz,ended_at timestamptz,revoked_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT r.id,d.name_at_capture,p.display_name_at_capture,r.status,r.authorized_at,r.accepted_at,r.ended_at,r.revoked_at
    FROM public.person_dog_relationships r
    JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id
    JOIN public.professional_archive_actors p ON p.id=r.professional_actor_id
    JOIN public.professional_archive_actors o ON o.id=r.authorizing_owner_actor_id
    LEFT JOIN public.dogs live_dog ON live_dog.id=d.live_dog_id
    WHERE p.live_profile_id=auth.uid() OR o.live_profile_id=auth.uid() OR live_dog.owner_id=auth.uid()
    ORDER BY r.authorized_at DESC,r.id;
END;
$$;
REVOKE ALL ON FUNCTION public.invite_dog_professional(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.respond_dog_relationship(uuid,boolean) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.close_dog_relationship(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.list_my_dog_relationships() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.invite_dog_professional(uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_dog_relationship(uuid,boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.close_dog_relationship(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_dog_relationships() TO authenticated;

-- Source proposal: professional_session_rpcs_v1.sql
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
