-- Calendar, service colours and voluntary professional unavailability.
-- Existing accepted bookings are preserved; pending overlaps cannot be accepted.
BEGIN;

ALTER TABLE public.services ADD COLUMN calendar_color text NOT NULL DEFAULT '#047857'
  CHECK (calendar_color ~ '^#[0-9A-Fa-f]{6}$');
UPDATE public.services SET calendar_color = CASE
  WHEN service_type IN ('boarding','pensione') THEN '#7C3AED'
  WHEN service_type IN ('trainer','training','addestramento') THEN '#2563EB'
  WHEN service_type = 'enci_course' THEN '#B45309'
  WHEN service_type IN ('sitter','sitting') THEN '#BE185D'
  WHEN service_type = 'groomer' THEN '#0E7490'
  ELSE '#047857' END;

CREATE TABLE public.professional_schedule_settings (
  professional_id uuid PRIMARY KEY REFERENCES public.professionals(id) ON DELETE CASCADE,
  paused boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.professional_time_off (
  id uuid PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  private_note text NOT NULL DEFAULT '' CHECK (char_length(private_note) <= 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (isfinite(start_date) AND isfinite(end_date) AND end_date >= start_date AND end_date - start_date <= 365),
  CHECK (ends_at > starts_at),
  CHECK (starts_at = (start_date::timestamp AT TIME ZONE 'Europe/Rome')),
  CHECK (ends_at = ((end_date + 1)::timestamp AT TIME ZONE 'Europe/Rome'))
);
CREATE INDEX professional_time_off_range_idx ON public.professional_time_off(professional_id, starts_at, ends_at);
CREATE INDEX bookings_calendar_range_idx ON public.bookings(professional_id, start_at, end_at);
ALTER TABLE public.professional_schedule_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_time_off ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.professional_schedule_settings, public.professional_time_off FROM PUBLIC, anon, authenticated;

CREATE FUNCTION public.set_my_booking_pause(p_paused boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_paused IS NULL THEN RAISE EXCEPTION 'Invalid request' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  INSERT INTO public.professional_schedule_settings(professional_id,paused) VALUES(v_uid,p_paused)
    ON CONFLICT(professional_id) DO UPDATE SET paused=excluded.paused,updated_at=clock_timestamp();
  RETURN p_paused;
END $$;

CREATE FUNCTION public.add_my_time_off(p_request_id uuid,p_start_date date,p_end_date date,p_private_note text DEFAULT '')
RETURNS TABLE(period_id uuid,accepted_bookings integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_start timestamptz; v_end timestamptz; v_old public.professional_time_off%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  IF p_request_id IS NULL OR p_start_date IS NULL OR p_end_date IS NULL OR NOT isfinite(p_start_date)
    OR NOT isfinite(p_end_date) OR p_end_date < p_start_date OR p_end_date - p_start_date > 365
    OR p_private_note IS NULL OR char_length(p_private_note)>500 THEN
    RAISE EXCEPTION 'Invalid period' USING ERRCODE='22023';
  END IF;
  PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  v_start := p_start_date::timestamp AT TIME ZONE 'Europe/Rome';
  v_end := (p_end_date+1)::timestamp AT TIME ZONE 'Europe/Rome';
  SELECT * INTO v_old FROM public.professional_time_off WHERE id=p_request_id;
  IF FOUND THEN
    IF v_old.professional_id<>v_uid OR v_old.start_date<>p_start_date OR v_old.end_date<>p_end_date
       OR v_old.private_note<>btrim(p_private_note) THEN RAISE EXCEPTION 'Request already used' USING ERRCODE='22023'; END IF;
  ELSE
    IF v_end<=clock_timestamp() THEN RAISE EXCEPTION 'Period already ended' USING ERRCODE='22023'; END IF;
    INSERT INTO public.professional_time_off(id,professional_id,start_date,end_date,starts_at,ends_at,private_note)
      VALUES(p_request_id,v_uid,p_start_date,p_end_date,v_start,v_end,btrim(p_private_note));
  END IF;
  RETURN QUERY SELECT p_request_id, count(*)::integer FROM public.bookings b
    WHERE b.professional_id=v_uid AND b.status='accepted' AND b.start_at<v_end AND greatest(b.end_at,b.start_at+interval '1 microsecond')>v_start;
END $$;

CREATE FUNCTION public.remove_my_time_off(p_period_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.professionals WHERE id=v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  DELETE FROM public.professional_time_off WHERE id=p_period_id AND professional_id=v_uid;
  RETURN FOUND;
END $$;

CREATE FUNCTION public.get_my_schedule(p_from date,p_to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_periods jsonb;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=v_uid) THEN
    RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to) OR p_to<=p_from OR p_to-p_from>62 THEN
    RAISE EXCEPTION 'Invalid calendar range' USING ERRCODE='22023'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id',t.id,'start_date',t.start_date,'end_date',t.end_date,
    'private_note',t.private_note,'accepted_bookings',(SELECT count(*) FROM public.bookings b WHERE b.professional_id=v_uid
      AND b.status='accepted' AND b.start_at<t.ends_at AND greatest(b.end_at,b.start_at+interval '1 microsecond')>t.starts_at)) ORDER BY t.start_date,t.id),'[]'::jsonb)
    INTO v_periods FROM public.professional_time_off t WHERE t.professional_id=v_uid AND t.start_date<p_to AND t.end_date>=p_from;
  RETURN jsonb_build_object('paused',coalesce((SELECT paused FROM public.professional_schedule_settings WHERE professional_id=v_uid),false),'periods',v_periods);
END $$;

CREATE FUNCTION public.get_public_booking_availability(p_professional_id uuid,p_from date,p_to date)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_periods jsonb;
BEGIN
  IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to) OR p_to<=p_from OR p_to-p_from>400 THEN
    RAISE EXCEPTION 'Invalid date range' USING ERRCODE='22023'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=p_professional_id AND approved IS TRUE AND approval_status='approved') THEN
    RETURN NULL;
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('start_date',t.start_date,'end_date',t.end_date) ORDER BY t.start_date,t.end_date),'[]'::jsonb)
    INTO v_periods FROM public.professional_time_off t WHERE t.professional_id=p_professional_id AND t.start_date<p_to AND t.end_date>=p_from;
  RETURN jsonb_build_object('paused',coalesce((SELECT paused FROM public.professional_schedule_settings WHERE professional_id=p_professional_id),false),'periods',v_periods);
