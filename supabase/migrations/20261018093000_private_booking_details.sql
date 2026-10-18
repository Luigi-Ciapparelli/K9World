-- Context for the booking participants only. Existing RPC contracts stay intact.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE FUNCTION pc_private.get_booking_details(p_booking_ids uuid[])
RETURNS TABLE(booking_id uuid,end_at timestamptz,service_name text,service_source text,dog_names text[],dogs_unavailable boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
  WHERE p.id=actor AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL)
 THEN RAISE EXCEPTION 'Confirmed participant account required' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>100 OR coalesce(array_ndims(p_booking_ids),1)>1 OR array_position(p_booking_ids,NULL) IS NOT NULL
 THEN RAISE EXCEPTION 'Invalid booking batch' USING ERRCODE='22023'; END IF;
 RETURN QUERY
 SELECT b.id,b.end_at,
  coalesce(nullif(btrim(e.service_name),''),nullif(btrim(s.name),''),'Servizio non disponibile'),
  CASE WHEN nullif(btrim(e.service_name),'') IS NOT NULL THEN 'recorded'
   WHEN nullif(btrim(s.name),'') IS NOT NULL THEN 'catalogue' ELSE 'unavailable' END,
  ARRAY(SELECT coalesce(nullif(btrim(d.name),''),'Nome non indicato')
   FROM public.booking_dogs bd JOIN public.dogs d ON d.id=bd.dog_id
   WHERE bd.booking_id=b.id AND d.owner_id=b.owner_id ORDER BY d.name,d.id),
  EXISTS(SELECT 1 FROM public.booking_dogs bd LEFT JOIN public.dogs d ON d.id=bd.dog_id
   WHERE bd.booking_id=b.id AND (d.id IS NULL OR d.owner_id IS DISTINCT FROM b.owner_id))
 FROM public.bookings b
 LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
 LEFT JOIN public.services s ON s.id=b.service_id AND s.professional_id=b.professional_id
 WHERE b.id=ANY(p_booking_ids) AND (b.owner_id=actor OR b.professional_id=actor);
END $$;
CREATE FUNCTION public.get_booking_details(p_booking_ids uuid[])
RETURNS TABLE(booking_id uuid,end_at timestamptz,service_name text,service_source text,dog_names text[],dogs_unavailable boolean)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM pc_private.get_booking_details(p_booking_ids);
$$;
REVOKE ALL ON FUNCTION pc_private.get_booking_details(uuid[]),public.get_booking_details(uuid[])
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.get_booking_details(uuid[]),public.get_booking_details(uuid[]) TO authenticated;
COMMENT ON FUNCTION public.get_booking_details(uuid[]) IS
 'Bounded private booking context for the confirmed owner or booked professional; no contacts, dog records, private notes or team-wide access.';
NOTIFY pgrst,'reload schema';
COMMIT;
