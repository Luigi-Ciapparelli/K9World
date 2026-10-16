-- Explicit access to conversations for currently assigned centre instructors.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE pc_private.centre_memberships ADD COLUMN can_message_clients boolean NOT NULL DEFAULT false;
-- Preserve the real sender and the centre's conversation if an instructor deletes their account.
ALTER TABLE public.booking_messages DROP CONSTRAINT booking_messages_sender_kind_check;
ALTER TABLE public.booking_messages ADD CONSTRAINT booking_messages_sender_kind_check CHECK(sender_kind IN ('owner','professional','instructor'));
ALTER TABLE public.booking_messages ALTER COLUMN sender_id DROP NOT NULL;
ALTER TABLE public.booking_messages DROP CONSTRAINT booking_messages_sender_id_fkey;
ALTER TABLE public.booking_messages ADD CONSTRAINT booking_messages_sender_id_fkey FOREIGN KEY(sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE TABLE pc_private.booking_message_actors(
 message_id uuid PRIMARY KEY REFERENCES public.booking_messages(id) ON DELETE CASCADE,
 centre_id uuid NOT NULL, membership_id uuid NOT NULL, actor_id uuid NOT NULL,
 actor_name text NOT NULL, instructor_name text NOT NULL, assignment_version uuid NOT NULL
);
ALTER TABLE pc_private.booking_message_actors ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.booking_message_actors FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.set_centre_message_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old pc_private.centre_memberships; r pc_private.centre_memberships;
BEGIN
 PERFORM 1 FROM public.professionals c JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id
 WHERE c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM pc_private.centre_memberships WHERE id=p_membership_id AND centre_id=auth.uid() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_allowed IS NULL OR old.status<>'active' THEN RAISE EXCEPTION 'Active membership required' USING ERRCODE='22023'; END IF;
 -- Check version before same-value return: a stale administrator cannot overwrite a later decision.
 IF p_expected_version IS DISTINCT FROM old.version THEN RAISE EXCEPTION 'Permission changed' USING ERRCODE='40001'; END IF;
 IF old.can_message_clients=p_allowed THEN RETURN jsonb_build_object('id',old.id,'version',old.version,'can_message_clients',old.can_message_clients); END IF;
 UPDATE pc_private.centre_memberships SET can_message_clients=p_allowed,version=gen_random_uuid(),updated_at=clock_timestamp()
 WHERE id=old.id RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value)
 VALUES(r.id,r.centre_id,auth.uid(),to_jsonb(old),to_jsonb(r));
 RETURN jsonb_build_object('id',r.id,'version',r.version,'can_message_clients',r.can_message_clients);