END $$;

CREATE FUNCTION public.get_my_booking_calendar(p_from date,p_to date,p_limit integer DEFAULT 200,p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,start_at timestamptz,end_at timestamptz,status text,price numeric,notes text,client_name text,
  service_id uuid,service_name text,service_type text,calendar_color text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
  IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE public.professionals.id=v_uid) THEN
    RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  IF p_from IS NULL OR p_to IS NULL OR NOT isfinite(p_from) OR NOT isfinite(p_to) OR p_to<=p_from OR p_to-p_from>62
    OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 200 OR p_offset IS NULL OR p_offset<0 THEN
    RAISE EXCEPTION 'Invalid calendar range' USING ERRCODE='22023'; END IF;
  RETURN QUERY SELECT b.id,b.start_at,b.end_at,b.status::text,b.price,b.notes::text,
    coalesce(nullif(btrim(p.full_name),''),'Nome non indicato'),b.service_id,
    coalesce(nullif(btrim(s.name),''),'Servizio non disponibile'),coalesce(s.service_type,'other'),coalesce(s.calendar_color,'#57534E')
    FROM public.bookings b LEFT JOIN public.services s ON s.id=b.service_id AND s.professional_id=v_uid
    LEFT JOIN public.profiles p ON p.id=b.owner_id
    WHERE b.professional_id=v_uid AND b.start_at<(p_to::timestamp AT TIME ZONE 'Europe/Rome')
      AND greatest(b.end_at,b.start_at+interval '1 microsecond')>(p_from::timestamp AT TIME ZONE 'Europe/Rome')
    ORDER BY b.start_at,b.id LIMIT p_limit OFFSET p_offset;
END $$;

CREATE FUNCTION public.save_my_calendar_service(p_service_id uuid,p_name text,p_service_type text,p_price numeric,
  p_duration_minutes integer,p_duration_kind text,p_calendar_color text,p_active boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_service uuid;
BEGIN
  IF v_uid IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=v_uid) THEN
    RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  IF p_service_id IS NULL OR p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 120
    OR p_service_type IS NULL OR char_length(btrim(p_service_type)) NOT BETWEEN 1 AND 60
    OR p_price IS NULL OR p_price<0 OR p_price>100000 OR p_price::text IN ('NaN','Infinity','-Infinity')
    OR p_duration_minutes IS NULL OR p_duration_minutes NOT BETWEEN 1 AND 525600
    OR p_duration_kind IS NULL OR p_duration_kind NOT IN ('hourly','daily','variable')
    OR p_calendar_color IS NULL OR p_calendar_color !~ '^#[0-9A-Fa-f]{6}$' OR p_active IS NULL THEN
    RAISE EXCEPTION 'Invalid service' USING ERRCODE='22023'; END IF;
  INSERT INTO public.services AS target(id,professional_id,name,service_type,price,duration_minutes,duration_kind,calendar_color,active)
    VALUES(p_service_id,v_uid,btrim(p_name),btrim(p_service_type),round(p_price,2),p_duration_minutes,p_duration_kind,upper(p_calendar_color),p_active)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name,service_type=excluded.service_type,price=excluded.price,
      duration_minutes=excluded.duration_minutes,duration_kind=excluded.duration_kind,calendar_color=excluded.calendar_color,active=excluded.active
    WHERE target.professional_id=v_uid RETURNING id INTO v_service;
  IF v_service IS NULL THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  RETURN v_service;
END $$;

