-- Bounded identity images, not a session-media archive or a subscription plan.
BEGIN;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('client-portraits','client-portraits',false,131072,ARRAY['image/webp'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=131072,allowed_mime_types=ARRAY['image/webp'];
UPDATE storage.buckets SET file_size_limit=512000,allowed_mime_types=ARRAY['image/webp']
WHERE id='professional-branding';

-- Public branded files remain public. Old objects are preserved and still removable;
-- new writes are limited to two stable slots, rather than unbounded timestamp paths.
DROP POLICY IF EXISTS "Professionals upload own branding" ON storage.objects;
DROP POLICY IF EXISTS "Professionals update own branding" ON storage.objects;
CREATE POLICY "Professionals upload own branding" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='professional-branding' AND name IN ((SELECT auth.uid())::text||'/avatar.webp',(SELECT auth.uid())::text||'/cover.webp')
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='professional'));
CREATE POLICY "Professionals update own branding" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='professional-branding' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text)
WITH CHECK (bucket_id='professional-branding' AND name IN ((SELECT auth.uid())::text||'/avatar.webp',(SELECT auth.uid())::text||'/cover.webp')
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='professional'));
CREATE POLICY "Professionals read own branding metadata" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='professional-branding' AND (storage.foldername(name))[1]=(SELECT auth.uid())::text);

CREATE FUNCTION pc_private.can_read_client_portrait(p_owner text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.profiles owner WHERE owner.id::text=p_owner AND owner.role='owner'
  AND (owner.id=auth.uid() OR EXISTS (
   SELECT 1 FROM public.professionals pro JOIN public.profiles pr ON pr.id=pro.id
   WHERE pro.id=auth.uid() AND pr.role='professional' AND pro.approved IS TRUE AND pro.approval_status='approved'
   AND (EXISTS(SELECT 1 FROM public.bookings b WHERE b.professional_id=pro.id AND b.owner_id=owner.id AND b.status IN ('pending','accepted','completed'))
    OR EXISTS(SELECT 1 FROM public.person_dog_relationships r
     JOIN public.professional_archive_actors pa ON pa.id=r.professional_actor_id
     JOIN public.professional_archive_actors oa ON oa.id=r.authorizing_owner_actor_id
     JOIN public.professional_archive_dogs da ON da.id=r.dog_archive_id
     JOIN public.dogs d ON d.id=da.live_dog_id
     WHERE r.status='active' AND pa.live_profile_id=pro.id AND oa.live_profile_id=owner.id AND d.owner_id=owner.id))
  ))
 );
$$;
REVOKE ALL ON FUNCTION pc_private.can_read_client_portrait(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.can_read_client_portrait(text) TO authenticated;

CREATE POLICY "Owner uploads portrait" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='client-portraits' AND name=(SELECT auth.uid())::text||'/portrait.webp'
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='owner'));
CREATE POLICY "Owner updates portrait" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='client-portraits' AND name=(SELECT auth.uid())::text||'/portrait.webp')
WITH CHECK (bucket_id='client-portraits' AND name=(SELECT auth.uid())::text||'/portrait.webp'
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='owner'));
CREATE POLICY "Owner deletes portrait" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='client-portraits' AND name=(SELECT auth.uid())::text||'/portrait.webp');
CREATE POLICY "Authorized portrait read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='client-portraits' AND name=split_part(name,'/',1)||'/portrait.webp'
 AND pc_private.can_read_client_portrait(split_part(name,'/',1)));

CREATE FUNCTION pc_private.get_client_portraits(p_client_ids uuid[] DEFAULT '{}',p_booking_ids uuid[] DEFAULT '{}')
RETURNS TABLE(client_id uuid,booking_id uuid,object_path text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF coalesce(cardinality(p_client_ids),0)+coalesce(cardinality(p_booking_ids),0)>100 THEN RAISE EXCEPTION 'Too many images' USING ERRCODE='22023'; END IF;
 RETURN QUERY WITH requested AS (
  SELECT DISTINCT id AS owner_id,NULL::uuid AS booking FROM unnest(p_client_ids) AS id
  UNION
  SELECT b.owner_id,b.id FROM public.bookings b
  WHERE b.id=ANY(p_booking_ids) AND b.professional_id=auth.uid()
 ), allowed AS (
  SELECT * FROM requested r WHERE pc_private.can_read_client_portrait(r.owner_id::text)
 ) SELECT a.owner_id,a.booking,o.name FROM allowed a JOIN storage.objects o
 ON o.bucket_id='client-portraits' AND o.name=a.owner_id::text||'/portrait.webp';
END;
$$;
CREATE FUNCTION public.get_client_portraits(p_client_ids uuid[] DEFAULT '{}',p_booking_ids uuid[] DEFAULT '{}')
RETURNS TABLE(client_id uuid,booking_id uuid,object_path text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM pc_private.get_client_portraits(p_client_ids,p_booking_ids);
$$;
REVOKE ALL ON FUNCTION pc_private.get_client_portraits(uuid[],uuid[]),public.get_client_portraits(uuid[],uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION pc_private.get_client_portraits(uuid[],uuid[]),public.get_client_portraits(uuid[],uuid[]) TO authenticated;

-- Two existing projections intentionally hid covers for individual professionals.
-- Review exact source fragments; preserve signatures, grants, filtering and ranking.
DO $covers$
DECLARE target regprocedure; old_fragment text; replacement text; definition text;
BEGIN
 FOR target,old_fragment,replacement IN SELECT * FROM (VALUES
  ('pc_private.read_public_professional_profiles()'::regprocedure,
   E'CASE\n            WHEN COALESCE(p.listing_type, ''individual''::text) = ''individual''::text THEN NULL::text\n            ELSE p.cover_photo_url\n        END AS cover_photo_url',
   'p.cover_photo_url AS cover_photo_url'),
  ('public.search_professionals_in_context(numeric,numeric,text,text,numeric,numeric,boolean,text)'::regprocedure,
   E'case\n        when coalesce(p.listing_type, ''individual'') = ''individual'' then null\n        else p.cover_photo_url\n      end as cover_photo_url',
   'p.cover_photo_url as cover_photo_url')
 ) AS changes(signature,old_text,new_text)
 LOOP
  definition:=pg_get_functiondef(target);
  IF position(old_fragment IN definition)=0 THEN RAISE EXCEPTION 'Image projection differs: %',target; END IF;
  EXECUTE replace(definition,old_fragment,replacement);
 END LOOP;
END $covers$;
NOTIFY pgrst,'reload schema';
COMMIT;
