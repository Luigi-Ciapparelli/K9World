-- Restore lesson packs through authorized RPCs. Existing beta rows are retained.
BEGIN;
SET LOCAL lock_timeout='5s';

ALTER TABLE public.passes
  ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT,
  ADD COLUMN active boolean NOT NULL DEFAULT true,
  ADD COLUMN version integer NOT NULL DEFAULT 1,
  ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.client_passes
  ADD COLUMN name_snapshot text,
  ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT,
  ADD COLUMN service_name_snapshot text,
  ADD COLUMN total_uses_snapshot integer,
  ADD COLUMN price_snapshot numeric,
  ADD COLUMN lifecycle text NOT NULL DEFAULT 'legacy' CHECK(lifecycle IN ('active','cancelled','legacy')),
  ADD COLUMN cancellation_reason text,
  ADD COLUMN version integer NOT NULL DEFAULT 1;
UPDATE public.client_passes cp SET name_snapshot=p.name FROM public.passes p WHERE p.id=cp.pass_id;
-- Legacy assignments have no trustworthy issue-time terms. They remain visible
-- as "Da verificare" and cannot acquire new credits or be consumed automatically.

CREATE TABLE public.pass_usage_events (
  id uuid PRIMARY KEY,
  client_pass_id uuid NOT NULL REFERENCES public.client_passes(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('use','reversal')),
  delta integer NOT NULL CHECK(delta IN (-1,1)),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL,
  description text NOT NULL,
  reversal_of uuid UNIQUE REFERENCES public.pass_usage_events(id) ON DELETE RESTRICT,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK((kind='use' AND delta=-1 AND reversal_of IS NULL)
     OR (kind='reversal' AND delta=1 AND reversal_of IS NOT NULL AND booking_id IS NULL))
);
ALTER TABLE public.pass_usage_events ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX pass_one_live_use_per_booking ON public.pass_usage_events(booking_id)
  WHERE kind='use' AND reversed_at IS NULL AND booking_id IS NOT NULL;
CREATE INDEX pass_events_assignment ON public.pass_usage_events(client_pass_id,created_at,id);
CREATE INDEX passes_professional ON public.passes(professional_id,created_at,id);
CREATE INDEX passes_service ON public.passes(service_id);
CREATE INDEX client_passes_professional ON public.client_passes(professional_id,purchased_at,id);
CREATE INDEX client_passes_client ON public.client_passes(client_id,purchased_at,id);
CREATE INDEX client_passes_template ON public.client_passes(pass_id);
CREATE INDEX client_passes_service ON public.client_passes(service_id);
REVOKE ALL ON public.passes,public.client_passes,public.pass_usage_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.pass_usage_events TO service_role;

CREATE FUNCTION public.pass_professional_actor() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
  IF actor IS NULL OR NOT EXISTS(SELECT 1 FROM public.professionals p
    JOIN public.profiles u ON u.id=p.id WHERE p.id=actor AND u.role IN ('professional','admin')) THEN
    RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
  RETURN actor;
END $$;
REVOKE ALL ON FUNCTION public.pass_professional_actor() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION public.list_own_pass_templates()
RETURNS TABLE(id uuid,name text,description text,total_uses integer,price numeric,valid_days integer,
  service_id uuid,service_name text,service_active boolean,active boolean,version integer,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor();
BEGIN
 RETURN QUERY SELECT p.id,p.name,p.description,p.total_uses,p.price,p.valid_days,p.service_id,
   s.name,coalesce(s.active,false),p.active,p.version,p.created_at
 FROM public.passes p LEFT JOIN public.services s ON s.id=p.service_id
 WHERE p.professional_id=actor ORDER BY p.created_at DESC,p.id;
END $$;

CREATE FUNCTION public.save_own_pass_template(p_id uuid,p_version integer,p_service_id uuid,
 p_name text,p_description text,p_total_uses integer,p_price numeric,p_valid_days integer)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.passes;
BEGIN
 IF p_id IS NULL OR p_version IS NULL OR p_version<0 OR p_name IS NULL
  OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100 OR char_length(coalesce(p_description,''))>2000
  OR p_total_uses IS NULL OR p_total_uses NOT BETWEEN 1 AND 200
  OR p_price IS NULL OR p_price<0 OR p_price>100000 OR p_price::text IN ('NaN','Infinity','-Infinity')
  OR p_valid_days IS NULL OR p_valid_days NOT BETWEEN 1 AND 1095 THEN
  RAISE EXCEPTION 'Invalid pack' USING ERRCODE='22023'; END IF;
 -- Lock the actor to serialize create retries, including a caller-chosen UUID.
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.services WHERE id=p_service_id AND professional_id=actor AND active) THEN
  RAISE EXCEPTION 'Select an active service belonging to this professional' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM public.passes WHERE id=p_id FOR UPDATE;
 IF FOUND THEN
  IF old.professional_id<>actor THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  IF p_version=0 AND old.name=btrim(p_name) AND old.description=coalesce(btrim(p_description),'')
   AND old.total_uses=p_total_uses AND old.price=round(p_price,2) AND old.valid_days=p_valid_days
   AND old.service_id=p_service_id THEN RETURN old.id; END IF;
  IF old.version<>p_version THEN RAISE EXCEPTION 'Changed version' USING ERRCODE='40001'; END IF;
  UPDATE public.passes SET name=btrim(p_name),description=coalesce(btrim(p_description),''),
   total_uses=p_total_uses,price=round(p_price,2),valid_days=p_valid_days,service_id=p_service_id,
   version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
 ELSE
  IF p_version<>0 THEN RAISE EXCEPTION 'Template no longer available' USING ERRCODE='40001'; END IF;
  INSERT INTO public.passes(id,professional_id,name,description,total_uses,price,valid_days,service_id)
   VALUES(p_id,actor,btrim(p_name),coalesce(btrim(p_description),''),p_total_uses,round(p_price,2),p_valid_days,p_service_id);
 END IF;
 RETURN p_id;
