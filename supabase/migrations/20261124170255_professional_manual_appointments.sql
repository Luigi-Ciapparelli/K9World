-- Appointments agreed outside the portal: private planning, never public bookings.
SET LOCAL lock_timeout='5s';
CREATE TABLE pc_private.manual_appointments (
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  id uuid NOT NULL, service_id uuid NOT NULL, service_name text NOT NULL, service_type text NOT NULL,
  duration_minutes integer NOT NULL CHECK(duration_minutes>0), calendar_color text NOT NULL,
  start_at timestamptz NOT NULL, end_at timestamptz NOT NULL CHECK(end_at>start_at),
  dog_label text NOT NULL CHECK(char_length(dog_label)<=64),
  instructor_id uuid, instructor_name text, version integer NOT NULL DEFAULT 1,
  cancelled boolean NOT NULL DEFAULT false, PRIMARY KEY(professional_id,id)
);
ALTER TABLE pc_private.manual_appointments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.manual_appointments FROM PUBLIC,anon,authenticated,service_role;
CREATE INDEX manual_agenda_time ON pc_private.manual_appointments(professional_id,start_at,end_at) WHERE NOT cancelled;

CREATE FUNCTION pc_private.list_my_manual_appointments(p_from date,p_to date,p_offset integer)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); result jsonb;
BEGIN
  IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=uid AND p.role='professional') THEN RAISE insufficient_privilege; END IF;
  IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to) OR p_to<=p_from OR p_to-p_from>62 OR p_offset IS NULL OR p_offset<0 THEN RAISE invalid_parameter_value; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.start_at,a.id),'[]'::jsonb) INTO result FROM (
    SELECT id,service_id,service_name,duration_minutes,calendar_color,start_at,end_at,dog_label,instructor_id,instructor_name,version
    FROM pc_private.manual_appointments WHERE professional_id=uid AND NOT cancelled
      AND start_at<(p_to::timestamp AT TIME ZONE 'Europe/Rome') AND end_at>(p_from::timestamp AT TIME ZONE 'Europe/Rome')
    ORDER BY start_at,id LIMIT 200 OFFSET p_offset) a;
  RETURN result;
END $$;

CREATE FUNCTION pc_private.save_my_manual_appointment(p_id uuid,p_version integer,p_service_id uuid,p_day date,p_time time,p_dog text,p_instructor uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); centre boolean; permit boolean; old pc_private.manual_appointments; s public.services;
  coach text; starts timestamptz; ends timestamptz; wall timestamp; dog text:=btrim(coalesce(p_dog,'')); v integer;
