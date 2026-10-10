-- REV-02: rate the performed booking, never a person or an organisation.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.review_experiences
 ADD COLUMN service_id uuid,
 ADD COLUMN service_name text,
 ADD COLUMN context_captured_at timestamptz;
-- Existing context is explicitly a migration-time snapshot, not invented history.
UPDATE pc_private.review_experiences e SET service_id=b.service_id,
 service_name=coalesce(nullif(btrim(s.name),''),'Servizio'),context_captured_at=clock_timestamp()
FROM public.bookings b LEFT JOIN public.services s ON s.id=b.service_id WHERE b.id=e.booking_id;
ALTER TABLE pc_private.service_review_threads
 ADD COLUMN review_scope text NOT NULL DEFAULT 'legacy_relationship'
 CHECK(review_scope IN ('legacy_relationship','booking_service'));
ALTER TABLE pc_private.service_review_threads DROP CONSTRAINT service_review_threads_owner_id_professional_id_kind_key;
ALTER TABLE pc_private.service_review_threads DROP CONSTRAINT service_review_threads_kind_check;
ALTER TABLE pc_private.service_review_threads ADD CONSTRAINT service_review_threads_kind_check CHECK(kind IN ('trainer','boarding','other'));
CREATE UNIQUE INDEX service_review_threads_per_booking ON pc_private.service_review_threads(latest_booking_id) WHERE review_scope='booking_service';
ALTER TABLE public.reviews ADD COLUMN review_scope text NOT NULL DEFAULT 'legacy_relationship'
 CHECK(review_scope IN ('legacy_relationship','booking_service'));
COMMENT ON COLUMN public.reviews.review_scope IS 'Legacy text remains legacy; new ratings refer only to the performed booking.';

