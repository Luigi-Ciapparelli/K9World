-- Each user explicitly creates a revocable read-only connection per calendar app. Tokens never live in clear in the database.
SET LOCAL lock_timeout='5s';
CREATE TABLE pc_private.calendar_connections (
  account_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK(provider IN ('google','apple','outlook','samsung')),
  PRIMARY KEY(account_id,provider),
  token_hash text NOT NULL UNIQUE CHECK(token_hash ~ '^[0-9a-f]{64}$'),
  version uuid NOT NULL DEFAULT gen_random_uuid()
);
ALTER TABLE pc_private.calendar_connections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.calendar_connections FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX IF NOT EXISTS calendar_owner_start ON public.bookings(owner_id,start_at)
  WHERE status IN ('accepted','completed');
ALTER TABLE public.bookings ADD COLUMN calendar_modified_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE pc_private.manual_appointments ADD COLUMN calendar_modified_at timestamptz NOT NULL DEFAULT now();
CREATE FUNCTION pc_private.calendar_stamp() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.calendar_modified_at:=statement_timestamp(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION pc_private.calendar_stamp() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER stamp_calendar_booking BEFORE UPDATE OF start_at,end_at,status,service_id ON public.bookings FOR EACH ROW EXECUTE FUNCTION pc_private.calendar_stamp();
CREATE TRIGGER stamp_calendar_manual BEFORE UPDATE OF start_at,end_at,version,cancelled ON pc_private.manual_appointments FOR EACH ROW EXECUTE FUNCTION pc_private.calendar_stamp();

CREATE FUNCTION pc_private.calendar_version(p_provider text) RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT version FROM pc_private.calendar_connections WHERE account_id=(SELECT auth.uid()) AND provider=p_provider
$$;
CREATE FUNCTION public.my_calendar_version(p_provider text) RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.calendar_version(p_provider) $$;
CREATE FUNCTION pc_private.change_calendar_connection(p_provider text,p_expected uuid,p_enable boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); current_version uuid; token text; next_version uuid:=gen_random_uuid(); r text; confirmed boolean;
BEGIN
 SELECT p.role,u.email_confirmed_at IS NOT NULL INTO r,confirmed FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.id=uid FOR UPDATE OF p;
 IF NOT FOUND OR p_enable IS NULL OR p_provider IS NULL OR p_provider NOT IN ('google','apple','outlook','samsung') THEN RAISE insufficient_privilege; END IF;
 SELECT version INTO current_version FROM pc_private.calendar_connections WHERE account_id=uid AND provider=p_provider;
 IF current_version IS DISTINCT FROM p_expected THEN RAISE serialization_failure; END IF;
 IF NOT p_enable THEN DELETE FROM pc_private.calendar_connections WHERE account_id=uid AND provider=p_provider; RETURN jsonb_build_object('version',NULL); END IF;
 IF NOT confirmed OR r NOT IN ('owner','professional') OR (r='professional' AND NOT EXISTS(
   SELECT 1 FROM public.professionals WHERE id=uid AND approved AND approval_status='approved')) THEN RAISE insufficient_privilege; END IF;
 token:=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
 INSERT INTO pc_private.calendar_connections(account_id,provider,token_hash,version)
 VALUES(uid,p_provider,encode(sha256(convert_to(token,'UTF8')),'hex'),next_version)
 ON CONFLICT(account_id,provider) DO UPDATE SET token_hash=excluded.token_hash,version=excluded.version;
 RETURN jsonb_build_object('version',next_version,'token',token);
END $$;
CREATE FUNCTION public.change_my_calendar_connection(p_provider text,p_expected uuid,p_enable boolean) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.change_calendar_connection(p_provider,p_expected,p_enable) $$;

-- The digest is accepted only from the feed service. Every refresh rechecks the current user, role and membership.
CREATE FUNCTION pc_private.calendar_feed_snapshot(p_hash text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid; ro text; lo timestamptz:=now()-interval '30 days'; hi timestamptz:=now()+interval '365 days'; result jsonb; n int;
BEGIN
 IF p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$' THEN RETURN NULL; END IF;
 SELECT c.account_id,p.role INTO uid,ro FROM pc_private.calendar_connections c JOIN public.profiles p ON p.id=c.account_id
 JOIN auth.users u ON u.id=p.id WHERE c.token_hash=p_hash AND u.email_confirmed_at IS NOT NULL
 AND (p.role='owner' OR (p.role='professional' AND EXISTS(SELECT 1 FROM public.professionals pr WHERE pr.id=p.id AND pr.approved AND pr.approval_status='approved')));
 IF NOT FOUND THEN RETURN NULL; END IF;
 WITH authorised AS (
   SELECT b.id FROM public.bookings b WHERE ro='owner' AND b.owner_id=uid AND b.status IN ('accepted','completed') AND b.start_at<hi AND b.end_at>lo
   UNION
   SELECT b.id FROM public.bookings b WHERE ro='professional' AND b.professional_id=uid AND b.status IN ('accepted','completed') AND b.start_at<hi AND b.end_at>lo
   UNION
   SELECT b.id FROM pc_private.centre_memberships m JOIN pc_private.centre_instructors i ON i.id=m.instructor_id AND i.centre_id=m.centre_id AND i.active
   JOIN pc_private.booking_instructors a ON a.instructor_id=i.id AND a.centre_id=m.centre_id
   JOIN public.bookings b ON b.id=a.booking_id AND b.professional_id=m.centre_id
   JOIN pc_private.review_experiences e ON e.booking_id=b.id AND e.service_type IN ('trainer','enci_course')
   JOIN public.professionals c ON c.id=m.centre_id AND c.listing_type='center' AND c.approved AND c.approval_status='approved'
   JOIN public.profiles cp ON cp.id=c.id AND cp.role='professional'
   WHERE m.account_id=uid AND m.status='active' AND b.status IN ('accepted','completed') AND b.start_at>=m.accepted_at AND b.start_at<hi AND b.end_at>lo
 ), events AS (
   SELECT 'b:'||b.id AS k,coalesce(e.service_type,s.service_type,'appointment') AS kind,
      b.start_at AS starts,b.end_at AS ends,b.calendar_modified_at AS modified,NULL::date AS day_from,NULL::date AS day_to
   FROM authorised x JOIN public.bookings b ON b.id=x.id LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
   LEFT JOIN public.services s ON s.id=b.service_id WHERE b.end_at>b.start_at
   UNION ALL
   SELECT 'm:'||m.professional_id||':'||m.id,m.service_type,m.start_at,m.end_at,m.calendar_modified_at,NULL,NULL
   FROM pc_private.manual_appointments m WHERE ro='professional' AND m.professional_id=uid AND NOT m.cancelled AND m.start_at<hi AND m.end_at>lo
   UNION ALL
   SELECT 'a:'||t.id,'unavailable',t.starts_at,t.ends_at,t.created_at,t.start_date,t.end_date+1
   FROM public.professional_time_off t WHERE ro='professional' AND t.professional_id=uid AND t.starts_at<hi AND t.ends_at>lo
 ), bounded AS (SELECT * FROM events ORDER BY starts,k LIMIT 10001)
 SELECT count(*),jsonb_agg(jsonb_build_object(
   'uid',encode(sha256(convert_to(uid::text||':'||k,'UTF8')),'hex'),
   'kind',CASE WHEN kind IN ('trainer','enci_course','boarding','handler','groomer','unavailable') THEN kind ELSE 'appointment' END,
   'start',starts,'end',ends,'modified',modified,'dayFrom',day_from,'dayTo',day_to) ORDER BY starts,k)
 INTO n,result FROM bounded;
 IF n>10000 THEN RAISE EXCEPTION 'calendar_capacity' USING ERRCODE='54000'; END IF;
 RETURN coalesce(result,'[]'::jsonb);
END $$;
CREATE FUNCTION public.read_personal_calendar_feed(p_hash text) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.calendar_feed_snapshot(p_hash) $$;
REVOKE ALL ON FUNCTION pc_private.calendar_version(text),public.my_calendar_version(text),pc_private.change_calendar_connection(text,uuid,boolean),public.change_my_calendar_connection(text,uuid,boolean),pc_private.calendar_feed_snapshot(text),public.read_personal_calendar_feed(text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.calendar_version(text),public.my_calendar_version(text),pc_private.change_calendar_connection(text,uuid,boolean),public.change_my_calendar_connection(text,uuid,boolean) TO authenticated;
GRANT USAGE ON SCHEMA pc_private TO service_role;
GRANT EXECUTE ON FUNCTION pc_private.calendar_feed_snapshot(text),public.read_personal_calendar_feed(text) TO service_role;
NOTIFY pgrst,'reload schema';
