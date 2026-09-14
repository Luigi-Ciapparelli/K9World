-- Explicit publication of one note revision and time-limited successor access.
-- Existing notes remain private; no backfill, byte copies, media or public views.
BEGIN;
CREATE TABLE public.professional_continuity_publications (
 id uuid PRIMARY KEY,
 note_id uuid NOT NULL REFERENCES public.dog_professional_notes(id) ON DELETE RESTRICT,
 revision_number integer NOT NULL,
 dog_archive_id uuid NOT NULL REFERENCES public.professional_archive_dogs(id) ON DELETE RESTRICT,
 author_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
 owner_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 withdrawn_at timestamptz,
 withdrawal_reason text CHECK(withdrawal_reason IN ('author','revision','ownership','dog_deleted','superseded')),
 FOREIGN KEY(note_id,revision_number) REFERENCES public.professional_note_revisions(note_id,revision_number) ON DELETE RESTRICT,
 CHECK((withdrawn_at IS NULL AND withdrawal_reason IS NULL) OR (withdrawn_at>=created_at AND withdrawal_reason IS NOT NULL))
);
CREATE UNIQUE INDEX professional_continuity_one_live_note ON public.professional_continuity_publications(note_id) WHERE withdrawn_at IS NULL;
CREATE INDEX professional_continuity_dog ON public.professional_continuity_publications(dog_archive_id,created_at DESC);
CREATE TABLE public.continuity_access_grants (
 id uuid PRIMARY KEY,
 relationship_id uuid NOT NULL REFERENCES public.person_dog_relationships(id) ON DELETE RESTRICT,
 dog_archive_id uuid NOT NULL REFERENCES public.professional_archive_dogs(id) ON DELETE RESTRICT,
 grantor_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
 recipient_actor_id uuid NOT NULL REFERENCES public.professional_archive_actors(id) ON DELETE RESTRICT,
 purpose text NOT NULL CHECK(char_length(btrim(purpose)) BETWEEN 1 AND 500),
 duration_days integer NOT NULL CHECK(duration_days BETWEEN 1 AND 365),
 created_at timestamptz NOT NULL,
 expires_at timestamptz NOT NULL CHECK(expires_at>created_at),
 revoked_at timestamptz,
 revocation_reason text CHECK(revocation_reason IN ('owner','relationship','ownership','dog_deleted')),
 CHECK((revoked_at IS NULL AND revocation_reason IS NULL) OR (revoked_at>=created_at AND revocation_reason IS NOT NULL))
);
CREATE INDEX continuity_grants_recipient ON public.continuity_access_grants(recipient_actor_id,created_at DESC);
CREATE INDEX continuity_grants_dog ON public.continuity_access_grants(dog_archive_id,created_at DESC);
CREATE INDEX continuity_grants_relationship ON public.continuity_access_grants(relationship_id);
CREATE TABLE public.continuity_grant_items (
 grant_id uuid NOT NULL REFERENCES public.continuity_access_grants(id) ON DELETE RESTRICT,
 publication_id uuid NOT NULL REFERENCES public.professional_continuity_publications(id) ON DELETE RESTRICT,
 PRIMARY KEY(grant_id,publication_id)
);
CREATE INDEX continuity_items_publication ON public.continuity_grant_items(publication_id);
CREATE TABLE public.professional_continuity_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_kind text NOT NULL CHECK(event_kind IN ('published','withdrawn','granted','revoked','read')),
 resource_id uuid NOT NULL,
 actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 reason text,
 occurred_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX professional_continuity_audit_resource ON public.professional_continuity_audit(resource_id,occurred_at);
ALTER TABLE public.professional_continuity_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.continuity_grant_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_continuity_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_continuity_publications,public.continuity_access_grants,public.continuity_grant_items,public.professional_continuity_audit FROM PUBLIC,anon,authenticated;