-- Do not recalculate reputation from lesson feedback. Existing source reviews stay intact.
CREATE OR REPLACE FUNCTION public.enforce_professional_review_aggregates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN NEW.rating:=0; NEW.review_count:=0; RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.refresh_professional_review_stats(p_professional_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN UPDATE public.professionals SET rating=0,review_count=0 WHERE id=p_professional_id; END $$;
UPDATE public.professionals SET rating=0,review_count=0 WHERE rating IS DISTINCT FROM 0 OR review_count IS DISTINCT FROM 0;

CREATE FUNCTION pc_private.protect_service_review_identity() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NEW.review_scope IS DISTINCT FROM OLD.review_scope OR
  (OLD.review_scope='booking_service' AND NEW.booking_id IS DISTINCT FROM OLD.booking_id) THEN
  RAISE EXCEPTION 'A review cannot be moved to another experience' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER protect_service_review_identity BEFORE UPDATE ON public.reviews
 FOR EACH ROW EXECUTE FUNCTION pc_private.protect_service_review_identity();
REVOKE ALL ON FUNCTION pc_private.protect_service_review_identity() FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION pc_private.capture_completed_review_experience() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE e pc_private.review_experiences%ROWTYPE; v_kind text;
BEGIN
 IF NEW.status='accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
  INSERT INTO pc_private.review_experiences(booking_id,service_type,individual,service_id,service_name,context_captured_at)
  SELECT NEW.id,s.service_type,p.listing_type='individual',s.id,s.name,clock_timestamp()
  FROM public.services s JOIN public.professionals p ON p.id=s.professional_id
  WHERE s.id=NEW.service_id AND p.id=NEW.professional_id ON CONFLICT DO NOTHING;
  RETURN NEW;
 END IF;
 IF NEW.status<>'completed' OR OLD.status='completed' THEN RETURN NEW; END IF;
 IF OLD.status<>'accepted' OR NEW.end_at IS NULL OR NEW.end_at>clock_timestamp() OR NEW.end_at<NEW.start_at THEN
  RAISE EXCEPTION 'Service must be performed and scheduled end reached' USING ERRCODE='PCR01'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=NEW.professional_id FOR UPDATE;
 INSERT INTO pc_private.review_experiences(booking_id,service_type,individual,service_id,service_name,context_captured_at)
 SELECT NEW.id,s.service_type,p.listing_type='individual',s.id,s.name,clock_timestamp()
 FROM public.services s JOIN public.professionals p ON p.id=s.professional_id
 WHERE s.id=NEW.service_id AND p.id=NEW.professional_id ON CONFLICT DO NOTHING;
 UPDATE pc_private.review_experiences SET recorded_at=clock_timestamp() WHERE booking_id=NEW.id RETURNING * INTO e;
 IF NOT FOUND OR NEW.owner_id=NEW.professional_id THEN RETURN NEW; END IF;
 IF e.service_type IN ('trainer','enci_course') THEN
  -- The threshold is with the booked activity, not a claimed instructor identity.
  IF (SELECT count(*) FROM pc_private.review_experiences x JOIN public.bookings b ON b.id=x.booking_id
   WHERE b.owner_id=NEW.owner_id AND b.professional_id=NEW.professional_id AND b.status='completed'
    AND b.end_at<=clock_timestamp() AND x.service_type IN ('trainer','enci_course'))<2 THEN RETURN NEW; END IF;
  v_kind:='trainer';
 ELSIF e.service_type='boarding' THEN v_kind:='boarding';
 ELSE v_kind:='other'; END IF;
 INSERT INTO pc_private.service_review_threads(owner_id,professional_id,kind,latest_booking_id,completed_at,review_scope)
 VALUES(NEW.owner_id,NEW.professional_id,v_kind,NEW.id,e.recorded_at,'booking_service');
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION pc_private.get_my_service_reviews(p_professional boolean DEFAULT false,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_result jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_professional IS NULL OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
  RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 WITH mine AS MATERIALIZED (
 SELECT t.id,t.kind,t.review_scope,t.latest_booking_id AS booking_id,t.completed_at,
  CASE WHEN p_professional THEN coalesce(nullif(btrim(pr.full_name),''),'Cliente')
   ELSE coalesce(nullif(btrim(p.business_name),''),nullif(btrim(pr.full_name),''),'Attività') END AS counterpart_name,
  CASE WHEN t.review_scope='booking_service' THEN coalesce(e.service_name,'Servizio') ELSE 'Valutazione precedente' END AS service_name,
  CASE WHEN t.review_scope='booking_service' THEN b.end_at ELSE NULL END AS end_at,
  r.rating AS owner_rating,r.comment AS owner_comment,t.owner_updated_at,t.professional_rating,t.professional_updated_at,
  CASE WHEN p_professional THEN t.professional_version ELSE t.owner_version END AS version,
  CASE WHEN p_professional THEN t.professional_rating ELSE r.rating END AS own_rating,
  CASE WHEN p_professional THEN '' ELSE coalesce(r.comment,'') END AS own_comment,
  t.review_scope='booking_service' AND CASE WHEN p_professional THEN t.kind='trainer' AND t.professional_version=0 AND NOT t.professional_dismissed
   ELSE t.owner_version=0 AND NOT t.owner_dismissed END AS pending,
  t.review_scope='booking_service' AND CASE WHEN p_professional THEN t.kind='trainer' AND (t.professional_version=0 OR t.professional_edit_until>now())
   ELSE t.owner_version=0 OR t.owner_edit_until>now() END AS can_write
 FROM pc_private.service_review_threads t JOIN public.bookings b ON b.id=t.latest_booking_id
 LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
 LEFT JOIN public.professionals p ON p.id=t.professional_id
 LEFT JOIN public.profiles pr ON pr.id=CASE WHEN p_professional THEN t.owner_id ELSE t.professional_id END
 LEFT JOIN public.reviews r ON r.id=t.owner_review_id
 WHERE CASE WHEN p_professional THEN t.professional_id=v_uid ELSE t.owner_id=v_uid END
  AND b.status='completed' AND b.end_at<=now()
  AND (t.review_scope='booking_service' OR r.id IS NOT NULL OR t.professional_rating IS NOT NULL)
 ), paged AS (SELECT * FROM mine ORDER BY pending DESC,completed_at DESC,id LIMIT p_limit OFFSET p_offset)
 SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.pending DESC,x.completed_at DESC,x.id) FROM paged x),'[]'),
 'count',(SELECT count(*) FROM mine),'pending_count',(SELECT count(*) FROM mine WHERE pending)) INTO v_result;
 RETURN v_result;