END $$;

CREATE FUNCTION public.set_own_pass_template_active(p_id uuid,p_version integer,p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.passes;
BEGIN
 SELECT * INTO old FROM public.passes WHERE id=p_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_active IS NULL OR p_version IS NULL THEN RAISE EXCEPTION 'Invalid state' USING ERRCODE='22023'; END IF;
 IF old.active=p_active THEN RETURN; END IF;
 IF old.version<>p_version THEN RAISE EXCEPTION 'Changed version' USING ERRCODE='40001'; END IF;
 UPDATE public.passes SET active=p_active,version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
END $$;

CREATE FUNCTION public.issue_client_pass(p_id uuid,p_template_id uuid,p_client_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); model public.passes; old public.client_passes;
 service_label text; issued timestamptz:=clock_timestamp();
BEGIN
 IF p_id IS NULL OR p_client_id IS NULL OR p_template_id IS NULL THEN
  RAISE EXCEPTION 'Missing assignment data' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 SELECT * INTO old FROM public.client_passes WHERE id=p_id;
 IF FOUND THEN
  IF old.professional_id=actor AND old.pass_id=p_template_id AND old.client_id=p_client_id THEN RETURN p_id; END IF;
  RAISE EXCEPTION 'Conflicting assignment' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=actor AND approved AND approval_status='approved') THEN
  RAISE EXCEPTION 'Approved professional required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_client_id AND p.role='owner') OR NOT EXISTS(
  SELECT 1 FROM public.bookings b WHERE b.professional_id=actor AND b.owner_id=p_client_id AND b.status IN ('accepted','completed')) THEN
  RAISE EXCEPTION 'Existing client relationship required' USING ERRCODE='42501'; END IF;
 SELECT * INTO model FROM public.passes WHERE id=p_template_id AND professional_id=actor FOR SHARE;
 IF NOT FOUND OR NOT model.active OR model.service_id IS NULL OR model.total_uses NOT BETWEEN 1 AND 200
  OR model.total_uses IS NULL OR model.valid_days IS NULL OR model.valid_days NOT BETWEEN 1 AND 1095
  OR model.price IS NULL OR model.price<0 OR model.price>100000 OR model.price::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Template unavailable' USING ERRCODE='PAP05'; END IF;
 SELECT name INTO service_label FROM public.services WHERE id=model.service_id AND professional_id=actor AND active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='PAP05'; END IF;
 INSERT INTO public.client_passes(id,pass_id,client_id,professional_id,remaining_uses,purchased_at,expires_at,
  name_snapshot,service_id,service_name_snapshot,total_uses_snapshot,price_snapshot,lifecycle)
 VALUES(p_id,model.id,p_client_id,actor,model.total_uses,issued,issued+make_interval(days=>model.valid_days),
  model.name,model.service_id,service_label,model.total_uses,model.price,'active');
 RETURN p_id;
END $$;

CREATE FUNCTION public.list_my_client_passes(p_professional boolean DEFAULT false)
RETURNS TABLE(id uuid,pass_id uuid,client_name text,professional_name text,name text,service_name text,
 total_uses integer,remaining_uses integer,price numeric,purchased_at timestamptz,expires_at timestamptz,
 state text,cancellation_reason text,version integer)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid();
