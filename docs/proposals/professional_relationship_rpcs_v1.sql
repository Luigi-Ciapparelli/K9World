-- DRAFT: test only, not a production migration. Requires continuity_v1.sql.
BEGIN;

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
COMMIT;