END $$;
CREATE OR REPLACE FUNCTION pc_private.write_service_review(p_thread_id uuid,p_expected_version integer,p_rating integer,p_comment text,p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();t pc_private.service_review_threads%ROWTYPE;w pc_private.service_review_writes%ROWTYPE;
 b public.bookings%ROWTYPE;r public.reviews%ROWTYPE;v_pro uuid;v_owner boolean;v_version integer;v_body text:=coalesce(btrim(p_comment),'');v_payload jsonb;v_result jsonb;v_previous jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_thread_id IS NULL OR p_request_id IS NULL OR p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 OR p_expected_version IS NULL OR p_expected_version<0 OR char_length(v_body)>500 THEN
  RAISE EXCEPTION 'Invalid rating or comment' USING ERRCODE='22023'; END IF;
 SELECT professional_id INTO v_pro FROM pc_private.service_review_threads WHERE id=p_thread_id AND v_uid IN(owner_id,professional_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_pro FOR UPDATE;
 SELECT * INTO t FROM pc_private.service_review_threads WHERE id=p_thread_id FOR UPDATE;
 IF NOT FOUND OR v_uid NOT IN(t.owner_id,t.professional_id) THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
 v_owner:=v_uid=t.owner_id;
 IF NOT v_owner AND (t.kind<>'trainer' OR v_body<>'') THEN RAISE EXCEPTION 'Only private trainer rating is supported' USING ERRCODE='42501'; END IF;
 v_payload:=jsonb_build_object('thread',p_thread_id,'version',p_expected_version,'rating',p_rating,'comment',v_body);
 SELECT * INTO w FROM pc_private.service_review_writes WHERE request_id=p_request_id;
 IF FOUND THEN
  IF w.actor_id<>v_uid OR w.payload<>v_payload THEN RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
  RETURN w.result;
 END IF;
 IF t.review_scope<>'booking_service' THEN RAISE EXCEPTION 'Legacy relationship review is read only' USING ERRCODE='PCR04'; END IF;
 v_version:=CASE WHEN v_owner THEN t.owner_version ELSE t.professional_version END;
 IF v_version<>p_expected_version THEN RAISE EXCEPTION 'Review changed; reload before editing' USING ERRCODE='40001'; END IF;
 SELECT * INTO b FROM public.bookings WHERE id=t.latest_booking_id FOR UPDATE;
 IF NOT FOUND OR b.status<>'completed' OR b.end_at>clock_timestamp() THEN RAISE EXCEPTION 'Experience not completed' USING ERRCODE='PCR02'; END IF;
 IF v_owner THEN
  SELECT * INTO r FROM public.reviews WHERE id=t.owner_review_id;
  v_previous:=jsonb_build_object('review_id',r.id,'booking_id',r.booking_id,'rating',r.rating,'comment',r.comment,'updated_at',t.owner_updated_at);
  IF v_version>0 AND r.booking_id=b.id AND t.owner_edit_until<=clock_timestamp() THEN
   RAISE EXCEPTION 'Update after a new experience' USING ERRCODE='PCR03'; END IF;
  UPDATE pc_private.service_review_threads SET owner_edit_until=CASE WHEN v_version=0 OR r.booking_id IS DISTINCT FROM b.id THEN clock_timestamp()+interval '7 days' ELSE owner_edit_until END WHERE id=t.id;
  IF r.id IS NULL THEN
   INSERT INTO public.reviews(booking_id,rating,comment,review_scope) VALUES(b.id,p_rating,v_body,'booking_service') RETURNING * INTO r;
  ELSE
   UPDATE public.reviews SET rating=p_rating,comment=v_body WHERE id=r.id RETURNING * INTO r;
  END IF;
  UPDATE pc_private.service_review_threads SET owner_review_id=r.id,owner_version=v_version+1,owner_updated_at=clock_timestamp(),owner_dismissed=true WHERE id=t.id;
 ELSE
  v_previous:=jsonb_build_object('booking_id',t.professional_booking_id,'rating',t.professional_rating,'updated_at',t.professional_updated_at);
  IF v_version>0 AND t.professional_booking_id=b.id AND t.professional_edit_until<=clock_timestamp() THEN
   RAISE EXCEPTION 'Update after a new experience' USING ERRCODE='PCR03'; END IF;
  UPDATE pc_private.service_review_threads SET professional_rating=p_rating,professional_version=v_version+1,professional_edit_until=CASE WHEN v_version=0 OR professional_booking_id IS DISTINCT FROM b.id THEN clock_timestamp()+interval '7 days' ELSE professional_edit_until END,professional_booking_id=b.id,professional_updated_at=clock_timestamp(),professional_dismissed=true WHERE id=t.id;
 END IF;
 v_result:=jsonb_build_object('version',v_version+1,'review_id',CASE WHEN v_owner THEN r.id ELSE NULL END);
 INSERT INTO pc_private.service_review_writes(request_id,actor_id,thread_id,payload,previous_value,result) VALUES(p_request_id,v_uid,t.id,v_payload,v_previous,v_result);
 RETURN v_result;
END $$;


-- Existing deployed clients can submit only the precise eligible booking.
CREATE OR REPLACE FUNCTION pc_private.submit_review(p_booking_id uuid,p_rating integer,p_comment text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE t pc_private.service_review_threads%ROWTYPE;r public.reviews%ROWTYPE;v_pro uuid;v_body text:=coalesce(btrim(p_comment),'');v_result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 OR char_length(v_body)>500 THEN RAISE EXCEPTION 'Invalid review' USING ERRCODE='22023'; END IF;
 SELECT professional_id INTO v_pro FROM public.bookings WHERE id=p_booking_id AND owner_id=auth.uid() AND owner_id<>professional_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_pro FOR UPDATE;
 SELECT * INTO r FROM public.reviews WHERE booking_id=p_booking_id;
 IF FOUND THEN
  IF r.rating=p_rating AND r.comment=v_body THEN RETURN r.id; END IF;
  RAISE EXCEPTION 'Use the review correction form' USING ERRCODE='PCR03'; END IF;
 SELECT * INTO t FROM pc_private.service_review_threads WHERE latest_booking_id=p_booking_id AND owner_id=auth.uid() AND review_scope='booking_service';
 IF NOT FOUND THEN RAISE EXCEPTION 'Experience not eligible' USING ERRCODE='PCR02'; END IF;
 v_result:=pc_private.write_service_review(t.id,0,p_rating,v_body,gen_random_uuid());
 RETURN (v_result->>'review_id')::uuid;
END $$;

CREATE OR REPLACE FUNCTION pc_private.get_legacy_review_bookings(p_booking_ids uuid[]) RETURNS uuid[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 RETURN '{}'::uuid[]; -- All new invitations are now in the per-booking panel.
END $$;

CREATE FUNCTION pc_private.get_public_service_reviews(p_professional_id uuid,p_service_id uuid DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 10)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF p_professional_id IS NULL OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 20 THEN
 RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 WITH visible AS MATERIALIZED (
  SELECT r.id,r.rating,r.comment,r.review_scope,r.created_at,
   coalesce(nullif(split_part(btrim(pr.full_name),' ',1),''),'Cliente') AS reviewer_name,
   CASE WHEN r.review_scope='booking_service' THEN e.service_id ELSE NULL END AS service_id,
   CASE WHEN r.review_scope='booking_service' THEN e.service_name ELSE NULL END AS service_name,
   CASE WHEN r.review_scope='booking_service' THEN e.service_type ELSE NULL END AS service_type
  FROM public.reviews r JOIN public.professionals p ON p.id=r.professional_id
  LEFT JOIN public.profiles pr ON pr.id=r.owner_id LEFT JOIN pc_private.review_experiences e ON e.booking_id=r.booking_id
  WHERE p.id=p_professional_id AND p.approved AND p.approval_status='approved'
   AND (p_service_id IS NULL OR (r.review_scope='booking_service' AND e.service_id=p_service_id))
 ), paged AS (SELECT * FROM visible ORDER BY created_at DESC,id LIMIT p_limit OFFSET p_offset)
 SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC,x.id) FROM paged x),'[]'),
 'count',(SELECT count(*) FROM visible)) INTO result;
 RETURN result;
