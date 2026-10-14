-- Confirmed centre collaborations. Only the assigned lesson agenda is delegated.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TABLE pc_private.centre_link_codes (
 account_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
 expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '7 days')
);
CREATE TABLE pc_private.centre_memberships (
 id uuid PRIMARY KEY,
 centre_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
 instructor_id uuid NOT NULL REFERENCES pc_private.centre_instructors(id) ON DELETE CASCADE,
 account_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 status text NOT NULL CHECK(status IN ('pending','active','declined','revoked','expired')),
 instructor_name text NOT NULL,
 account_name text NOT NULL,
 version uuid NOT NULL DEFAULT gen_random_uuid(),
 invited_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 expires_at timestamptz NOT NULL DEFAULT (clock_timestamp()+interval '7 days'),
 accepted_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(centre_id<>account_id),
 CHECK(status<>'active' OR accepted_at IS NOT NULL)
);
CREATE UNIQUE INDEX centre_memberships_open_instructor ON pc_private.centre_memberships(instructor_id) WHERE status IN ('pending','active');
CREATE UNIQUE INDEX centre_memberships_open_account ON pc_private.centre_memberships(centre_id,account_id) WHERE status IN ('pending','active');
CREATE INDEX centre_memberships_account ON pc_private.centre_memberships(account_id,status);
CREATE INDEX centre_memberships_centre ON pc_private.centre_memberships(centre_id,invited_at DESC);
CREATE TABLE pc_private.centre_membership_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 membership_id uuid NOT NULL,
 centre_id uuid REFERENCES public.professionals(id) ON DELETE SET NULL,
 actor_id uuid,
 previous_value jsonb,
 new_value jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX centre_membership_events_centre ON pc_private.centre_membership_events(centre_id,id);
ALTER TABLE pc_private.centre_link_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.centre_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.centre_membership_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.centre_link_codes,pc_private.centre_memberships,pc_private.centre_membership_events FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE pc_private.centre_membership_events_id_seq FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.get_centre_link_code() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r pc_private.centre_link_codes;
BEGIN
 -- No mailbox lookup or public account directory. The person supplies this code.
 PERFORM 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND p.role IN ('owner','professional') FOR UPDATE OF p;
 IF NOT FOUND THEN RAISE EXCEPTION 'Conferma la tua email prima di collegarti a un centro.' USING ERRCODE='42501'; END IF;
 INSERT INTO pc_private.centre_link_codes(account_id) VALUES(auth.uid())
 ON CONFLICT(account_id) DO UPDATE SET
 code=CASE WHEN centre_link_codes.expires_at<=clock_timestamp() THEN gen_random_uuid() ELSE centre_link_codes.code END,
 expires_at=CASE WHEN centre_link_codes.expires_at<=clock_timestamp() THEN clock_timestamp()+interval '7 days' ELSE centre_link_codes.expires_at END
 RETURNING * INTO r;
 RETURN jsonb_build_object('code',r.code,'expires_at',r.expires_at);
END $$;