BEGIN
  SELECT pro.listing_type IS NOT DISTINCT FROM 'center',pro.approved AND pro.approval_status='approved' INTO centre,permit
    FROM public.professionals pro JOIN public.profiles p ON p.id=pro.id JOIN auth.users u ON u.id=pro.id
    WHERE pro.id=uid AND p.role='professional' AND u.email_confirmed_at IS NOT NULL FOR UPDATE OF pro;
  IF NOT FOUND OR permit IS NOT TRUE THEN RAISE EXCEPTION 'Confirmed and approved professional required' USING ERRCODE='42501'; END IF;
  IF p_id IS NULL OR p_version IS NULL OR p_version<0 OR p_service_id IS NULL OR p_day IS NULL OR NOT isfinite(p_day)
     OR p_time IS NULL OR p_time>=time '24:00' OR extract(second FROM p_time)<>0 OR char_length(dog)>64 OR dog ~ '[[:cntrl:]]' THEN RAISE invalid_parameter_value; END IF;
  wall:=p_day+p_time; starts:=wall AT TIME ZONE 'Europe/Rome';
  IF (starts AT TIME ZONE 'Europe/Rome')<>wall OR ((starts-interval '1 hour') AT TIME ZONE 'Europe/Rome')=wall
      OR ((starts+interval '1 hour') AT TIME ZONE 'Europe/Rome')=wall THEN RAISE EXCEPTION 'Ambiguous local time' USING ERRCODE='PCJ03'; END IF;
  SELECT * INTO old FROM pc_private.manual_appointments WHERE professional_id=uid AND id=p_id;
  IF FOUND THEN
    IF NOT old.cancelled AND old.start_at=starts AND old.service_id=p_service_id AND old.dog_label=dog AND old.instructor_id IS NOT DISTINCT FROM p_instructor
       AND (p_version=old.version OR p_version=old.version-1) THEN RETURN old.version; END IF;
    IF old.cancelled OR p_version<>old.version THEN RAISE serialization_failure; END IF;
  ELSIF p_version<>0 THEN RAISE serialization_failure; END IF;
  IF p_day NOT BETWEEN (now() AT TIME ZONE 'Europe/Rome')::date-365 AND (now() AT TIME ZONE 'Europe/Rome')::date+730 THEN RAISE invalid_parameter_value; END IF;
  IF old.service_id=p_service_id THEN
    s.id:=old.service_id;s.name:=old.service_name;s.duration_minutes:=old.duration_minutes;s.calendar_color:=old.calendar_color;s.service_type:=old.service_type;
  ELSE
    SELECT * INTO s FROM public.services WHERE id=p_service_id AND professional_id=uid AND active FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Service not available' USING ERRCODE='PCJ04'; END IF;
  END IF;
  IF s.duration_minutes IS NULL OR s.duration_minutes<1 THEN RAISE invalid_parameter_value; END IF;
  ends:=starts+make_interval(mins=>s.duration_minutes);
  IF EXISTS(SELECT 1 FROM public.professional_time_off WHERE professional_id=uid AND starts_at<ends AND ends_at>starts) THEN RAISE EXCEPTION 'Unavailable' USING ERRCODE='PCA02'; END IF;
  IF p_instructor IS NOT NULL THEN
    SELECT i.display_name INTO coach FROM pc_private.centre_instructors i WHERE i.id=p_instructor AND i.centre_id=uid AND i.active AND centre;
    IF NOT FOUND THEN RAISE invalid_parameter_value; END IF;
    IF NOT pc_private.instructor_shift_covers(p_instructor,starts,ends) THEN RAISE EXCEPTION 'Outside shift' USING ERRCODE='PCX04'; END IF;
    IF EXISTS(SELECT 1 FROM pc_private.instructor_time_off t WHERE t.instructor_id=p_instructor AND NOT t.cancelled
      AND starts<CASE WHEN t.end_time IS NULL THEN ((t.end_date+1)::timestamp AT TIME ZONE 'Europe/Rome') ELSE ((t.end_date+t.end_time) AT TIME ZONE 'Europe/Rome') END
      AND ends>((t.start_date+coalesce(t.start_time,time '00:00')) AT TIME ZONE 'Europe/Rome')) THEN RAISE EXCEPTION 'Instructor absent' USING ERRCODE='PCX02'; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM pc_private.manual_appointments a WHERE a.professional_id=uid AND a.id<>p_id AND NOT a.cancelled AND a.start_at<ends AND a.end_at>starts
       AND ((NOT centre AND s.service_type<>'boarding' AND a.service_type<>'boarding') OR a.instructor_id=p_instructor))
     OR EXISTS(SELECT 1 FROM public.bookings b LEFT JOIN pc_private.booking_instructors bi ON bi.booking_id=b.id
       LEFT JOIN public.services bs ON bs.id=b.service_id WHERE b.professional_id=uid AND b.status IN ('accepted','completed') AND b.start_at<ends AND b.end_at>starts
       AND ((NOT centre AND s.service_type<>'boarding' AND bs.service_type IS DISTINCT FROM 'boarding') OR bi.instructor_id=p_instructor)) THEN
    RAISE EXCEPTION 'Conflicting appointment' USING ERRCODE='PCJ01';
  END IF;
  INSERT INTO pc_private.manual_appointments AS a(professional_id,id,service_id,service_name,service_type,duration_minutes,calendar_color,start_at,end_at,dog_label,instructor_id,instructor_name)
  VALUES(uid,p_id,s.id,s.name,s.service_type,s.duration_minutes,coalesce(s.calendar_color,'#57534E'),starts,ends,dog,p_instructor,coach)
  ON CONFLICT(professional_id,id) DO UPDATE SET service_id=excluded.service_id,service_name=excluded.service_name,service_type=excluded.service_type,
     duration_minutes=excluded.duration_minutes,calendar_color=excluded.calendar_color,start_at=excluded.start_at,end_at=excluded.end_at,dog_label=excluded.dog_label,
     instructor_id=excluded.instructor_id,instructor_name=excluded.instructor_name,version=a.version+1 RETURNING version INTO v;
  RETURN v;
END $$;

