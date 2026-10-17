-- Optional weekly hours for one instructor at one centre. Existing bookings are preserved.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
CREATE TABLE pc_private.instructor_weekly_shifts(
 instructor_id uuid PRIMARY KEY REFERENCES pc_private.centre_instructors(id) ON DELETE CASCADE,
 enabled boolean NOT NULL DEFAULT false, slots jsonb NOT NULL DEFAULT '[]',
 version uuid NOT NULL DEFAULT gen_random_uuid(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(jsonb_typeof(slots)='array' AND jsonb_array_length(slots)<=28)
);
CREATE TABLE pc_private.instructor_shift_events(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, instructor_id uuid NOT NULL,
 actor_id uuid NOT NULL, previous_value jsonb, new_value jsonb NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE pc_private.instructor_weekly_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.instructor_shift_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.instructor_weekly_shifts,pc_private.instructor_shift_events FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON SEQUENCE pc_private.instructor_shift_events_id_seq FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.normalize_instructor_shifts(p_slots jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE slot jsonb; result jsonb;
BEGIN
 IF p_slots IS NULL OR jsonb_typeof(p_slots)<>'array' THEN RAISE EXCEPTION 'Invalid weekly hours' USING ERRCODE='22023'; END IF;
 IF jsonb_array_length(p_slots)>28 THEN RAISE EXCEPTION 'Maximum four windows per day' USING ERRCODE='22023'; END IF;
 FOR slot IN SELECT value FROM jsonb_array_elements(p_slots) LOOP
  IF jsonb_typeof(slot)<>'object' OR slot-ARRAY['day','start','end']<>'{}'::jsonb
   OR (slot->>'day' ~ '^[1-7]$') IS DISTINCT FROM true
   OR jsonb_typeof(slot->'day') IS DISTINCT FROM 'number'
   OR (slot->>'start' ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$') IS DISTINCT FROM true
   OR (slot->>'end' ~ '^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$') IS DISTINCT FROM true
   THEN RAISE EXCEPTION 'Invalid weekly hours' USING ERRCODE='22023'; END IF;
  IF (slot->>'start')::time >= (slot->>'end')::time THEN RAISE EXCEPTION 'End must follow start on the same day' USING ERRCODE='22023'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_slots) x GROUP BY x->>'day' HAVING count(*)>4)
 OR EXISTS(SELECT 1 FROM (SELECT x->>'start' begins,lag(x->>'end') OVER(PARTITION BY x->>'day' ORDER BY x->>'start') previous_end FROM jsonb_array_elements(p_slots) x) q WHERE begins<=previous_end)
 THEN RAISE EXCEPTION 'Merge adjacent or overlapping windows; maximum four per day' USING ERRCODE='22023'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('day',(x->>'day')::integer,'start',x->>'start','end',x->>'end') ORDER BY (x->>'day')::integer,x->>'start'),'[]') INTO result FROM jsonb_array_elements(p_slots) x;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION pc_private.normalize_instructor_shifts(jsonb) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.instructor_shift_covers(p_instructor_id uuid,p_start timestamptz,p_end timestamptz) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE plan pc_private.instructor_weekly_shifts; day date; slot jsonb; ls timestamp; le timestamp; bs timestamptz; be timestamptz;
BEGIN
 IF p_start IS NULL OR p_end IS NULL OR p_end<=p_start OR NOT isfinite(p_start) OR NOT isfinite(p_end) THEN RETURN false; END IF;
 SELECT * INTO plan FROM pc_private.instructor_weekly_shifts WHERE instructor_id=p_instructor_id;
 IF NOT FOUND OR NOT plan.enabled THEN RETURN true; END IF;
 day:=(p_start AT TIME ZONE 'Europe/Rome')::date;
 FOR slot IN SELECT value FROM jsonb_array_elements(plan.slots) WHERE (value->>'day')::integer=extract(isodow FROM day)::integer LOOP
  ls:=day+(slot->>'start')::time;le:=day+(slot->>'end')::time;
  bs:=ls AT TIME ZONE 'Europe/Rome';be:=le AT TIME ZONE 'Europe/Rome';
  -- An occurrence whose boundary is repeated/nonexistent at DST is not silently chosen.
  IF (bs AT TIME ZONE 'Europe/Rome')<>ls OR (be AT TIME ZONE 'Europe/Rome')<>le
   OR ((bs-interval '1 hour') AT TIME ZONE 'Europe/Rome')=ls OR ((bs+interval '1 hour') AT TIME ZONE 'Europe/Rome')=ls
   OR ((be-interval '1 hour') AT TIME ZONE 'Europe/Rome')=le OR ((be+interval '1 hour') AT TIME ZONE 'Europe/Rome')=le THEN CONTINUE; END IF;
  IF p_start>=bs AND p_end<=be THEN RETURN true; END IF;
 END LOOP;
 RETURN false;