CREATE FUNCTION pc_private.invite_centre_account(p_id uuid,p_instructor_id uuid,p_code uuid,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE m pc_private.centre_instructors; target_id uuid; target_name text; r pc_private.centre_memberships; old pc_private.centre_memberships;
BEGIN
 PERFORM 1 FROM public.professionals c JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id
 WHERE c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL FOR UPDATE OF c;
 IF NOT FOUND THEN RAISE EXCEPTION 'Centro con email confermata richiesto.' USING ERRCODE='42501'; END IF;
 SELECT * INTO m FROM pc_private.centre_instructors WHERE id=p_instructor_id AND centre_id=auth.uid() FOR UPDATE;
 IF NOT FOUND OR NOT m.active THEN RAISE EXCEPTION 'Scegli un istruttore attivo del centro.' USING ERRCODE='22023'; END IF;
 SELECT k.account_id,p.full_name INTO target_id,target_name FROM pc_private.centre_link_codes k
 JOIN public.profiles p ON p.id=k.account_id JOIN auth.users u ON u.id=p.id
 WHERE k.code=p_code AND k.expires_at>clock_timestamp() AND k.account_id<>auth.uid()
 AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Codice non valido o scaduto.' USING ERRCODE='22023'; END IF;
 SELECT * INTO r FROM pc_private.centre_memberships WHERE id=p_id;
 IF FOUND THEN
  IF r.centre_id=auth.uid() AND r.instructor_id=m.id AND r.account_id=target_id THEN RETURN to_jsonb(r); END IF;
  RAISE EXCEPTION 'Richiesta già usata.' USING ERRCODE='40001';
 END IF;
 IF p_id IS NULL OR m.version IS DISTINCT FROM p_expected_version THEN RAISE EXCEPTION 'Elenco cambiato. Ricarica.' USING ERRCODE='40001'; END IF;
 -- Expired requests are closed under the same centre lock and retain audit history.
 FOR old IN SELECT * FROM pc_private.centre_memberships WHERE centre_id=auth.uid() AND status='pending' AND expires_at<=clock_timestamp() FOR UPDATE LOOP
  UPDATE pc_private.centre_memberships SET status='expired',version=gen_random_uuid(),updated_at=clock_timestamp() WHERE id=old.id RETURNING * INTO r;
  INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value) VALUES(r.id,auth.uid(),auth.uid(),to_jsonb(old),to_jsonb(r));
 END LOOP;
 IF EXISTS(SELECT 1 FROM pc_private.centre_memberships WHERE centre_id=auth.uid() AND (instructor_id=m.id OR account_id=target_id) AND status IN ('pending','active')) THEN
 RAISE EXCEPTION 'Collegamento già presente: revocalo prima di crearne un altro.' USING ERRCODE='22023'; END IF;
 INSERT INTO pc_private.centre_memberships(id,centre_id,instructor_id,account_id,status,instructor_name,account_name)
 VALUES(p_id,auth.uid(),m.id,target_id,'pending',m.display_name,coalesce(nullif(btrim(target_name),''),'Account personale')) RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,new_value) VALUES(r.id,auth.uid(),auth.uid(),to_jsonb(r));
 RETURN to_jsonb(r);
END $$;

CREATE FUNCTION pc_private.change_centre_membership(p_id uuid,p_action text,p_expected_version uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r pc_private.centre_memberships; old pc_private.centre_memberships; centre uuid; next_status text;
BEGIN
 SELECT centre_id INTO centre FROM pc_private.centre_memberships WHERE id=p_id AND auth.uid() IN (centre_id,account_id);
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 -- Same order as roster/assignment writes. Recheck membership after taking the lock.
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 SELECT * INTO old FROM pc_private.centre_memberships WHERE id=p_id AND auth.uid() IN (centre_id,account_id) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_action IN ('accept','decline') AND auth.uid()=old.account_id THEN
  next_status:=CASE p_action WHEN 'accept' THEN 'active' ELSE 'declined' END;
 ELSIF p_action='revoke' THEN next_status:='revoked';
 ELSE RAISE EXCEPTION 'Azione non consentita.' USING ERRCODE='42501'; END IF;
 IF old.status=next_status THEN RETURN to_jsonb(old); END IF;
 IF old.version IS DISTINCT FROM p_expected_version THEN RAISE EXCEPTION 'Collegamento cambiato. Ricarica.' USING ERRCODE='40001'; END IF;
 IF old.status NOT IN ('pending','active') OR (p_action IN ('accept','decline') AND old.status<>'pending') THEN
 RAISE EXCEPTION 'Questo collegamento è chiuso.' USING ERRCODE='22023'; END IF;
 IF p_action='accept' THEN
  IF old.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'Richiesta scaduta.' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM pc_private.centre_instructors i JOIN public.professionals c ON c.id=i.centre_id JOIN public.profiles cp ON cp.id=c.id
   WHERE i.id=old.instructor_id AND i.active AND c.listing_type='center' AND cp.role='professional')
  OR NOT EXISTS(SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id WHERE p.id=auth.uid() AND p.role IN ('owner','professional') AND u.email_confirmed_at IS NOT NULL) THEN
   RAISE EXCEPTION 'Collegamento non disponibile. Controlla email e stato del centro.' USING ERRCODE='42501'; END IF;
 END IF;
 UPDATE pc_private.centre_memberships SET status=next_status,accepted_at=CASE WHEN next_status='active' THEN clock_timestamp() ELSE accepted_at END,
 version=gen_random_uuid(),updated_at=clock_timestamp() WHERE id=p_id RETURNING * INTO r;
 INSERT INTO pc_private.centre_membership_events(membership_id,centre_id,actor_id,previous_value,new_value) VALUES(r.id,r.centre_id,auth.uid(),to_jsonb(old),to_jsonb(r));
 RETURN to_jsonb(r);
