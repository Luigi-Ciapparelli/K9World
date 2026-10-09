-- REV-01. New in-account invitations only after an explicitly completed service.
BEGIN;
CREATE TABLE pc_private.review_experiences (
 booking_id uuid PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
 service_type text NOT NULL,
 individual boolean NOT NULL,
 recorded_at timestamptz -- NULL = accepted booking or existing completed history; no new invitation.
);
CREATE TABLE pc_private.service_review_threads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK(kind IN ('trainer','boarding')),
 latest_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
 completed_at timestamptz NOT NULL,
 owner_review_id uuid REFERENCES public.reviews(id) ON DELETE SET NULL,
 owner_version integer NOT NULL DEFAULT 0 CHECK(owner_version>=0),
 owner_updated_at timestamptz,
 owner_edit_until timestamptz,
 professional_rating integer CHECK(professional_rating BETWEEN 1 AND 5),
 professional_version integer NOT NULL DEFAULT 0 CHECK(professional_version>=0),
 professional_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
 professional_updated_at timestamptz,
 professional_edit_until timestamptz,
 owner_dismissed boolean NOT NULL DEFAULT false,
 professional_dismissed boolean NOT NULL DEFAULT false,
 UNIQUE(owner_id,professional_id,kind),
 CHECK(kind='trainer' OR professional_rating IS NULL),
 CHECK(owner_id<>professional_id)
);
CREATE INDEX service_review_threads_professional ON pc_private.service_review_threads(professional_id,completed_at DESC,id);
CREATE INDEX service_review_threads_owner ON pc_private.service_review_threads(owner_id,completed_at DESC,id);
CREATE INDEX service_review_threads_owner_review ON pc_private.service_review_threads(owner_review_id);
CREATE INDEX service_review_threads_latest_booking ON pc_private.service_review_threads(latest_booking_id);
CREATE INDEX service_review_threads_professional_booking ON pc_private.service_review_threads(professional_booking_id);
CREATE TABLE pc_private.service_review_writes (
 request_id uuid PRIMARY KEY,
 actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 thread_id uuid NOT NULL REFERENCES pc_private.service_review_threads(id) ON DELETE CASCADE,
 payload jsonb NOT NULL,
 previous_value jsonb,
 result jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX service_review_writes_actor ON pc_private.service_review_writes(actor_id);
CREATE INDEX service_review_writes_thread ON pc_private.service_review_writes(thread_id);
ALTER TABLE pc_private.review_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.service_review_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.service_review_writes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.review_experiences,pc_private.service_review_threads,pc_private.service_review_writes FROM PUBLIC,anon,authenticated;
-- Preserve history, but do not create retrospective invitations or rewrite reviews.
INSERT INTO pc_private.review_experiences(booking_id,service_type,individual)
 SELECT b.id,s.service_type,p.listing_type='individual'
 FROM public.bookings b JOIN public.services s ON s.id=b.service_id AND s.professional_id=b.professional_id
 JOIN public.professionals p ON p.id=b.professional_id
 WHERE b.status='accepted' OR (b.status='completed' AND b.end_at<=clock_timestamp());

CREATE FUNCTION pc_private.capture_completed_review_experience() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_kind text; v_type text; v_individual boolean; v_previous public.reviews%ROWTYPE;
BEGIN
 IF NEW.status='accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
  INSERT INTO pc_private.review_experiences(booking_id,service_type,individual)
   SELECT NEW.id,s.service_type,p.listing_type='individual' FROM public.services s JOIN public.professionals p ON p.id=s.professional_id
   WHERE s.id=NEW.service_id AND p.id=NEW.professional_id ON CONFLICT DO NOTHING;
  RETURN NEW;
 END IF;
 IF NEW.status<>'completed' OR OLD.status='completed' THEN RETURN NEW; END IF;
 IF OLD.status<>'accepted' OR NEW.end_at IS NULL OR NEW.end_at>clock_timestamp() OR NEW.end_at<NEW.start_at THEN
  RAISE EXCEPTION 'A service must be performed and its scheduled end reached' USING ERRCODE='PCR01'; END IF;
 -- change_booking_status already locks this professional before the booking.
 PERFORM 1 FROM public.professionals WHERE id=NEW.professional_id FOR UPDATE;
 SELECT service_type,individual INTO v_type,v_individual FROM pc_private.review_experiences WHERE booking_id=NEW.id;
 IF NOT FOUND THEN
  SELECT s.service_type,p.listing_type='individual' INTO v_type,v_individual
  FROM public.services s JOIN public.professionals p ON p.id=s.professional_id
  WHERE s.id=NEW.service_id AND s.professional_id=NEW.professional_id;
 END IF;
 IF v_type IS NULL THEN RETURN NEW; END IF;
 INSERT INTO pc_private.review_experiences VALUES(NEW.id,v_type,v_individual,clock_timestamp()) ON CONFLICT(booking_id) DO UPDATE SET recorded_at=excluded.recorded_at;
 -- No self-reviews, no implicit identification of an instructor in a centre.
 IF NEW.owner_id=NEW.professional_id THEN RETURN NEW; END IF;
 IF v_type='boarding' THEN v_kind:='boarding';
 ELSIF v_type IN ('trainer','enci_course') AND v_individual THEN
  IF (SELECT count(*) FROM pc_private.review_experiences e JOIN public.bookings b ON b.id=e.booking_id
   WHERE b.owner_id=NEW.owner_id AND b.professional_id=NEW.professional_id AND b.status='completed'
    AND b.end_at<=clock_timestamp() AND e.individual)<2 THEN RETURN NEW; END IF;
  v_kind:='trainer';
 ELSE RETURN NEW; END IF;
 SELECT r.* INTO v_previous FROM public.reviews r JOIN pc_private.review_experiences e ON e.booking_id=r.booking_id
 WHERE r.owner_id=NEW.owner_id AND r.professional_id=NEW.professional_id
  AND CASE WHEN v_kind='boarding' THEN e.service_type='boarding' ELSE e.service_type IN ('trainer','enci_course') AND e.individual END
 ORDER BY r.created_at DESC,r.id DESC LIMIT 1;
 INSERT INTO pc_private.service_review_threads(owner_id,professional_id,kind,latest_booking_id,completed_at,owner_review_id,owner_version,owner_updated_at,owner_edit_until)
 VALUES(NEW.owner_id,NEW.professional_id,v_kind,NEW.id,clock_timestamp(),v_previous.id,CASE WHEN v_previous.id IS NULL THEN 0 ELSE 1 END,v_previous.created_at,v_previous.created_at+interval '7 days')
 ON CONFLICT(owner_id,professional_id,kind) DO UPDATE SET latest_booking_id=excluded.latest_booking_id,completed_at=excluded.completed_at;
 RETURN NEW;
END $$;
-- AFTER sees the newly completed booking when counting the second experience.
CREATE TRIGGER completed_review_experience AFTER UPDATE OF status ON public.bookings
 FOR EACH ROW EXECUTE FUNCTION pc_private.capture_completed_review_experience();
REVOKE ALL ON FUNCTION pc_private.capture_completed_review_experience() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION pc_private.get_my_service_reviews(p_professional boolean DEFAULT false,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();v_result jsonb;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_professional IS NULL OR p_offset IS NULL OR p_offset<0 OR p_offset>100000 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 50 THEN
  RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 WITH mine AS MATERIALIZED (
  SELECT t.id,t.kind,t.latest_booking_id AS booking_id,t.completed_at,
   coalesce(nullif(btrim(p.full_name),''),'Partecipante') AS counterpart_name,
   coalesce(nullif(btrim(s.name),''),'Servizio') AS service_name,b.end_at,
   r.rating AS owner_rating,r.comment AS owner_comment,t.owner_updated_at,
   t.professional_rating,t.professional_updated_at,
   CASE WHEN p_professional THEN t.professional_version ELSE t.owner_version END AS version,
   CASE WHEN p_professional THEN t.professional_rating ELSE r.rating END AS own_rating,
   CASE WHEN p_professional THEN '' ELSE coalesce(r.comment,'') END AS own_comment,
   CASE WHEN p_professional THEN t.kind='trainer' AND t.professional_version=0 AND NOT t.professional_dismissed
    ELSE t.owner_version=0 AND NOT t.owner_dismissed END AS pending,
   CASE WHEN p_professional THEN t.kind='trainer' AND (t.professional_version=0 OR t.professional_booking_id IS DISTINCT FROM b.id OR t.professional_edit_until>now())
    ELSE t.owner_version=0 OR r.booking_id IS DISTINCT FROM b.id OR t.owner_edit_until>now() END AS can_write
  FROM pc_private.service_review_threads t JOIN public.bookings b ON b.id=t.latest_booking_id
  JOIN pc_private.review_experiences e ON e.booking_id=b.id
  LEFT JOIN public.profiles p ON p.id=CASE WHEN p_professional THEN t.owner_id ELSE t.professional_id END
  LEFT JOIN public.services s ON s.id=b.service_id
  LEFT JOIN public.reviews r ON r.id=t.owner_review_id
  WHERE CASE WHEN p_professional THEN t.professional_id=v_uid ELSE t.owner_id=v_uid END
   AND b.status='completed' AND b.end_at<=now()
 ), paged AS (SELECT * FROM mine ORDER BY pending DESC,completed_at DESC,id LIMIT p_limit OFFSET p_offset)
 SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.pending DESC,x.completed_at DESC,x.id) FROM paged x),'[]'),
  'count',(SELECT count(*) FROM mine),'pending_count',(SELECT count(*) FROM mine WHERE pending)) INTO v_result;
 RETURN v_result;