BEGIN
 IF actor IS NULL OR p_professional IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_professional THEN PERFORM public.pass_professional_actor(); END IF;
 RETURN QUERY SELECT cp.id,cp.pass_id,coalesce(nullif(btrim(c.full_name),''),'Cliente'),
  coalesce(nullif(btrim(p.full_name),''),'Professionista'),coalesce(nullif(cp.name_snapshot,''),'Pacchetto precedente'),
  coalesce(cp.service_name_snapshot,'Servizio da verificare'),cp.total_uses_snapshot,cp.remaining_uses,cp.price_snapshot,
  cp.purchased_at,cp.expires_at,CASE WHEN cp.lifecycle<>'active' THEN cp.lifecycle
    WHEN cp.expires_at<=now() THEN 'expired' WHEN cp.remaining_uses<=0 THEN 'exhausted' ELSE 'active' END,
  cp.cancellation_reason,cp.version
 FROM public.client_passes cp JOIN public.profiles c ON c.id=cp.client_id JOIN public.profiles p ON p.id=cp.professional_id
 WHERE (p_professional AND cp.professional_id=actor) OR (NOT p_professional AND cp.client_id=actor)
 ORDER BY cp.purchased_at DESC,cp.id;
END $$;

CREATE FUNCTION public.get_client_pass_events(p_id uuid)
RETURNS TABLE(id uuid,kind text,delta integer,occurred_at timestamptz,description text,
 reversal_of uuid,reversed_at timestamptz,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.client_passes cp WHERE cp.id=p_id
  AND auth.uid() IN (cp.client_id,cp.professional_id)) THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT e.id,e.kind,e.delta,e.occurred_at,e.description,e.reversal_of,e.reversed_at,e.created_at
 FROM public.pass_usage_events e WHERE e.client_pass_id=p_id ORDER BY e.created_at DESC,e.id;
END $$;

CREATE FUNCTION public.list_pass_eligible_bookings(p_id uuid)
RETURNS TABLE(id uuid,start_at timestamptz,service_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); cp public.client_passes;
BEGIN
 SELECT * INTO cp FROM public.client_passes WHERE public.client_passes.id=p_id AND professional_id=actor;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT b.id,b.start_at,cp.service_name_snapshot FROM public.bookings b
 WHERE cp.lifecycle='active' AND b.professional_id=actor AND b.owner_id=cp.client_id AND b.service_id=cp.service_id
  AND b.status='completed' AND b.start_at>=cp.purchased_at AND b.start_at<cp.expires_at AND b.end_at<=now()
  AND NOT EXISTS(SELECT 1 FROM public.pass_usage_events e WHERE e.booking_id=b.id AND e.kind='use' AND e.reversed_at IS NULL)
 ORDER BY b.start_at DESC,b.id LIMIT 100;
END $$;

CREATE FUNCTION public.record_pass_use(p_id uuid,p_client_pass_id uuid,p_booking_id uuid DEFAULT NULL,
 p_occurred_at timestamptz DEFAULT NULL,p_description text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); cp public.client_passes;
 b public.bookings; old public.pass_usage_events; happened timestamptz; label text;
BEGIN
 IF p_id IS NULL THEN RAISE EXCEPTION 'Missing operation ID' USING ERRCODE='22023'; END IF;
 SELECT * INTO cp FROM public.client_passes WHERE id=p_client_pass_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM public.pass_usage_events WHERE id=p_id;
 IF FOUND THEN
  IF old.client_pass_id=cp.id AND old.kind='use' AND old.booking_id IS NOT DISTINCT FROM p_booking_id
   AND (p_booking_id IS NOT NULL OR (old.occurred_at=p_occurred_at AND old.description=btrim(p_description))) THEN RETURN old.id; END IF;
  RAISE EXCEPTION 'Conflicting operation' USING ERRCODE='22023'; END IF;
 IF cp.lifecycle<>'active' OR cp.remaining_uses<=0 OR cp.remaining_uses IS NULL THEN
  RAISE EXCEPTION 'No available credits' USING ERRCODE='PAP01'; END IF;
 IF p_booking_id IS NOT NULL THEN
  SELECT * INTO b FROM public.bookings WHERE id=p_booking_id FOR SHARE;
  IF NOT FOUND OR b.professional_id<>actor OR b.owner_id<>cp.client_id OR b.service_id IS DISTINCT FROM cp.service_id
    OR b.status<>'completed' OR b.end_at>clock_timestamp() THEN
    RAISE EXCEPTION 'Booking incompatible with this pack' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.pass_usage_events WHERE booking_id=b.id AND kind='use' AND reversed_at IS NULL) THEN
    RAISE EXCEPTION 'Booking already debited' USING ERRCODE='PAP03'; END IF;
  happened:=b.start_at; label:=cp.service_name_snapshot;
 ELSE
  IF p_description IS NULL OR char_length(btrim(p_description)) NOT BETWEEN 3 AND 300 THEN
   RAISE EXCEPTION 'Describe the lesson' USING ERRCODE='22023'; END IF;
  happened:=p_occurred_at; label:=btrim(p_description);
 END IF;
 IF happened IS NULL OR NOT isfinite(happened) OR happened>clock_timestamp()
   OR happened<cp.purchased_at OR happened>=cp.expires_at THEN
  RAISE EXCEPTION 'Lesson outside validity period' USING ERRCODE='PAP02'; END IF;
 INSERT INTO public.pass_usage_events(id,client_pass_id,kind,delta,booking_id,occurred_at,description)
  VALUES(p_id,cp.id,'use',-1,p_booking_id,happened,label);
 UPDATE public.client_passes SET remaining_uses=remaining_uses-1,version=version+1 WHERE id=cp.id;
 RETURN p_id;