CREATE OR REPLACE FUNCTION public.create_booking_with_dog(p_service_id uuid,p_dog_id uuid,p_start_at timestamptz,p_notes text DEFAULT '')
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_pro uuid; v_service public.services%ROWTYPE; v_booking public.bookings%ROWTYPE; v_end timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=v_uid AND email_verified=true) THEN RAISE EXCEPTION 'Email verification required'; END IF;
  IF p_start_at IS NULL OR NOT isfinite(p_start_at) OR p_start_at<=now() THEN RAISE EXCEPTION 'Booking must be in the future' USING ERRCODE='22023'; END IF;
  SELECT professional_id INTO v_pro FROM public.services WHERE id=p_service_id;
  PERFORM 1 FROM public.professionals WHERE id=v_pro AND approved=true AND approval_status='approved' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable'; END IF;
  SELECT * INTO v_service FROM public.services WHERE id=p_service_id AND professional_id=v_pro AND active=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable'; END IF;
  PERFORM 1 FROM public.dogs WHERE id=p_dog_id AND owner_id=v_uid FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid dog' USING ERRCODE='42501'; END IF;
  IF coalesce(v_service.duration_minutes,0)<=0 THEN RAISE EXCEPTION 'Invalid service duration'; END IF;
  v_end:=p_start_at+make_interval(mins=>v_service.duration_minutes);
  IF EXISTS(SELECT 1 FROM public.professional_schedule_settings WHERE professional_id=v_pro AND paused) THEN
    RAISE EXCEPTION 'Professional has paused new requests' USING ERRCODE='PCA01'; END IF;
  IF EXISTS(SELECT 1 FROM public.professional_time_off WHERE professional_id=v_pro AND starts_at<v_end AND ends_at>p_start_at) THEN
    RAISE EXCEPTION 'Professional unavailable during requested period' USING ERRCODE='PCA02'; END IF;
  IF p_start_at<=clock_timestamp() THEN RAISE EXCEPTION 'Booking must be in the future' USING ERRCODE='22023'; END IF;
  INSERT INTO public.bookings(owner_id,professional_id,service_id,start_at,end_at,status,price,notes)
    VALUES(v_uid,v_pro,v_service.id,p_start_at,v_end,'pending',v_service.price,coalesce(p_notes,'')) RETURNING * INTO v_booking;
  INSERT INTO public.booking_dogs(booking_id,dog_id) VALUES(v_booking.id,p_dog_id);
  RETURN v_booking;
END $$;

CREATE OR REPLACE FUNCTION public.change_booking_status(p_booking_id uuid,p_new_status text)
RETURNS public.bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_uid uuid:=auth.uid(); v_booking public.bookings%ROWTYPE; v_pro uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
  SELECT professional_id INTO v_pro FROM public.bookings WHERE id=p_booking_id AND (owner_id=v_uid OR professional_id=v_uid);
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not available' USING ERRCODE='42501'; END IF;
  -- Same professional -> dog/relationship (where used) -> booking lock order as continuity RPCs.
  PERFORM 1 FROM public.professionals WHERE id=v_pro FOR UPDATE;
  SELECT * INTO v_booking FROM public.bookings WHERE id=p_booking_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not available' USING ERRCODE='42501'; END IF;
  IF v_booking.owner_id=v_uid THEN
    IF v_booking.status<>'pending' OR p_new_status IS DISTINCT FROM 'cancelled' THEN RAISE EXCEPTION 'Invalid owner booking transition'; END IF;
  ELSIF v_booking.professional_id=v_uid THEN
    IF p_new_status IS NULL OR NOT ((v_booking.status='pending' AND p_new_status IN ('accepted','declined'))
      OR (v_booking.status='accepted' AND p_new_status='completed')) THEN RAISE EXCEPTION 'Invalid professional booking transition'; END IF;
    IF p_new_status='accepted' AND EXISTS(SELECT 1 FROM public.professional_time_off
      WHERE professional_id=v_pro AND starts_at<greatest(v_booking.end_at,v_booking.start_at+interval '1 microsecond') AND ends_at>v_booking.start_at) THEN
      RAISE EXCEPTION 'Professional unavailable during requested period' USING ERRCODE='PCA02'; END IF;
  ELSE RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  UPDATE public.bookings SET status=p_new_status WHERE id=p_booking_id RETURNING * INTO v_booking;
  RETURN v_booking;
END $$;

REVOKE ALL ON FUNCTION public.set_my_booking_pause(boolean), public.add_my_time_off(uuid,date,date,text),
  public.remove_my_time_off(uuid), public.get_my_schedule(date,date), public.get_my_booking_calendar(date,date,integer,integer),
  public.save_my_calendar_service(uuid,text,text,numeric,integer,text,text,boolean),
  public.create_booking_with_dog(uuid,uuid,timestamptz,text), public.change_booking_status(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_my_booking_pause(boolean), public.add_my_time_off(uuid,date,date,text),
  public.remove_my_time_off(uuid), public.get_my_schedule(date,date), public.get_my_booking_calendar(date,date,integer,integer),
  public.save_my_calendar_service(uuid,text,text,numeric,integer,text,text,boolean),
  public.create_booking_with_dog(uuid,uuid,timestamptz,text), public.change_booking_status(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_public_booking_availability(uuid,date,date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_booking_availability(uuid,date,date) TO anon,authenticated;
COMMIT;