-- Retirement is monotone: transferring a dog back or opening another relationship
-- never reactivates an old publication or grant.
CREATE FUNCTION public.retire_continuity_on_dog_change() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_dog uuid; v_reason text; v_id uuid; v_actor uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.owner_id IS NOT DISTINCT FROM OLD.owner_id THEN RETURN NEW; END IF;
 SELECT id INTO v_dog FROM public.professional_archive_dogs WHERE source_dog_id=OLD.id;
 IF v_dog IS NULL THEN RETURN NULL; END IF;
 v_reason:=CASE WHEN TG_OP='DELETE' THEN 'dog_deleted' ELSE 'ownership' END;
 SELECT id INTO v_actor FROM public.profiles WHERE id=auth.uid();
 FOR v_id IN UPDATE public.professional_continuity_publications SET withdrawn_at=clock_timestamp(),withdrawal_reason=v_reason
   WHERE dog_archive_id=v_dog AND withdrawn_at IS NULL RETURNING id LOOP
  INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('withdrawn',v_id,v_actor,v_reason);
 END LOOP;
 FOR v_id IN UPDATE public.continuity_access_grants SET revoked_at=clock_timestamp(),revocation_reason=v_reason
   WHERE dog_archive_id=v_dog AND revoked_at IS NULL RETURNING id LOOP
  INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('revoked',v_id,v_actor,v_reason);
 END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER retire_continuity_dog AFTER UPDATE OF owner_id OR DELETE ON public.dogs FOR EACH ROW EXECUTE FUNCTION public.retire_continuity_on_dog_change();

CREATE FUNCTION public.retire_continuity_on_relationship_close() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_actor uuid;
BEGIN
 IF OLD.status='active' AND NEW.status<>'active' THEN
  SELECT id INTO v_actor FROM public.profiles WHERE id=auth.uid();
  FOR v_id IN UPDATE public.continuity_access_grants SET revoked_at=clock_timestamp(),revocation_reason='relationship'
    WHERE relationship_id=NEW.id AND revoked_at IS NULL RETURNING id LOOP
   INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('revoked',v_id,v_actor,'relationship');
  END LOOP;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER retire_continuity_relationship AFTER UPDATE OF status ON public.person_dog_relationships FOR EACH ROW EXECUTE FUNCTION public.retire_continuity_on_relationship_close();

CREATE FUNCTION public.retire_continuity_on_note_revision() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid; v_actor uuid;
BEGIN
 SELECT id INTO v_actor FROM public.profiles WHERE id=auth.uid();
 FOR v_id IN UPDATE public.professional_continuity_publications SET withdrawn_at=clock_timestamp(),withdrawal_reason='revision'
   WHERE note_id=NEW.note_id AND revision_number<NEW.revision_number AND withdrawn_at IS NULL RETURNING id LOOP
  INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('withdrawn',v_id,v_actor,'revision');
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER retire_continuity_revision AFTER INSERT ON public.professional_note_revisions FOR EACH ROW EXECUTE FUNCTION public.retire_continuity_on_note_revision();

CREATE FUNCTION public.prepare_my_continuity_note(p_request_id uuid,p_note_id uuid,p_expected_revision integer,p_expected_publication_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_rel public.person_dog_relationships%ROWTYPE;
 v_old public.professional_continuity_publications%ROWTYPE; v_dog uuid; v_owner uuid; v_latest integer; v_current uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_note_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision<1 THEN RAISE EXCEPTION 'Invalid publication' USING ERRCODE='22023'; END IF;
 SELECT r.* INTO v_rel FROM public.dog_professional_notes n JOIN public.professional_sessions s ON s.id=n.session_id
 JOIN public.person_dog_relationships r ON r.id=s.relationship_id JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
 WHERE n.id=p_note_id AND a.live_profile_id=v_uid AND n.status='finalized' AND s.status='finalized';
 IF NOT FOUND THEN RAISE EXCEPTION 'Own finalized note required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals p JOIN public.profiles f ON f.id=p.id WHERE p.id=v_uid AND p.approved IS TRUE AND f.role='professional' FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved professional required' USING ERRCODE='42501'; END IF;
 SELECT live_dog_id INTO v_dog FROM public.professional_archive_dogs WHERE id=v_rel.dog_archive_id;
 SELECT owner_id INTO v_owner FROM public.dogs WHERE id=v_dog FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.professional_archive_actors WHERE id=v_rel.authorizing_owner_actor_id AND live_profile_id=v_owner) THEN
  RAISE EXCEPTION 'Original owner context unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.dog_professional_notes WHERE id=p_note_id FOR UPDATE;
 SELECT * INTO v_old FROM public.professional_continuity_publications WHERE id=p_request_id;
 IF FOUND THEN
  IF v_old.note_id<>p_note_id OR v_old.author_actor_id<>v_rel.professional_actor_id OR v_old.revision_number<>p_expected_revision THEN
   RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
  -- An idempotent retry does not undo a later withdrawal.
  RETURN v_old.id;
 END IF;
 SELECT max(revision_number) INTO v_latest FROM public.professional_note_revisions WHERE note_id=p_note_id;
 SELECT id INTO v_current FROM public.professional_continuity_publications WHERE note_id=p_note_id AND withdrawn_at IS NULL;
 IF v_latest IS DISTINCT FROM p_expected_revision OR v_current IS DISTINCT FROM p_expected_publication_id THEN
  RAISE EXCEPTION 'Publication or note changed' USING ERRCODE='40001'; END IF;
 IF v_current IS NOT NULL THEN
  UPDATE public.professional_continuity_publications SET withdrawn_at=clock_timestamp(),withdrawal_reason='superseded' WHERE id=v_current;
  INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('withdrawn',v_current,v_uid,'superseded');
 END IF;
 INSERT INTO public.professional_continuity_publications(id,note_id,revision_number,dog_archive_id,author_actor_id,owner_actor_id)
 VALUES(p_request_id,p_note_id,p_expected_revision,v_rel.dog_archive_id,v_rel.professional_actor_id,v_rel.authorizing_owner_actor_id);
 INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id) VALUES('published',p_request_id,v_uid);
 RETURN p_request_id;