CREATE FUNCTION pc_private.cancel_my_manual_appointment(p_id uuid,p_version integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); a pc_private.manual_appointments;
BEGIN
  PERFORM 1 FROM public.professionals pro JOIN public.profiles p ON p.id=pro.id WHERE pro.id=uid AND p.role='professional' FOR UPDATE OF pro;
  IF NOT FOUND THEN RAISE insufficient_privilege; END IF;
  SELECT * INTO a FROM pc_private.manual_appointments WHERE professional_id=uid AND id=p_id;
  IF NOT FOUND OR p_version IS NULL THEN RAISE serialization_failure; END IF;
  IF a.cancelled AND a.version-1=p_version THEN RETURN true; END IF;
  IF a.cancelled OR a.version<>p_version THEN RAISE serialization_failure; END IF;
  UPDATE pc_private.manual_appointments SET cancelled=true,version=version+1,dog_label='',instructor_id=NULL,instructor_name=NULL WHERE professional_id=uid AND id=p_id;
  RETURN true;
END $$;

-- Online acceptance and assignment share the professional lock with manual writes.
CREATE FUNCTION pc_private.guard_portal_manual_overlap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE pro uuid; coach uuid; starts timestamptz; ends timestamptz; solo boolean; kind text;
BEGIN
  IF TG_TABLE_NAME='bookings' THEN
    IF NEW.status<>'accepted' THEN RETURN NEW; END IF;
    pro:=NEW.professional_id;starts:=NEW.start_at;ends:=NEW.end_at;
    SELECT i.instructor_id INTO coach FROM pc_private.booking_instructors i WHERE i.booking_id=NEW.id;
    SELECT s.service_type INTO kind FROM public.services s WHERE s.id=NEW.service_id;
  ELSE
    IF NEW.instructor_id IS NULL THEN RETURN NEW; END IF;
    pro:=NEW.centre_id;coach:=NEW.instructor_id;
    SELECT b.start_at,b.end_at INTO starts,ends FROM public.bookings b WHERE b.id=NEW.booking_id AND b.status IN ('accepted','completed');
    IF NOT FOUND THEN RETURN NEW; END IF;
  END IF;
  SELECT listing_type IS DISTINCT FROM 'center' INTO solo FROM public.professionals WHERE id=pro FOR UPDATE;
  IF EXISTS(SELECT 1 FROM pc_private.manual_appointments a WHERE a.professional_id=pro AND NOT a.cancelled AND a.start_at<ends AND a.end_at>starts
        AND ((solo AND kind IS DISTINCT FROM 'boarding' AND a.service_type<>'boarding') OR a.instructor_id=coach)) THEN
    RAISE EXCEPTION 'Conflicting manual appointment' USING ERRCODE='PCJ01';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER manual_agenda_portal_overlap BEFORE INSERT OR UPDATE OF status,start_at,end_at,service_id ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION pc_private.guard_portal_manual_overlap();
CREATE TRIGGER manual_agenda_staff_overlap BEFORE INSERT OR UPDATE OF instructor_id ON pc_private.booking_instructors
  FOR EACH ROW EXECUTE FUNCTION pc_private.guard_portal_manual_overlap();
REVOKE ALL ON FUNCTION pc_private.guard_portal_manual_overlap() FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.list_my_manual_appointments(p_from date,p_to date,p_offset integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.list_my_manual_appointments(p_from,p_to,p_offset) $$;
CREATE FUNCTION public.save_my_manual_appointment(p_id uuid,p_version integer,p_service_id uuid,p_day date,p_time time,p_dog text,p_instructor uuid)
RETURNS integer LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.save_my_manual_appointment(p_id,p_version,p_service_id,p_day,p_time,p_dog,p_instructor) $$;
CREATE FUNCTION public.cancel_my_manual_appointment(p_id uuid,p_version integer)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.cancel_my_manual_appointment(p_id,p_version) $$;
DO $grants$
DECLARE namespace text; sig text;
BEGIN
  FOREACH namespace IN ARRAY ARRAY['pc_private','public'] LOOP
    FOREACH sig IN ARRAY ARRAY['list_my_manual_appointments(date,date,integer)','save_my_manual_appointment(uuid,integer,uuid,date,time,text,uuid)','cancel_my_manual_appointment(uuid,integer)'] LOOP
      EXECUTE format('REVOKE ALL ON FUNCTION %I.%s FROM PUBLIC,anon,authenticated,service_role',namespace,sig);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%s TO authenticated',namespace,sig);
    END LOOP;
  END LOOP;
END $grants$;