END $$;
CREATE FUNCTION pc_private.centre_message_access(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE x record;
BEGIN
 SELECT m.version membership_version,a.version assignment_version,m.centre_id,
 coalesce(nullif(btrim(person.full_name),''),'Istruttore del centro') actor_name,a.name_at_assignment instructor_name
 INTO x
 FROM pc_private.centre_memberships m
 JOIN pc_private.centre_instructors i ON i.id=m.instructor_id AND i.centre_id=m.centre_id AND i.active
 JOIN pc_private.booking_instructors a ON a.instructor_id=i.id AND a.centre_id=m.centre_id
 JOIN public.bookings b ON b.id=a.booking_id AND b.professional_id=m.centre_id
 JOIN pc_private.review_experiences e ON e.booking_id=b.id
 JOIN public.professionals c ON c.id=m.centre_id JOIN public.profiles cp ON cp.id=c.id
 JOIN public.profiles person ON person.id=m.account_id JOIN auth.users u ON u.id=person.id
 WHERE m.id=p_membership_id AND m.account_id=auth.uid() AND m.status='active' AND m.can_message_clients
 AND c.listing_type='center' AND cp.role='professional' AND person.role IN ('owner','professional')
 AND u.email_confirmed_at IS NOT NULL AND b.owner_id<>auth.uid() AND b.start_at>=m.accepted_at
 AND b.id=p_booking_id AND b.status IN ('accepted','completed') AND e.service_type IN ('trainer','enci_course');
 IF NOT FOUND THEN RAISE EXCEPTION 'Conversation permission unavailable' USING ERRCODE='42501'; END IF;
 IF x.membership_version IS DISTINCT FROM p_membership_version OR x.assignment_version IS DISTINCT FROM p_assignment_version THEN
 RAISE EXCEPTION 'Assignment or permission changed' USING ERRCODE='40001'; END IF;
 RETURN to_jsonb(x);
END $$;
REVOKE ALL ON FUNCTION pc_private.centre_message_access(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated,service_role;

CREATE OR REPLACE FUNCTION pc_private.get_booking_messages(p_booking_id uuid,p_before_sequence bigint DEFAULT NULL,p_after_sequence bigint DEFAULT NULL,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,sequence bigint,sender_name text,sender_kind text,body text,is_automatic boolean,from_me boolean,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.bookings b WHERE b.id=p_booking_id AND (b.owner_id=v_uid OR b.professional_id=v_uid)) THEN
   RAISE EXCEPTION 'Booking unavailable' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR (p_before_sequence IS NOT NULL AND p_before_sequence<1)
   OR (p_after_sequence IS NOT NULL AND p_after_sequence<0) OR (p_before_sequence IS NOT NULL AND p_after_sequence IS NOT NULL) THEN
   RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT m.id,m.sequence,coalesce(actor.actor_name,nullif(btrim(p.full_name),''),CASE WHEN m.sender_kind='owner' THEN 'Proprietario' ELSE 'Professionista' END),
   m.sender_kind,m.body,m.automatic_event IS NOT NULL,coalesce(m.sender_id=v_uid,false),m.created_at
 FROM public.booking_messages m LEFT JOIN public.profiles p ON p.id=m.sender_id LEFT JOIN pc_private.booking_message_actors actor ON actor.message_id=m.id
 WHERE m.booking_id=p_booking_id AND (p_before_sequence IS NULL OR m.sequence<p_before_sequence)
   AND (p_after_sequence IS NULL OR m.sequence>p_after_sequence)
 ORDER BY CASE WHEN p_after_sequence IS NOT NULL THEN m.sequence END ASC,m.sequence DESC LIMIT p_limit;
END $$;
CREATE FUNCTION pc_private.get_centre_lesson_messages(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_before_sequence bigint DEFAULT NULL,p_after_sequence bigint DEFAULT NULL,p_limit integer DEFAULT 50)
RETURNS TABLE(id uuid,sequence bigint,sender_name text,sender_kind text,body text,is_automatic boolean,from_me boolean,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 PERFORM pc_private.centre_message_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR (p_before_sequence IS NOT NULL AND p_before_sequence<1)
   OR (p_after_sequence IS NOT NULL AND p_after_sequence<0) OR (p_before_sequence IS NOT NULL AND p_after_sequence IS NOT NULL) THEN
   RAISE EXCEPTION 'Invalid page' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT m.id,m.sequence,coalesce(actor.actor_name,nullif(btrim(p.full_name),''),CASE WHEN m.sender_kind='owner' THEN 'Proprietario' ELSE 'Professionista' END),
   m.sender_kind,m.body,m.automatic_event IS NOT NULL,coalesce(m.sender_id=v_uid,false),m.created_at
 FROM public.booking_messages m LEFT JOIN public.profiles p ON p.id=m.sender_id LEFT JOIN pc_private.booking_message_actors actor ON actor.message_id=m.id
 WHERE m.booking_id=p_booking_id AND (p_before_sequence IS NULL OR m.sequence<p_before_sequence)
   AND (p_after_sequence IS NULL OR m.sequence>p_after_sequence)
 ORDER BY CASE WHEN p_after_sequence IS NOT NULL THEN m.sequence END ASC,m.sequence DESC LIMIT p_limit;
END $$;
CREATE FUNCTION pc_private.send_centre_lesson_message(p_request_id uuid,p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_body text)
RETURNS TABLE(id uuid,sequence bigint,created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; access jsonb; old public.booking_messages;
BEGIN
 IF p_request_id IS NULL OR p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 4000 THEN
 RAISE EXCEPTION 'Invalid message' USING ERRCODE='22023'; END IF;
 SELECT cm.centre_id INTO centre FROM pc_private.centre_memberships cm WHERE cm.id=p_membership_id AND cm.account_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same first lock as permission revocation, reassignment and membership changes.
 PERFORM 1 FROM public.professionals WHERE public.professionals.id=centre FOR UPDATE;
 PERFORM 1 FROM public.bookings WHERE public.bookings.id=p_booking_id AND professional_id=centre FOR UPDATE;
 access:=pc_private.centre_message_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 SELECT * INTO old FROM public.booking_messages m WHERE m.id=p_request_id;
 IF FOUND THEN
 IF old.booking_id IS DISTINCT FROM p_booking_id OR old.sender_id IS DISTINCT FROM auth.uid() OR old.sender_kind<>'instructor'
 OR old.body<>btrim(p_body) OR NOT EXISTS(SELECT 1 FROM pc_private.booking_message_actors a WHERE a.message_id=old.id AND a.membership_id=p_membership_id AND a.assignment_version=p_assignment_version) THEN
 RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT old.id,old.sequence,old.created_at; RETURN;
 END IF;
 INSERT INTO public.booking_messages(id,booking_id,sequence,sender_id,sender_kind,body)
 SELECT p_request_id,p_booking_id,coalesce(max(m.sequence),0)+1,auth.uid(),'instructor',btrim(p_body)
 FROM public.booking_messages m WHERE m.booking_id=p_booking_id;
 INSERT INTO pc_private.booking_message_actors(message_id,centre_id,membership_id,actor_id,actor_name,instructor_name,assignment_version)
 VALUES(p_request_id,centre,p_membership_id,auth.uid(),access->>'actor_name',access->>'instructor_name',p_assignment_version);
 RETURN QUERY SELECT m.id,m.sequence,m.created_at FROM public.booking_messages m WHERE m.id=p_request_id;
END $$;
CREATE FUNCTION pc_private.mark_centre_lesson_messages_read(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_through_sequence bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; maximum bigint; result bigint;
BEGIN
 SELECT cm.centre_id INTO centre FROM pc_private.centre_memberships cm WHERE cm.id=p_membership_id AND cm.account_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 PERFORM 1 FROM public.bookings WHERE id=p_booking_id AND professional_id=centre FOR KEY SHARE;
 PERFORM pc_private.centre_message_access(p_booking_id,p_membership_id,p_membership_version,p_assignment_version);
 SELECT coalesce(max(sequence),0) INTO maximum FROM public.booking_messages WHERE booking_id=p_booking_id;
 IF p_through_sequence IS NULL OR p_through_sequence<0 OR p_through_sequence>maximum THEN RAISE EXCEPTION 'Invalid read position' USING ERRCODE='22023'; END IF;
 INSERT INTO public.booking_message_reads AS target(booking_id,reader_id,last_read_sequence)
 VALUES(p_booking_id,auth.uid(),p_through_sequence)
 ON CONFLICT(booking_id,reader_id) DO UPDATE SET last_read_sequence=greatest(target.last_read_sequence,excluded.last_read_sequence),updated_at=clock_timestamp()
 RETURNING last_read_sequence INTO result;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION pc_private.get_my_centre_memberships() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.invited_at DESC),'[]') INTO result FROM (
 SELECT m.id,m.can_complete_lessons,m.can_message_clients,m.instructor_id,m.instructor_name,m.account_name,m.version,m.invited_at,m.expires_at,m.accepted_at,
 CASE WHEN m.status='pending' AND m.expires_at<=statement_timestamp() THEN 'expired' ELSE m.status END status,
 m.centre_id=auth.uid() is_centre,coalesce(nullif(p.full_name,''),'Centro cinofilo') centre_name,
 (i.active AND c.listing_type='center' AND p.role='professional') instructor_active
 FROM pc_private.centre_memberships m JOIN public.profiles p ON p.id=m.centre_id
 JOIN public.professionals c ON c.id=m.centre_id JOIN pc_private.centre_instructors i ON i.id=m.instructor_id
 WHERE auth.uid() IN (m.centre_id,m.account_id)
 ORDER BY (m.status IN ('active','pending')) DESC,m.invited_at DESC LIMIT 400) x;
 RETURN result;
END $$;
CREATE OR REPLACE FUNCTION pc_private.get_my_centre_lessons(p_from timestamptz,p_until timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb; total integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_until IS NULL OR p_until<=p_from OR p_until-p_from>interval '32 days' THEN
 RAISE EXCEPTION 'Scegli un intervallo massimo di 32 giorni.' USING ERRCODE='22023'; END IF;
 -- Only lesson data, no notes, contact details, prices, photos, messages or dog archive.
 WITH allowed AS (
 SELECT b.id,b.start_at,b.end_at,b.status,e.service_name,e.service_type,
 (m.can_message_clients AND b.owner_id<>auth.uid()) can_message,
 CASE WHEN m.can_message_clients AND b.owner_id<>auth.uid() THEN (SELECT count(*) FROM public.booking_messages msg WHERE msg.booking_id=b.id) ELSE 0 END message_count,
 CASE WHEN m.can_message_clients AND b.owner_id<>auth.uid() THEN (SELECT count(*) FROM public.booking_messages msg WHERE msg.booking_id=b.id AND msg.sender_id IS DISTINCT FROM auth.uid() AND msg.sequence>coalesce((SELECT last_read_sequence FROM public.booking_message_reads rd WHERE rd.booking_id=b.id AND rd.reader_id=auth.uid()),0)) ELSE 0 END unread_count,
 m.id membership_id,m.version membership_version,a.version assignment_version,
 (m.can_complete_lessons AND b.status='accepted' AND b.end_at<=statement_timestamp() AND b.owner_id<>auth.uid()) can_complete,
 (SELECT x.actor_name FROM pc_private.centre_lesson_completions x WHERE x.booking_id=b.id) completed_by,

 coalesce(nullif(cp.full_name,''),'Centro cinofilo') centre_name,a.name_at_assignment instructor_name,
 coalesce(nullif(op.full_name,''),'Cliente') client_name,
 (SELECT coalesce(jsonb_agg(d.name ORDER BY d.name),'[]') FROM public.booking_dogs bd JOIN public.dogs d ON d.id=bd.dog_id WHERE bd.booking_id=b.id) dog_names
 FROM pc_private.centre_memberships m JOIN pc_private.centre_instructors i ON i.id=m.instructor_id AND i.centre_id=m.centre_id
 JOIN pc_private.booking_instructors a ON a.instructor_id=i.id AND a.centre_id=m.centre_id
 JOIN public.bookings b ON b.id=a.booking_id AND b.professional_id=m.centre_id
 JOIN pc_private.review_experiences e ON e.booking_id=b.id
 JOIN public.professionals c ON c.id=m.centre_id JOIN public.profiles cp ON cp.id=c.id
 LEFT JOIN public.profiles op ON op.id=b.owner_id
 JOIN public.profiles person ON person.id=m.account_id JOIN auth.users u ON u.id=person.id
 WHERE m.account_id=auth.uid() AND m.status='active' AND i.active AND c.listing_type='center' AND cp.role='professional'
 AND person.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL
 AND b.status IN ('accepted','completed') AND e.service_type IN ('trainer','enci_course')
 AND b.start_at>=m.accepted_at AND b.start_at<p_until AND b.end_at>p_from)
 SELECT count(*),coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.start_at,t.id) FROM (SELECT * FROM allowed ORDER BY start_at,id LIMIT 300) t),'[]') INTO total,rows FROM allowed;
 RETURN jsonb_build_object('items',rows,'truncated',total>300);
END $$;
CREATE FUNCTION public.set_centre_message_permission(p_membership_id uuid,p_allowed boolean,p_expected_version uuid) RETURNS jsonb LANGUAGE sql  SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.set_centre_message_permission(p_membership_id,p_allowed,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.set_centre_message_permission(uuid,boolean,uuid),pc_private.set_centre_message_permission(uuid,boolean,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.set_centre_message_permission(uuid,boolean,uuid),pc_private.set_centre_message_permission(uuid,boolean,uuid) TO authenticated;

CREATE FUNCTION public.get_centre_lesson_messages(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_before_sequence bigint DEFAULT NULL,p_after_sequence bigint DEFAULT NULL,p_limit integer DEFAULT 50) RETURNS TABLE(id uuid,sequence bigint,sender_name text,sender_kind text,body text,is_automatic boolean,from_me boolean,created_at timestamptz) LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM pc_private.get_centre_lesson_messages(p_booking_id,p_membership_id,p_membership_version,p_assignment_version,p_before_sequence,p_after_sequence,p_limit); $$;
REVOKE ALL ON FUNCTION public.get_centre_lesson_messages(uuid,uuid,uuid,uuid,bigint,bigint,integer),pc_private.get_centre_lesson_messages(uuid,uuid,uuid,uuid,bigint,bigint,integer) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_centre_lesson_messages(uuid,uuid,uuid,uuid,bigint,bigint,integer),pc_private.get_centre_lesson_messages(uuid,uuid,uuid,uuid,bigint,bigint,integer) TO authenticated;

CREATE FUNCTION public.send_centre_lesson_message(p_request_id uuid,p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_body text) RETURNS TABLE(id uuid,sequence bigint,created_at timestamptz) LANGUAGE sql  SECURITY INVOKER SET search_path='' AS $$ SELECT * FROM pc_private.send_centre_lesson_message(p_request_id,p_booking_id,p_membership_id,p_membership_version,p_assignment_version,p_body); $$;
REVOKE ALL ON FUNCTION public.send_centre_lesson_message(uuid,uuid,uuid,uuid,uuid,text),pc_private.send_centre_lesson_message(uuid,uuid,uuid,uuid,uuid,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.send_centre_lesson_message(uuid,uuid,uuid,uuid,uuid,text),pc_private.send_centre_lesson_message(uuid,uuid,uuid,uuid,uuid,text) TO authenticated;

CREATE FUNCTION public.mark_centre_lesson_messages_read(p_booking_id uuid,p_membership_id uuid,p_membership_version uuid,p_assignment_version uuid,p_through_sequence bigint) RETURNS bigint LANGUAGE sql  SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.mark_centre_lesson_messages_read(p_booking_id,p_membership_id,p_membership_version,p_assignment_version,p_through_sequence); $$;
REVOKE ALL ON FUNCTION public.mark_centre_lesson_messages_read(uuid,uuid,uuid,uuid,bigint),pc_private.mark_centre_lesson_messages_read(uuid,uuid,uuid,uuid,bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.mark_centre_lesson_messages_read(uuid,uuid,uuid,uuid,bigint),pc_private.mark_centre_lesson_messages_read(uuid,uuid,uuid,uuid,bigint) TO authenticated;

-- Snapshot author in the existing authorized export, without adding access or exporting account IDs.
DO $migration$
DECLARE definition text; marker text:='m.sender_kind,m.body,m.created_at,m.automatic_event';
BEGIN
 SELECT pg_get_functiondef('pc_private.export_dog_history(text,uuid,timestamptz,timestamptz,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,marker,'')))/length(marker)<>1 THEN RAISE EXCEPTION 'Unexpected export contract'; END IF;
 EXECUTE replace(definition,marker,marker||', (SELECT a.actor_name FROM pc_private.booking_message_actors a WHERE a.message_id=m.id) sender_name');
END $migration$;
CREATE OR REPLACE FUNCTION pc_private.send_booking_message(p_request_id uuid,p_booking_id uuid,p_body text)
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
   IF v_old.booking_id<>p_booking_id OR v_old.sender_id IS DISTINCT FROM v_uid OR v_old.body<>btrim(p_body) OR v_old.automatic_event IS NOT NULL THEN
     RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
   RETURN QUERY SELECT v_old.id,v_old.sequence,v_old.created_at; RETURN;
 END IF;
 RETURN QUERY INSERT INTO public.booking_messages AS inserted(id,booking_id,sequence,sender_id,sender_kind,body)
 SELECT p_request_id,p_booking_id,coalesce(max(m.sequence),0)+1,v_uid,
   CASE WHEN v_booking.owner_id=v_uid THEN 'owner' ELSE 'professional' END,btrim(p_body)
 FROM public.booking_messages m WHERE m.booking_id=p_booking_id
 RETURNING inserted.id,inserted.sequence,inserted.created_at;
END $$;
CREATE OR REPLACE FUNCTION pc_private.get_booking_message_summaries(p_booking_ids uuid[])
RETURNS TABLE(booking_id uuid,message_count bigint,unread_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_booking_ids IS NULL OR cardinality(p_booking_ids)>200 THEN RAISE EXCEPTION 'Invalid booking batch' USING ERRCODE='22023'; END IF;
 RETURN QUERY SELECT b.id,count(m.id),count(m.id) FILTER(WHERE m.sender_id IS DISTINCT FROM v_uid AND m.sequence>coalesce(r.last_read_sequence,0))
 FROM public.bookings b LEFT JOIN public.booking_messages m ON m.booking_id=b.id
 LEFT JOIN public.booking_message_reads r ON r.booking_id=b.id AND r.reader_id=v_uid
 WHERE b.id=ANY(p_booking_ids) AND (b.owner_id=v_uid OR b.professional_id=v_uid)
 GROUP BY b.id;
END $$;
CREATE OR REPLACE FUNCTION pc_private.get_my_booking_message_inbox(p_limit integer DEFAULT 20,p_offset integer DEFAULT 0)
RETURNS TABLE(booking_id uuid,peer_name text,notes text,start_at timestamptz,unread_count bigint,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
 IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 100 OR p_offset IS NULL OR p_offset<0 THEN RAISE EXCEPTION 'Invalid inbox page' USING ERRCODE='22023'; END IF;
 RETURN QUERY WITH unread AS (
   SELECT b.id,count(m.id) AS unread_count,max(m.created_at) AS latest
   FROM public.bookings b JOIN public.booking_messages m ON m.booking_id=b.id AND m.sender_id IS DISTINCT FROM v_uid
   LEFT JOIN public.booking_message_reads r ON r.booking_id=b.id AND r.reader_id=v_uid
   WHERE (b.owner_id=v_uid OR b.professional_id=v_uid) AND m.sequence>coalesce(r.last_read_sequence,0)
   GROUP BY b.id
 ) SELECT b.id,coalesce(nullif(btrim(p.full_name),''),'Partecipante'),b.notes,b.start_at,u.unread_count,count(*) OVER()
 FROM unread u JOIN public.bookings b ON b.id=u.id
 LEFT JOIN public.profiles p ON p.id=CASE WHEN b.owner_id=v_uid THEN b.professional_id ELSE b.owner_id END
 ORDER BY u.latest DESC,b.id LIMIT p_limit OFFSET p_offset;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