END $$;

CREATE FUNCTION public.reverse_pass_use(p_id uuid,p_use_id uuid,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); cp public.client_passes; original public.pass_usage_events;
 old public.pass_usage_events; target uuid;
BEGIN
 IF p_id IS NULL OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 300 THEN
  RAISE EXCEPTION 'A correction reason is required' USING ERRCODE='22023'; END IF;
 SELECT client_pass_id INTO target FROM public.pass_usage_events WHERE id=p_use_id;
 SELECT * INTO cp FROM public.client_passes WHERE id=target AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM public.pass_usage_events WHERE id=p_id;
 IF FOUND THEN
  IF old.client_pass_id=cp.id AND old.kind='reversal' AND old.reversal_of=p_use_id AND old.description=btrim(p_reason) THEN RETURN p_id; END IF;
  RAISE EXCEPTION 'Conflicting correction' USING ERRCODE='22023'; END IF;
 SELECT * INTO original FROM public.pass_usage_events WHERE id=p_use_id FOR UPDATE;
 IF original.kind<>'use' OR original.reversed_at IS NOT NULL THEN
  RAISE EXCEPTION 'Already corrected' USING ERRCODE='PAP04'; END IF;
 IF cp.total_uses_snapshot IS NULL OR cp.remaining_uses>=cp.total_uses_snapshot THEN
  RAISE EXCEPTION 'Invalid balance' USING ERRCODE='22023'; END IF;
 INSERT INTO public.pass_usage_events(id,client_pass_id,kind,delta,occurred_at,description,reversal_of)
  VALUES(p_id,cp.id,'reversal',1,clock_timestamp(),btrim(p_reason),original.id);
 UPDATE public.pass_usage_events SET reversed_at=clock_timestamp() WHERE id=original.id;
 UPDATE public.client_passes SET remaining_uses=remaining_uses+1,version=version+1 WHERE id=cp.id;
 RETURN p_id;
END $$;

CREATE FUNCTION public.cancel_own_client_pass(p_id uuid,p_version integer,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); cp public.client_passes;
BEGIN
 IF p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 300 OR p_version IS NULL THEN
  RAISE EXCEPTION 'A cancellation reason is required' USING ERRCODE='22023'; END IF;
 SELECT * INTO cp FROM public.client_passes WHERE id=p_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF cp.lifecycle='cancelled' AND cp.cancellation_reason=btrim(p_reason) THEN RETURN; END IF;
 IF cp.version<>p_version THEN RAISE EXCEPTION 'Changed version' USING ERRCODE='40001'; END IF;
 UPDATE public.client_passes SET lifecycle='cancelled',cancellation_reason=btrim(p_reason),version=version+1 WHERE id=p_id;
END $$;

REVOKE ALL ON FUNCTION public.list_own_pass_templates(),
 public.save_own_pass_template(uuid,integer,uuid,text,text,integer,numeric,integer),
 public.set_own_pass_template_active(uuid,integer,boolean), public.issue_client_pass(uuid,uuid,uuid),
 public.list_my_client_passes(boolean),public.get_client_pass_events(uuid),public.list_pass_eligible_bookings(uuid),
 public.record_pass_use(uuid,uuid,uuid,timestamptz,text),public.reverse_pass_use(uuid,uuid,text),
 public.cancel_own_client_pass(uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_own_pass_templates(),
 public.save_own_pass_template(uuid,integer,uuid,text,text,integer,numeric,integer),
 public.set_own_pass_template_active(uuid,integer,boolean),public.issue_client_pass(uuid,uuid,uuid),
 public.list_my_client_passes(boolean),public.get_client_pass_events(uuid),public.list_pass_eligible_bookings(uuid),
 public.record_pass_use(uuid,uuid,uuid,timestamptz,text),public.reverse_pass_use(uuid,uuid,text),
 public.cancel_own_client_pass(uuid,integer,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
