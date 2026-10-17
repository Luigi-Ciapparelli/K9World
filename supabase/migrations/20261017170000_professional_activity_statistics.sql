-- Own activity, aggregated on the server. Booking values are not payments.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';

CREATE FUNCTION pc_private.get_professional_activity_summary(p_from date, p_to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); result jsonb; begins timestamptz; ends timestamptz;
BEGIN
 IF actor IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.professionals pro JOIN public.profiles p ON p.id=pro.id
  JOIN auth.users u ON u.id=p.id
  WHERE pro.id=actor AND p.role='professional' AND u.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Professional account required' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to)
  OR p_from<'2000-01-01'::date OR p_to>'2100-12-31'::date
  OR p_to<p_from OR p_to-p_from>365 THEN
  RAISE EXCEPTION 'Choose an inclusive range of at most 366 days' USING ERRCODE='22023';
 END IF;
 begins:=p_from::timestamp AT TIME ZONE 'Europe/Rome';
 ends:=(p_to+1)::timestamp AT TIME ZONE 'Europe/Rome';
 -- Existing (professional_id,start_at,end_at) index supports this bounded scan.
 WITH selected AS MATERIALIZED (
  SELECT b.id,b.owner_id,b.service_id,b.start_at,b.status,
   CASE WHEN b.price>=0 AND b.price<'Infinity'::numeric THEN b.price END AS price
  FROM public.bookings b
  WHERE b.professional_id=actor AND b.start_at>=begins AND b.start_at<ends
 ), completed AS MATERIALIZED (SELECT * FROM selected WHERE status='completed'),
 clients AS (SELECT owner_id,count(*) visits FROM completed GROUP BY owner_id),
 service_rows AS (
  SELECT c.id,c.start_at,c.price,coalesce(e.service_id,c.service_id) service_key,
   coalesce(nullif(btrim(e.service_name),''),nullif(btrim(s.name),''),'Servizio non più disponibile') name
  FROM completed c LEFT JOIN pc_private.review_experiences e ON e.booking_id=c.id
  LEFT JOIN public.services s ON s.id=c.service_id AND s.professional_id=actor
 ), service_groups AS (
  SELECT service_key,(array_agg(name ORDER BY start_at DESC,id DESC))[1] name,
   count(*) completed,coalesce(sum(price),0) value,count(*) FILTER(WHERE price IS NULL) missing_prices
  FROM service_rows GROUP BY service_key
 ), top_services AS (
  SELECT name,completed,value,missing_prices FROM service_groups
  ORDER BY completed DESC,name,service_key NULLS LAST LIMIT 5
 )
 SELECT jsonb_build_object(
  'from',p_from,'to',p_to,'time_zone','Europe/Rome','as_of',statement_timestamp(),
  'total',(SELECT count(*) FROM selected),
  'completed',(SELECT count(*) FROM completed),
  'pending',(SELECT count(*) FROM selected WHERE status='pending'),
  'accepted',(SELECT count(*) FROM selected WHERE status='accepted'),
  'declined',(SELECT count(*) FROM selected WHERE status='declined'),
  'cancelled',(SELECT count(*) FROM selected WHERE status='cancelled'),
  'other',(SELECT count(*) FROM selected WHERE status IS NULL OR status NOT IN ('pending','accepted','declined','completed','cancelled')),
  'customers',(SELECT count(*) FROM clients),
  'returning_customers',(SELECT count(*) FROM clients WHERE visits>=2),
  'returning_percent',(SELECT round(100.0*count(*) FILTER(WHERE visits>=2)/nullif(count(*),0),1) FROM clients),
  'completed_value',(SELECT coalesce(sum(price),0) FROM completed),
  'missing_prices',(SELECT count(*) FROM completed WHERE price IS NULL),
  'service_groups',(SELECT count(*) FROM service_groups),
  'top_services',(SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.completed DESC,t.name,t.value,t.missing_prices),'[]'::jsonb) FROM top_services t)
 ) INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.get_professional_activity_summary(p_from date,p_to date)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.get_professional_activity_summary(p_from,p_to);
$$;
REVOKE ALL ON FUNCTION pc_private.get_professional_activity_summary(date,date) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_professional_activity_summary(date,date) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.get_professional_activity_summary(date,date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_professional_activity_summary(date,date) TO authenticated;
COMMENT ON FUNCTION public.get_professional_activity_summary(date,date) IS
 'Own verified professional activity by scheduled start date in Europe/Rome, at most 366 days. Aggregates only; no customer identities, payment or retention claims.';
NOTIFY pgrst,'reload schema';
COMMIT;