END $$;

CREATE FUNCTION public.withdraw_my_continuity_note(p_publication_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_note uuid;
BEGIN
 SELECT p.note_id INTO v_note FROM public.professional_continuity_publications p JOIN public.professional_archive_actors a ON a.id=p.author_actor_id
 WHERE p.id=p_publication_id AND a.live_profile_id=v_uid;
 IF v_uid IS NULL OR NOT FOUND THEN RAISE EXCEPTION 'Own publication required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.dog_professional_notes WHERE id=v_note FOR UPDATE;
 UPDATE public.professional_continuity_publications SET withdrawn_at=clock_timestamp(),withdrawal_reason='author' WHERE id=p_publication_id AND withdrawn_at IS NULL;
 IF FOUND THEN INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('withdrawn',p_publication_id,v_uid,'author'); END IF;
 RETURN true;
END $$;

CREATE FUNCTION public.list_my_continuity_notes(p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(note_id uuid,dog_name text,activity text,occurred_at timestamptz,revision_number integer,body text,publication_id uuid,can_publish boolean,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT n.id,d.name_at_capture,s.activity,s.occurred_at,rev.revision_number,rev.body,pub.id,
 coalesce(live.owner_id=o.live_profile_id AND pr.approved IS TRUE AND f.role='professional',false),count(*) OVER()
 FROM public.dog_professional_notes n JOIN public.professional_sessions s ON s.id=n.session_id
 JOIN public.person_dog_relationships r ON r.id=s.relationship_id JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id
 JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id JOIN public.professional_archive_actors o ON o.id=r.authorizing_owner_actor_id
 JOIN LATERAL(SELECT x.revision_number,x.body FROM public.professional_note_revisions x WHERE x.note_id=n.id ORDER BY x.revision_number DESC LIMIT 1) rev ON true
 LEFT JOIN public.professional_continuity_publications pub ON pub.note_id=n.id AND pub.withdrawn_at IS NULL
 LEFT JOIN public.dogs live ON live.id=d.live_dog_id LEFT JOIN public.professionals pr ON pr.id=a.live_profile_id LEFT JOIN public.profiles f ON f.id=pr.id
 WHERE a.live_profile_id=auth.uid() AND n.status='finalized' AND s.status='finalized'
 ORDER BY s.occurred_at DESC,n.id LIMIT p_limit OFFSET p_offset;
END $$;

CREATE FUNCTION public.list_owner_continuity_publications(p_dog_id uuid,p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(publication_id uuid,note_id uuid,revision_number integer,dog_name text,author_name text,activity text,occurred_at timestamptz,body text,shared_at timestamptz,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.dogs WHERE id=p_dog_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Own dog required' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT pub.id,pub.note_id,pub.revision_number,d.name_at_capture,a.display_name_at_capture,s.activity,s.occurred_at,rev.body,pub.created_at,count(*) OVER()
 FROM public.professional_continuity_publications pub JOIN public.professional_archive_dogs d ON d.id=pub.dog_archive_id
 JOIN public.dogs live ON live.id=d.live_dog_id JOIN public.professional_archive_actors o ON o.id=pub.owner_actor_id
 JOIN public.professional_archive_actors a ON a.id=pub.author_actor_id JOIN public.dog_professional_notes n ON n.id=pub.note_id
 JOIN public.professional_sessions s ON s.id=n.session_id JOIN public.professional_note_revisions rev ON rev.note_id=pub.note_id AND rev.revision_number=pub.revision_number
 WHERE live.id=p_dog_id AND live.owner_id=auth.uid() AND o.live_profile_id=auth.uid() AND pub.withdrawn_at IS NULL
 ORDER BY s.occurred_at DESC,pub.id LIMIT p_limit OFFSET p_offset;
END $$;

CREATE FUNCTION public.list_owner_continuity_recipients(p_dog_id uuid)
RETURNS TABLE(relationship_id uuid,professional_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.dogs WHERE id=p_dog_id AND owner_id=auth.uid()) THEN RAISE EXCEPTION 'Own dog required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT r.id,a.display_name_at_capture FROM public.person_dog_relationships r
 JOIN public.professional_archive_dogs d ON d.id=r.dog_archive_id JOIN public.dogs live ON live.id=d.live_dog_id
 JOIN public.professional_archive_actors a ON a.id=r.professional_actor_id JOIN public.professional_archive_actors o ON o.id=r.authorizing_owner_actor_id
 JOIN public.professionals pr ON pr.id=a.live_profile_id JOIN public.profiles f ON f.id=pr.id
 WHERE live.id=p_dog_id AND live.owner_id=auth.uid() AND o.live_profile_id=auth.uid() AND r.status='active' AND pr.approved IS TRUE AND f.role='professional'
 ORDER BY a.display_name_at_capture,r.id;
END $$;

CREATE FUNCTION public.grant_dog_continuity_access(p_request_id uuid,p_relationship_id uuid,p_publication_ids uuid[],p_duration_days integer,p_purpose text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); r public.person_dog_relationships%ROWTYPE; g public.continuity_access_grants%ROWTYPE;
 v_pro uuid; v_dog uuid; v_owner uuid; v_ids uuid[]; v_saved_ids uuid[]; v_seen integer; v_now timestamptz;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_relationship_id IS NULL OR p_publication_ids IS NULL OR cardinality(p_publication_ids) NOT BETWEEN 1 AND 100
  OR array_position(p_publication_ids,NULL) IS NOT NULL OR p_duration_days IS NULL OR p_duration_days NOT BETWEEN 1 AND 365
  OR p_purpose IS NULL OR char_length(btrim(p_purpose)) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid grant' USING ERRCODE='22023'; END IF;
 SELECT array_agg(x ORDER BY x) INTO v_ids FROM(SELECT DISTINCT unnest(p_publication_ids) x) selected;
 IF cardinality(v_ids)<>cardinality(p_publication_ids) THEN RAISE EXCEPTION 'Duplicate item' USING ERRCODE='22023'; END IF;
 SELECT rel.* INTO r FROM public.person_dog_relationships rel JOIN public.professional_archive_actors o ON o.id=rel.authorizing_owner_actor_id
 WHERE rel.id=p_relationship_id AND o.live_profile_id=v_uid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Owner authorization required' USING ERRCODE='42501'; END IF;
 SELECT live_profile_id INTO v_pro FROM public.professional_archive_actors WHERE id=r.professional_actor_id;
 PERFORM 1 FROM public.professionals p JOIN public.profiles f ON f.id=p.id WHERE p.id=v_pro AND p.approved IS TRUE AND f.role='professional' FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Approved recipient required' USING ERRCODE='42501'; END IF;
 SELECT live_dog_id INTO v_dog FROM public.professional_archive_dogs WHERE id=r.dog_archive_id;
 SELECT owner_id INTO v_owner FROM public.dogs WHERE id=v_dog FOR UPDATE;
 IF NOT FOUND OR v_owner<>v_uid THEN RAISE EXCEPTION 'Current owner required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.profiles WHERE id=v_uid AND role='owner' AND email_verified IS TRUE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Verified owner required' USING ERRCODE='42501'; END IF;
 SELECT * INTO r FROM public.person_dog_relationships WHERE id=p_relationship_id FOR UPDATE;
 IF r.status<>'active' THEN RAISE EXCEPTION 'Active relationship required' USING ERRCODE='42501'; END IF;
 SELECT * INTO g FROM public.continuity_access_grants WHERE id=p_request_id;
 IF FOUND THEN
  SELECT array_agg(publication_id ORDER BY publication_id) INTO v_saved_ids FROM public.continuity_grant_items WHERE grant_id=g.id;
  IF g.relationship_id<>r.id OR g.grantor_actor_id<>r.authorizing_owner_actor_id OR g.duration_days<>p_duration_days OR g.purpose<>btrim(p_purpose) OR v_saved_ids IS DISTINCT FROM v_ids THEN
   RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
  RETURN g.id;
 END IF;
 -- Lock each selected publication; withdrawal/revision cannot race a successful grant.
 PERFORM pub.id FROM public.professional_continuity_publications pub WHERE pub.id=ANY(v_ids)
  AND pub.dog_archive_id=r.dog_archive_id AND pub.owner_actor_id=r.authorizing_owner_actor_id AND pub.withdrawn_at IS NULL ORDER BY pub.id FOR SHARE;
 GET DIAGNOSTICS v_seen=ROW_COUNT;
 IF v_seen<>cardinality(v_ids) THEN RAISE EXCEPTION 'Selected contributions unavailable' USING ERRCODE='42501'; END IF;
 v_now:=clock_timestamp();
 INSERT INTO public.continuity_access_grants(id,relationship_id,dog_archive_id,grantor_actor_id,recipient_actor_id,purpose,duration_days,created_at,expires_at)
 VALUES(p_request_id,r.id,r.dog_archive_id,r.authorizing_owner_actor_id,r.professional_actor_id,btrim(p_purpose),p_duration_days,v_now,v_now+make_interval(days=>p_duration_days));
 INSERT INTO public.continuity_grant_items(grant_id,publication_id) SELECT p_request_id,unnest(v_ids);
 INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id) VALUES('granted',p_request_id,v_uid);
 RETURN p_request_id;
END $$;

CREATE FUNCTION public.revoke_dog_continuity_access(p_grant_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.continuity_access_grants g JOIN public.professional_archive_actors o ON o.id=g.grantor_actor_id WHERE g.id=p_grant_id AND o.live_profile_id=auth.uid()) THEN
  RAISE EXCEPTION 'Granting owner required' USING ERRCODE='42501'; END IF;
 UPDATE public.continuity_access_grants SET revoked_at=clock_timestamp(),revocation_reason='owner' WHERE id=p_grant_id AND revoked_at IS NULL;
 IF FOUND THEN INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id,reason) VALUES('revoked',p_grant_id,auth.uid(),'owner'); END IF;
 RETURN true;
END $$;

-- Private helpers; usable by the definer RPCs only, never a public existence oracle.
CREATE FUNCTION public.continuity_grant_is_current(p_grant_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.continuity_access_grants g JOIN public.person_dog_relationships r ON r.id=g.relationship_id
 JOIN public.professional_archive_dogs d ON d.id=g.dog_archive_id JOIN public.dogs live ON live.id=d.live_dog_id
 JOIN public.professional_archive_actors o ON o.id=g.grantor_actor_id JOIN public.professional_archive_actors a ON a.id=g.recipient_actor_id
 JOIN public.professionals p ON p.id=a.live_profile_id JOIN public.profiles f ON f.id=p.id
 WHERE g.id=p_grant_id AND g.revoked_at IS NULL AND g.expires_at>now() AND r.status='active'
  AND live.owner_id=o.live_profile_id AND r.authorizing_owner_actor_id=g.grantor_actor_id AND r.professional_actor_id=g.recipient_actor_id AND r.dog_archive_id=g.dog_archive_id
  AND p.approved IS TRUE AND f.role='professional')
$$;

CREATE FUNCTION public.list_my_continuity_grants(p_dog_id uuid DEFAULT NULL,p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(grant_id uuid,dog_name text,professional_name text,purpose text,created_at timestamptz,expires_at timestamptz,revoked_at timestamptz,revocation_reason text,is_current boolean,selected_count bigint,available_count bigint,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT g.id,d.name_at_capture,a.display_name_at_capture,g.purpose,g.created_at,g.expires_at,g.revoked_at,g.revocation_reason,
 public.continuity_grant_is_current(g.id),counts.selected_count,CASE WHEN public.continuity_grant_is_current(g.id) THEN counts.available_count ELSE 0::bigint END,count(*) OVER()
 FROM public.continuity_access_grants g JOIN public.professional_archive_dogs d ON d.id=g.dog_archive_id
 JOIN public.professional_archive_actors o ON o.id=g.grantor_actor_id JOIN public.professional_archive_actors a ON a.id=g.recipient_actor_id
 LEFT JOIN public.dogs live ON live.id=d.live_dog_id
 JOIN LATERAL(SELECT count(*) selected_count,count(*) FILTER(WHERE pub.withdrawn_at IS NULL) available_count FROM public.continuity_grant_items i
   JOIN public.professional_continuity_publications pub ON pub.id=i.publication_id WHERE i.grant_id=g.id) counts ON true
 WHERE (a.live_profile_id=auth.uid() OR (o.live_profile_id=auth.uid() AND live.owner_id=auth.uid())) AND (p_dog_id IS NULL OR live.id=p_dog_id)
 ORDER BY g.created_at DESC,g.id LIMIT p_limit OFFSET p_offset;
END $$;

CREATE FUNCTION public.read_received_continuity_notes(p_grant_id uuid,p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(publication_id uuid,note_id uuid,revision_number integer,dog_name text,author_name text,activity text,occurred_at timestamptz,body text,shared_at timestamptz,total_count bigint)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.continuity_access_grants g JOIN public.professional_archive_actors a ON a.id=g.recipient_actor_id
  WHERE g.id=p_grant_id AND a.live_profile_id=auth.uid() AND public.continuity_grant_is_current(g.id)) THEN RAISE EXCEPTION 'Current selected access required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT pub.id,pub.note_id,pub.revision_number,d.name_at_capture,a.display_name_at_capture,s.activity,s.occurred_at,rev.body,pub.created_at,count(*) OVER()
 FROM public.continuity_access_grants g JOIN public.professional_archive_actors recipient ON recipient.id=g.recipient_actor_id
 JOIN public.continuity_grant_items i ON i.grant_id=g.id JOIN public.professional_continuity_publications pub ON pub.id=i.publication_id
 JOIN public.professional_archive_dogs d ON d.id=pub.dog_archive_id JOIN public.professional_archive_actors a ON a.id=pub.author_actor_id
 JOIN public.dog_professional_notes n ON n.id=pub.note_id JOIN public.professional_sessions s ON s.id=n.session_id
 JOIN public.professional_note_revisions rev ON rev.note_id=pub.note_id AND rev.revision_number=pub.revision_number
 WHERE g.id=p_grant_id AND recipient.live_profile_id=auth.uid() AND public.continuity_grant_is_current(g.id)
  AND pub.withdrawn_at IS NULL AND pub.dog_archive_id=g.dog_archive_id AND pub.owner_actor_id=g.grantor_actor_id
 ORDER BY s.occurred_at DESC,pub.id LIMIT p_limit OFFSET p_offset;
 IF FOUND THEN INSERT INTO public.professional_continuity_audit(event_kind,resource_id,actor_profile_id) VALUES('read',p_grant_id,auth.uid()); END IF;
END $$;

REVOKE ALL ON FUNCTION public.retire_continuity_on_dog_change(),public.retire_continuity_on_relationship_close(),public.retire_continuity_on_note_revision(),public.continuity_grant_is_current(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.prepare_my_continuity_note(uuid,uuid,integer,uuid),public.withdraw_my_continuity_note(uuid),public.list_my_continuity_notes(integer,integer),
 public.list_owner_continuity_publications(uuid,integer,integer),public.list_owner_continuity_recipients(uuid),public.grant_dog_continuity_access(uuid,uuid,uuid[],integer,text),
 public.revoke_dog_continuity_access(uuid),public.list_my_continuity_grants(uuid,integer,integer),public.read_received_continuity_notes(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prepare_my_continuity_note(uuid,uuid,integer,uuid),public.withdraw_my_continuity_note(uuid),public.list_my_continuity_notes(integer,integer),
 public.list_owner_continuity_publications(uuid,integer,integer),public.list_owner_continuity_recipients(uuid),public.grant_dog_continuity_access(uuid,uuid,uuid[],integer,text),
 public.revoke_dog_continuity_access(uuid),public.list_my_continuity_grants(uuid,integer,integer),public.read_received_continuity_notes(uuid,integer,integer) TO authenticated;
COMMIT;
