-- Private booking conversations and professional reply templates.
-- Operational messages follow the booking lifecycle; professional archive notes are separate.
BEGIN;

CREATE TABLE public.professional_reply_templates (
  id uuid PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 80),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  automatic_event text CHECK (automatic_event IN ('received','accepted','declined')),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX professional_reply_event_unique ON public.professional_reply_templates(professional_id,automatic_event) WHERE automatic_event IS NOT NULL;
CREATE INDEX professional_reply_owner_idx ON public.professional_reply_templates(professional_id,id);
CREATE TABLE public.booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sequence bigint NOT NULL CHECK (sequence>0),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_kind text NOT NULL CHECK (sender_kind IN ('owner','professional')),
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 4000),
  automatic_event text CHECK (automatic_event IN ('received','accepted','declined')),
  template_id uuid REFERENCES public.professional_reply_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(booking_id,sequence),
  CHECK (automatic_event IS NULL OR sender_kind='professional')
);
CREATE UNIQUE INDEX booking_message_event_unique ON public.booking_messages(booking_id,automatic_event) WHERE automatic_event IS NOT NULL;
CREATE TABLE public.booking_message_reads (
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_sequence bigint NOT NULL DEFAULT 0 CHECK (last_read_sequence>=0),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(booking_id,reader_id)
);
ALTER TABLE public.professional_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_message_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_reply_templates,public.booking_messages,public.booking_message_reads FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.save_my_reply_template(p_template_id uuid,p_title text,p_body text,p_automatic_event text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_old public.professional_reply_templates%ROWTYPE; v_result uuid;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_template_id IS NULL OR p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 80
   OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 4000
   OR (p_automatic_event IS NOT NULL AND p_automatic_event NOT IN ('received','accepted','declined')) THEN
   RAISE EXCEPTION 'Invalid template' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_old FROM public.professional_reply_templates WHERE id=p_template_id;
 IF FOUND AND v_old.professional_id<>v_uid THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF NOT FOUND AND (SELECT count(*) FROM public.professional_reply_templates WHERE professional_id=v_uid)>=50 THEN
   RAISE EXCEPTION 'At most 50 templates' USING ERRCODE='PCM02'; END IF;
 -- Explicitly assigning an event replaces the previous template for that event.
 UPDATE public.professional_reply_templates SET automatic_event=NULL,updated_at=clock_timestamp()
   WHERE professional_id=v_uid AND id<>p_template_id AND automatic_event=p_automatic_event;
 INSERT INTO public.professional_reply_templates AS target(id,professional_id,title,body,automatic_event)
 VALUES(p_template_id,v_uid,btrim(p_title),btrim(p_body),p_automatic_event)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,body=excluded.body,automatic_event=excluded.automatic_event,updated_at=clock_timestamp()
 WHERE target.professional_id=v_uid RETURNING target.id INTO v_result;
 IF v_result IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN p_template_id;
END $$;

CREATE FUNCTION public.list_my_reply_templates()
RETURNS TABLE(id uuid,title text,body text,automatic_event text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals p WHERE p.id=v_uid) THEN
   RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT t.id,t.title,t.body,t.automatic_event FROM public.professional_reply_templates t
   WHERE t.professional_id=v_uid ORDER BY t.title,t.id;
END $$;

CREATE FUNCTION public.delete_my_reply_template(p_template_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
 DELETE FROM public.professional_reply_templates WHERE id=p_template_id AND professional_id=v_uid;
 RETURN FOUND;
END $$;

CREATE FUNCTION public.emit_booking_automatic_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_event text; v_template public.professional_reply_templates%ROWTYPE;
BEGIN
 IF TG_OP='INSERT' THEN
   IF NEW.status='pending' THEN v_event:='received'; END IF;
 ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','declined') THEN v_event:=NEW.status;
 END IF;
 IF v_event IS NULL THEN RETURN NEW; END IF;
 SELECT * INTO v_template FROM public.professional_reply_templates WHERE professional_id=NEW.professional_id AND automatic_event=v_event;
 IF NOT FOUND THEN RETURN NEW; END IF;
 INSERT INTO public.booking_messages(booking_id,sequence,sender_id,sender_kind,body,automatic_event,template_id)
 SELECT NEW.id,coalesce(max(m.sequence),0)+1,NEW.professional_id,'professional',v_template.body,v_event,v_template.id
   FROM public.booking_messages m WHERE m.booking_id=NEW.id
 ON CONFLICT(booking_id,automatic_event) WHERE automatic_event IS NOT NULL DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.emit_booking_automatic_reply() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER booking_automatic_reply AFTER INSERT OR UPDATE OF status ON public.bookings
 FOR EACH ROW EXECUTE FUNCTION public.emit_booking_automatic_reply();

CREATE FUNCTION public.send_booking_message(p_request_id uuid,p_booking_id uuid,p_body text)
RETURNS TABLE(id uuid,sequence bigint,created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_booking public.bookings%ROWTYPE; v_old public.booking_messages%ROWTYPE;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_booking_id IS NULL OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 4000 THEN
   RAISE EXCEPTION 'Invalid message' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_booking FROM public.bookings b WHERE b.id=p_booking_id AND (b.owner_id=v_uid OR b.professional_id=v_uid) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_old FROM public.booking_messages m WHERE m.id=p_request_id;
 IF FOUND THEN
   IF v_old.booking_id<>p_booking_id OR v_old.sender_id<>v_uid OR v_old.body<>btrim(p_body) OR v_old.automatic_event IS NOT NULL THEN
     RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
   RETURN QUERY SELECT v_old.id,v_old.sequence,v_old.created_at; RETURN;
 END IF;
 RETURN QUERY INSERT INTO public.booking_messages AS inserted(id,booking_id,sequence,sender_id,sender_kind,body)
 SELECT p_request_id,p_booking_id,coalesce(max(m.sequence),0)+1,v_uid,
   CASE WHEN v_booking.owner_id=v_uid THEN 'owner' ELSE 'professional' END,btrim(p_body)
 FROM public.booking_messages m WHERE m.booking_id=p_booking_id
 RETURNING inserted.id,inserted.sequence,inserted.created_at;
END $$;

CREATE FUNCTION public.get_booking_messages(p_booking_id uuid,p_before_sequence bigint DEFAULT NULL,p_after_sequence bigint DEFAULT NULL,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,sequence bigint,sender_name text,sender_kind text,body text,is_automatic boolean,from_me boolean,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.id=p_booking_id AND (b.owner_id=v_uid OR b.professional_id=v_uid)) THEN
   RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR (p_before_sequence IS NOT NULL AND p_before_sequence<1)
   OR (p_after_sequence IS NOT NULL AND p_after_sequence<0) OR (p_before_sequence IS NOT NULL AND p_after_sequence IS NOT NULL) THEN
   RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT m.id,m.sequence,coalesce(nullif(btrim(p.full_name),''),CASE WHEN m.sender_kind='owner' THEN 'Proprietario' ELSE 'Professionista' END),
   m.sender_kind,m.body,m.automatic_event IS NOT NULL,m.sender_id=v_uid,m.created_at
 FROM public.booking_messages m LEFT JOIN public.profiles p ON p.id=m.sender_id
 WHERE m.booking_id=p_booking_id AND (p_before_sequence IS NULL OR m.sequence<p_before_sequence)
   AND (p_after_sequence IS NULL OR m.sequence>p_after_sequence)
 ORDER BY CASE WHEN p_after_sequence IS NOT NULL THEN m.sequence END ASC,m.sequence DESC LIMIT p_limit;
END $$;

CREATE FUNCTION public.mark_booking_messages_read(p_booking_id uuid,p_through_sequence bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid(); v_max bigint; v_result bigint;
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.bookings b WHERE b.id=p_booking_id AND (b.owner_id=v_uid OR b.professional_id=v_uid) FOR KEY SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 SELECT coalesce(max(sequence),0) INTO v_max FROM public.booking_messages WHERE booking_id=p_booking_id;
 IF p_through_sequence IS NULL OR p_through_sequence<0 OR p_through_sequence>v_max THEN RAISE EXCEPTION 'Invalid read position' USING ERRCODE='22023'; END IF;
 INSERT INTO public.booking_message_reads AS target(booking_id,reader_id,last_read_sequence)
 VALUES(p_booking_id,v_uid,p_through_sequence)
 ON CONFLICT(booking_id,reader_id) DO UPDATE SET last_read_sequence=greatest(target.last_read_sequence,excluded.last_read_sequence),updated_at=clock_timestamp()
 RETURNING last_read_sequence INTO v_result;
 RETURN v_result;
END $$;

CREATE FUNCTION public.get_booking_message_summaries(p_booking_ids uuid[])
RETURNS TABLE(booking_id uuid,message_count bigint,unread_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Invalid booking batch' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT b.id,count(m.id),count(m.id) FILTER(WHERE m.sender_id<>v_uid AND m.sequence>coalesce(r.last_read_sequence,0))
 FROM public.bookings b LEFT JOIN public.booking_messages m ON m.booking_id=b.id
 LEFT JOIN public.booking_message_reads r ON r.booking_id=b.id AND r.reader_id=v_uid
 WHERE b.id=ANY(p_booking_ids) AND (b.owner_id=v_uid OR b.professional_id=v_uid)
 GROUP BY b.id;
END $$;

CREATE FUNCTION public.get_my_owner_bookings()
RETURNS TABLE(id uuid,professional_id uuid,professional_name text,service_name text,start_at timestamptz,end_at timestamptz,status text,price numeric,notes text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT b.id,b.professional_id,coalesce(nullif(btrim(p.full_name),''),'Professionista'),coalesce(nullif(btrim(s.name),''),'Servizio non disponibile'),
   b.start_at,b.end_at,b.status,b.price,b.notes
 FROM public.bookings b LEFT JOIN public.profiles p ON p.id=b.professional_id
 LEFT JOIN public.services s ON s.id=b.service_id AND s.professional_id=b.professional_id
 WHERE b.owner_id=v_uid;
END $$;

CREATE FUNCTION public.get_my_booking_message_inbox(p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(booking_id uuid,peer_name text,notes text,start_at timestamptz,unread_count bigint,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid inbox page' USING ERRCODE='22023'; END IF;
 RETURN QUERY WITH unread AS (
   SELECT b.id,count(m.id) AS unread_count,max(m.created_at) AS latest
   FROM public.bookings b JOIN public.booking_messages m ON m.booking_id=b.id AND m.sender_id<>v_uid
   LEFT JOIN public.booking_message_reads r ON r.booking_id=b.id AND r.reader_id=v_uid
   WHERE (b.owner_id=v_uid OR b.professional_id=v_uid) AND m.sequence>coalesce(r.last_read_sequence,0)
   GROUP BY b.id
 ) SELECT b.id,coalesce(nullif(btrim(p.full_name),''),'Partecipante'),b.notes,b.start_at,u.unread_count,count(*) OVER()
 FROM unread u JOIN public.bookings b ON b.id=u.id
 LEFT JOIN public.profiles p ON p.id=CASE WHEN b.owner_id=v_uid THEN b.professional_id ELSE b.owner_id END
 ORDER BY u.latest DESC,b.id LIMIT p_limit OFFSET p_offset;
END $$;

REVOKE ALL ON FUNCTION public.save_my_reply_template(uuid,text,text,text),public.list_my_reply_templates(),public.delete_my_reply_template(uuid),
 public.send_booking_message(uuid,uuid,text),public.get_booking_messages(uuid,bigint,bigint,integer),public.mark_booking_messages_read(uuid,bigint),
 public.get_booking_message_summaries(uuid[]),public.get_my_owner_bookings(),public.get_my_booking_message_inbox(integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_my_reply_template(uuid,text,text,text),public.list_my_reply_templates(),public.delete_my_reply_template(uuid),
 public.send_booking_message(uuid,uuid,text),public.get_booking_messages(uuid,bigint,bigint,integer),public.mark_booking_messages_read(uuid,bigint),
 public.get_booking_message_summaries(uuid[]),public.get_my_owner_bookings(),public.get_my_booking_message_inbox(integer,integer) TO authenticated;
COMMIT;