END $$;

CREATE FUNCTION pc_private.get_my_centre_memberships() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x) ORDER BY x.invited_at DESC),'[]') INTO result FROM (
 SELECT m.id,m.instructor_id,m.instructor_name,m.account_name,m.version,m.invited_at,m.expires_at,m.accepted_at,
 CASE WHEN m.status='pending' AND m.expires_at<=statement_timestamp() THEN 'expired' ELSE m.status END status,
 m.centre_id=auth.uid() is_centre,coalesce(nullif(p.full_name,''),'Centro cinofilo') centre_name,
 (i.active AND c.listing_type='center' AND p.role='professional') instructor_active
 FROM pc_private.centre_memberships m JOIN public.profiles p ON p.id=m.centre_id
 JOIN public.professionals c ON c.id=m.centre_id JOIN pc_private.centre_instructors i ON i.id=m.instructor_id
 WHERE auth.uid() IN (m.centre_id,m.account_id)
 ORDER BY (m.status IN ('active','pending')) DESC,m.invited_at DESC LIMIT 400) x;
 RETURN result;
END $$;

CREATE FUNCTION pc_private.get_my_centre_lessons(p_from timestamptz,p_until timestamptz) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE rows jsonb; total integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_from IS NULL OR p_until IS NULL OR p_until<=p_from OR p_until-p_from>interval '32 days' THEN
 RAISE EXCEPTION 'Scegli un intervallo massimo di 32 giorni.' USING ERRCODE='22023'; END IF;
 -- Only lesson data, no notes, contact details, prices, photos, messages or dog archive.
 WITH allowed AS (
 SELECT b.id,b.start_at,b.end_at,b.status,e.service_name,e.service_type,
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

CREATE FUNCTION public.get_centre_link_code() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_centre_link_code(); $$;
CREATE FUNCTION public.invite_centre_account(p_id uuid,p_instructor_id uuid,p_code uuid,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.invite_centre_account(p_id,p_instructor_id,p_code,p_expected_version); $$;
CREATE FUNCTION public.change_centre_membership(p_id uuid,p_action text,p_expected_version uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.change_centre_membership(p_id,p_action,p_expected_version); $$;
CREATE FUNCTION public.get_my_centre_memberships() RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_my_centre_memberships(); $$;
CREATE FUNCTION public.get_my_centre_lessons(p_from timestamptz,p_until timestamptz) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_my_centre_lessons(p_from,p_until); $$;
REVOKE ALL ON FUNCTION public.get_centre_link_code(),pc_private.get_centre_link_code(),public.invite_centre_account(uuid,uuid,uuid,uuid),pc_private.invite_centre_account(uuid,uuid,uuid,uuid),
 public.change_centre_membership(uuid,text,uuid),pc_private.change_centre_membership(uuid,text,uuid),public.get_my_centre_memberships(),pc_private.get_my_centre_memberships(),public.get_my_centre_lessons(timestamptz,timestamptz),pc_private.get_my_centre_lessons(timestamptz,timestamptz) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_centre_link_code(),pc_private.get_centre_link_code(),public.invite_centre_account(uuid,uuid,uuid,uuid),pc_private.invite_centre_account(uuid,uuid,uuid,uuid),
 public.change_centre_membership(uuid,text,uuid),pc_private.change_centre_membership(uuid,text,uuid),public.get_my_centre_memberships(),pc_private.get_my_centre_memberships(),public.get_my_centre_lessons(timestamptz,timestamptz),pc_private.get_my_centre_lessons(timestamptz,timestamptz) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