END $$;
REVOKE ALL ON FUNCTION pc_private.instructor_shift_covers(uuid,timestamptz,timestamptz) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.get_instructor_weekly_shifts(p_instructor_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE plan pc_private.instructor_weekly_shifts; centre uuid; can_edit boolean; affected integer;
BEGIN
 IF NOT pc_private.can_manage_instructor_time_off(p_instructor_id) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT centre_id INTO centre FROM pc_private.centre_instructors WHERE id=p_instructor_id;
 SELECT * INTO plan FROM pc_private.instructor_weekly_shifts WHERE instructor_id=p_instructor_id;
 can_edit:=centre=auth.uid() AND EXISTS(SELECT 1 FROM auth.users WHERE id=auth.uid() AND email_confirmed_at IS NOT NULL);
 SELECT count(*) INTO affected FROM pc_private.booking_instructors a JOIN public.bookings b ON b.id=a.booking_id
 WHERE a.instructor_id=p_instructor_id AND b.status='accepted' AND b.end_at>now()
 AND NOT pc_private.instructor_shift_covers(p_instructor_id,b.start_at,b.end_at);
 RETURN jsonb_build_object('instructor_id',p_instructor_id,'enabled',coalesce(plan.enabled,false),'slots',coalesce(plan.slots,'[]'),
 'version',plan.version,'can_edit',can_edit,'affected_bookings',affected,'timezone','Europe/Rome');
END $$;
CREATE FUNCTION pc_private.save_instructor_weekly_shifts(p_instructor_id uuid,p_enabled boolean,p_slots jsonb,p_expected_version uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE centre uuid; old pc_private.instructor_weekly_shifts; saved pc_private.instructor_weekly_shifts; canonical jsonb;
BEGIN
 SELECT i.centre_id INTO centre FROM pc_private.centre_instructors i JOIN public.professionals c ON c.id=i.centre_id
 JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id
 WHERE i.id=p_instructor_id AND c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'Centre permission required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=centre FOR UPDATE;
 -- Revalidate after the same lock used by assignments, roster and membership changes.
 IF NOT EXISTS(SELECT 1 FROM pc_private.centre_instructors i JOIN public.professionals c ON c.id=i.centre_id JOIN public.profiles p ON p.id=c.id JOIN auth.users u ON u.id=p.id WHERE i.id=p_instructor_id AND c.id=auth.uid() AND c.listing_type='center' AND p.role='professional' AND u.email_confirmed_at IS NOT NULL) THEN RAISE EXCEPTION 'Centre permission required' USING ERRCODE='42501'; END IF;
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'Choose whether to enable hours' USING ERRCODE='22023'; END IF;
 canonical:=pc_private.normalize_instructor_shifts(p_slots);
 IF p_enabled AND jsonb_array_length(canonical)=0 THEN RAISE EXCEPTION 'Choose at least one window' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM pc_private.instructor_weekly_shifts WHERE instructor_id=p_instructor_id FOR UPDATE;
 IF FOUND AND old.enabled=p_enabled AND old.slots=canonical THEN RETURN pc_private.get_instructor_weekly_shifts(p_instructor_id); END IF;
 IF p_expected_version IS DISTINCT FROM old.version THEN RAISE EXCEPTION 'Weekly hours changed' USING ERRCODE='40001'; END IF;
 INSERT INTO pc_private.instructor_weekly_shifts(instructor_id,enabled,slots) VALUES(p_instructor_id,p_enabled,canonical)
 ON CONFLICT(instructor_id) DO UPDATE SET enabled=excluded.enabled,slots=excluded.slots,version=gen_random_uuid(),updated_at=clock_timestamp() RETURNING * INTO saved;
 INSERT INTO pc_private.instructor_shift_events(instructor_id,actor_id,previous_value,new_value) VALUES(p_instructor_id,auth.uid(),CASE WHEN old.version IS NOT NULL THEN to_jsonb(old) END,to_jsonb(saved));
 RETURN pc_private.get_instructor_weekly_shifts(p_instructor_id);
END $$;
CREATE FUNCTION public.get_instructor_weekly_shifts(p_instructor_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.get_instructor_weekly_shifts(p_instructor_id); $$;
CREATE FUNCTION public.save_instructor_weekly_shifts(p_instructor_id uuid,p_enabled boolean,p_slots jsonb,p_expected_version uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.save_instructor_weekly_shifts(p_instructor_id,p_enabled,p_slots,p_expected_version); $$;
REVOKE ALL ON FUNCTION public.get_instructor_weekly_shifts(uuid),pc_private.get_instructor_weekly_shifts(uuid),public.save_instructor_weekly_shifts(uuid,boolean,jsonb,uuid),pc_private.save_instructor_weekly_shifts(uuid,boolean,jsonb,uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_instructor_weekly_shifts(uuid),pc_private.get_instructor_weekly_shifts(uuid),public.save_instructor_weekly_shifts(uuid,boolean,jsonb,uuid),pc_private.save_instructor_weekly_shifts(uuid,boolean,jsonb,uuid) TO authenticated;

DO $patch$ DECLARE definition text; old text:=$old$ IF EXISTS(SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=p_instructor_id AND NOT t.cancelled$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.assign_booking_instructor_checked(uuid,uuid,uuid,boolean)'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.assign_booking_instructor_checked(uuid,uuid,uuid,boolean)'; END IF;
 EXECUTE replace(definition,old,$new$ IF p_instructor_id IS NOT NULL AND NOT pc_private.instructor_shift_covers(p_instructor_id,b.start_at,b.end_at) THEN RAISE EXCEPTION 'Lesson outside weekly hours; check Italian time and DST boundaries' USING ERRCODE='PCX04'; END IF;
 IF EXISTS(SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=p_instructor_id AND NOT t.cancelled$new$); END $patch$;

DO $patch$ DECLARE definition text; old text:=$old$'version',a.version,'instructor_active',i.active$old$; BEGIN
 SELECT pg_get_functiondef('pc_private.get_booking_instructors(uuid[])'::regprocedure) INTO definition;
 IF (length(definition)-length(replace(definition,old,'')))/length(old)<>1 THEN RAISE EXCEPTION 'Unexpected function contract: pc_private.get_booking_instructors(uuid[])'; END IF;
 EXECUTE replace(definition,old,$new$'outside_shift',CASE WHEN b.professional_id=auth.uid() AND b.status='accepted' AND b.end_at>now() THEN NOT pc_private.instructor_shift_covers(a.instructor_id,b.start_at,b.end_at) ELSE false END,
 'version',a.version,'instructor_active',i.active$new$); END $patch$;

NOTIFY pgrst,'reload schema';
COMMIT;