END $$;
CREATE FUNCTION public.get_public_service_reviews(p_professional_id uuid,p_service_id uuid DEFAULT NULL,p_offset integer DEFAULT 0,p_limit integer DEFAULT 10)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.get_public_service_reviews(p_professional_id,p_service_id,p_offset,p_limit) $$;
REVOKE ALL ON FUNCTION public.get_public_service_reviews(uuid,uuid,integer,integer),pc_private.get_public_service_reviews(uuid,uuid,integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_service_reviews(uuid,uuid,integer,integer),pc_private.get_public_service_reviews(uuid,uuid,integer,integer) TO anon,authenticated;

-- Preserve the latest search implementation (including image fixes), removing only
-- the obsolete general-rating filter. Refuse source drift instead of overwriting it.
DO $search$
DECLARE src text; fragment text:=E'      and (\n        p_min_rating is null\n        or coalesce(p.rating, 0) >= p_min_rating\n      )';
BEGIN
 SELECT pg_get_functiondef('public.search_professionals_in_context(numeric,numeric,text,text,numeric,numeric,boolean,text)'::regprocedure) INTO src;
 IF strpos(src,fragment)=0 THEN RAISE EXCEPTION 'Search rating predicate changed; review migration'; END IF;
 EXECUTE replace(src,fragment,'      -- General professional ratings are no longer a search criterion.');
END $search$;
NOTIFY pgrst,'reload schema';
COMMIT;