END $$;

CREATE FUNCTION pc_private.write_service_review(p_thread_id uuid,p_expected_version integer,p_rating integer,p_comment text,p_request_id uuid)
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
   INSERT INTO public.reviews(booking_id,rating,comment) VALUES(b.id,p_rating,v_body) RETURNING * INTO r;
  ELSE
   UPDATE public.reviews SET booking_id=b.id,rating=p_rating,comment=v_body WHERE id=r.id RETURNING * INTO r;
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

CREATE FUNCTION pc_private.dismiss_service_review(p_thread_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 UPDATE pc_private.service_review_threads SET
 owner_dismissed=CASE WHEN owner_id=auth.uid() THEN true ELSE owner_dismissed END,
 professional_dismissed=CASE WHEN professional_id=auth.uid() THEN true ELSE professional_dismissed END
 WHERE id=p_thread_id AND auth.uid() IN(owner_id,professional_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Review unavailable' USING ERRCODE='42501'; END IF;
END $$;

CREATE FUNCTION pc_private.get_legacy_review_bookings(p_booking_ids uuid[]) RETURNS uuid[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF coalesce(cardinality(p_booking_ids),0)>20 THEN RAISE EXCEPTION 'Too many bookings' USING ERRCODE='22023'; END IF;
 RETURN coalesce((SELECT array_agg(b.id) FROM public.bookings b LEFT JOIN public.services s ON s.id=b.service_id
 LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id
 WHERE b.id=ANY(p_booking_ids) AND b.owner_id=auth.uid() AND b.owner_id<>b.professional_id AND b.status='completed' AND b.end_at<=now()
  AND coalesce(e.service_type,s.service_type) NOT IN ('trainer','enci_course','boarding')
  AND NOT EXISTS(SELECT 1 FROM public.reviews r WHERE r.booking_id=b.id)),'{}'::uuid[]);
END $$;

-- Preserve the previous API, enforcing the new rules even for an old deployed UI.
CREATE OR REPLACE FUNCTION pc_private.submit_review(p_booking_id uuid,p_rating integer,p_comment text DEFAULT '')
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.bookings%ROWTYPE;t pc_private.service_review_threads%ROWTYPE;r public.reviews%ROWTYPE;v_pro uuid;v_type text;v_result jsonb;v_body text:=coalesce(btrim(p_comment),'');
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_rating IS NULL OR p_rating NOT BETWEEN 1 AND 5 OR char_length(v_body)>500 THEN RAISE EXCEPTION 'Invalid review' USING ERRCODE='22023'; END IF;
 SELECT professional_id INTO v_pro FROM public.bookings WHERE id=p_booking_id AND owner_id=auth.uid() AND owner_id<>professional_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_pro FOR UPDATE;
 SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
 IF b.status<>'completed' OR b.end_at>clock_timestamp() THEN RAISE EXCEPTION 'Experience not completed' USING ERRCODE='PCR02'; END IF;
 SELECT * INTO r FROM public.reviews WHERE booking_id=b.id;
 IF FOUND THEN
  IF r.rating=p_rating AND r.comment=v_body THEN RETURN r.id; END IF;
  RAISE EXCEPTION 'Review exists; use the update form' USING ERRCODE='PCR03';
 END IF;
 SELECT coalesce(e.service_type,s.service_type) INTO v_type FROM public.services s LEFT JOIN pc_private.review_experiences e ON e.booking_id=b.id WHERE s.id=b.service_id;
 IF v_type IS NULL THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='PCR02'; END IF;
 IF v_type IN('trainer','enci_course','boarding') THEN
  SELECT * INTO t FROM pc_private.service_review_threads WHERE latest_booking_id=b.id AND owner_id=auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Review not eligible; see account reviews' USING ERRCODE='PCR02'; END IF;
  IF t.owner_version<>0 THEN RAISE EXCEPTION 'Use the update form' USING ERRCODE='PCR03'; END IF;
  v_result:=pc_private.write_service_review(t.id,0,p_rating,v_body,gen_random_uuid());
  RETURN (v_result->>'review_id')::uuid;
 END IF;
 INSERT INTO public.reviews(booking_id,rating,comment) VALUES(b.id,p_rating,v_body) RETURNING id INTO r.id;
 RETURN r.id;
END $$;

-- Only explicit authenticated RPCs expose private review data. No public definer.
CREATE FUNCTION public.get_my_service_reviews(p_professional boolean DEFAULT false,p_offset integer DEFAULT 0,p_limit integer DEFAULT 20)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_my_service_reviews(p_professional,p_offset,p_limit) $$;
CREATE FUNCTION public.write_service_review(p_thread_id uuid,p_expected_version integer,p_rating integer,p_comment text,p_request_id uuid)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.write_service_review(p_thread_id,p_expected_version,p_rating,p_comment,p_request_id) $$;
CREATE FUNCTION public.dismiss_service_review(p_thread_id uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.dismiss_service_review(p_thread_id) $$;
CREATE FUNCTION public.get_legacy_review_bookings(p_booking_ids uuid[]) RETURNS uuid[] LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_legacy_review_bookings(p_booking_ids) $$;
REVOKE ALL ON FUNCTION public.get_my_service_reviews(boolean,integer,integer),public.write_service_review(uuid,integer,integer,text,uuid),public.dismiss_service_review(uuid),public.get_legacy_review_bookings(uuid[]),
 pc_private.get_my_service_reviews(boolean,integer,integer),pc_private.write_service_review(uuid,integer,integer,text,uuid),pc_private.dismiss_service_review(uuid),pc_private.get_legacy_review_bookings(uuid[]),pc_private.submit_review(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_service_reviews(boolean,integer,integer),public.write_service_review(uuid,integer,integer,text,uuid),public.dismiss_service_review(uuid),public.get_legacy_review_bookings(uuid[]),
 pc_private.get_my_service_reviews(boolean,integer,integer),pc_private.write_service_review(uuid,integer,integer,text,uuid),pc_private.dismiss_service_review(uuid),pc_private.get_legacy_review_bookings(uuid[]),pc_private.submit_review(uuid,integer,text) TO authenticated;
COMMIT;
