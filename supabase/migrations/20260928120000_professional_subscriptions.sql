-- Subscription agreements with explicitly confirmed periods; no payment automation.
BEGIN;
SET LOCAL lock_timeout='5s';

ALTER TABLE public.subscription_plans
 ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT,
 ADD COLUMN period_unit text CHECK(period_unit IN ('week','fortnight','month')),
 ADD COLUMN period_uses integer CHECK(period_uses BETWEEN 1 AND 200),
 ADD COLUMN period_price numeric CHECK(period_price>=0 AND period_price<=100000),
 ADD COLUMN active boolean NOT NULL DEFAULT false,
 ADD COLUMN version integer NOT NULL DEFAULT 1,
 ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.client_subscriptions
 ADD COLUMN name_snapshot text,
 ADD COLUMN description_snapshot text,
 ADD COLUMN service_id uuid REFERENCES public.services(id) ON DELETE RESTRICT,
 ADD COLUMN service_name_snapshot text,
 ADD COLUMN period_unit text CHECK(period_unit IN ('week','fortnight','month')),
 ADD COLUMN period_uses integer CHECK(period_uses BETWEEN 1 AND 200),
 ADD COLUMN period_price numeric CHECK(period_price>=0 AND period_price<=100000),
 ADD COLUMN starts_on date,
 ADD COLUMN lifecycle text NOT NULL DEFAULT 'legacy' CHECK(lifecycle IN ('legacy','open','closed')),
 ADD COLUMN version integer NOT NULL DEFAULT 1,
 ADD COLUMN closed_at timestamptz,
 ADD COLUMN closure_reason text;
UPDATE public.client_subscriptions c SET name_snapshot=p.name FROM public.subscription_plans p WHERE p.id=c.plan_id;
-- Old beta agreements remain read-only: no inferred periods, balances or payments.
ALTER TABLE public.passes ADD COLUMN origin text NOT NULL DEFAULT 'pack' CHECK(origin IN ('pack','subscription'));
CREATE TABLE public.subscription_periods (
 id uuid PRIMARY KEY,
 subscription_id uuid NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
 ordinal integer NOT NULL CHECK(ordinal BETWEEN 0 AND 1200),
 starts_on date NOT NULL,
 ends_on date NOT NULL CHECK(ends_on>starts_on),
 client_pass_id uuid NOT NULL UNIQUE REFERENCES public.client_passes(id) ON DELETE CASCADE,
 previous_period_id uuid,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(subscription_id,ordinal)
);
ALTER TABLE public.subscription_periods ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_plans,public.client_subscriptions,public.subscription_periods FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.subscription_periods TO service_role;
CREATE INDEX subscription_plans_service ON public.subscription_plans(service_id);
CREATE INDEX subscription_plans_professional ON public.subscription_plans(professional_id,created_at,id);
CREATE INDEX client_subscriptions_plan ON public.client_subscriptions(plan_id);
CREATE INDEX client_subscriptions_professional ON public.client_subscriptions(professional_id,started_at,id);
CREATE INDEX client_subscriptions_client ON public.client_subscriptions(client_id,started_at,id);
CREATE INDEX client_subscriptions_service ON public.client_subscriptions(service_id);

CREATE FUNCTION pc_private.subscription_boundary(anchor date,unit text,n integer) RETURNS date
LANGUAGE sql IMMUTABLE STRICT SET search_path='' AS $$
 SELECT CASE unit WHEN 'month' THEN (anchor+make_interval(months=>n))::date
 WHEN 'week' THEN anchor+n*7 WHEN 'fortnight' THEN anchor+n*14 END
$$;
REVOKE ALL ON FUNCTION pc_private.subscription_boundary(date,text,integer) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION pc_private.list_own_subscription_plans()
RETURNS TABLE(id uuid,name text,description text,service_id uuid,service_name text,service_active boolean,
 period_unit text,period_uses integer,period_price numeric,active boolean,version integer,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor();
BEGIN
 RETURN QUERY SELECT p.id,p.name,p.description,p.service_id,s.name,coalesce(s.active,false),
 p.period_unit,p.period_uses,p.period_price,p.active,p.version,p.created_at
 FROM public.subscription_plans p LEFT JOIN public.services s ON s.id=p.service_id
 WHERE p.professional_id=actor ORDER BY p.created_at DESC,p.id;
END $$;

CREATE FUNCTION pc_private.save_own_subscription_plan(p_id uuid,p_version integer,p_service_id uuid,
 p_name text,p_description text,p_period_unit text,p_period_uses integer,p_period_price numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.subscription_plans;
BEGIN
 IF p_id IS NULL OR p_version IS NULL OR p_version<0 OR p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 1 AND 100
 OR char_length(coalesce(p_description,''))>2000 OR p_period_unit IS NULL OR p_period_unit NOT IN ('week','fortnight','month')
 OR p_period_uses IS NULL OR p_period_uses NOT BETWEEN 1 AND 200 OR p_period_price IS NULL
 OR p_period_price<0 OR p_period_price>100000 OR p_period_price::text IN ('NaN','Infinity','-Infinity') THEN
  RAISE EXCEPTION 'Invalid plan' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.services WHERE id=p_service_id AND professional_id=actor AND active) THEN
  RAISE EXCEPTION 'Active own service required' USING ERRCODE='22023'; END IF;
 SELECT * INTO old FROM public.subscription_plans WHERE id=p_id FOR UPDATE;
 IF FOUND THEN
  IF old.professional_id<>actor THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
  -- Same target terms are a safe retry, including a lost edit acknowledgement.
  IF old.name=btrim(p_name) AND old.description=coalesce(btrim(p_description),'') AND old.service_id=p_service_id
   AND old.period_unit=p_period_unit AND old.period_uses=p_period_uses AND old.period_price=round(p_period_price,2)
   AND (p_version=0 OR old.version=p_version+1 OR old.version=p_version) THEN RETURN p_id; END IF;
  IF old.version<>p_version THEN RAISE EXCEPTION 'Plan changed' USING ERRCODE='40001'; END IF;
  UPDATE public.subscription_plans SET name=btrim(p_name),description=coalesce(btrim(p_description),''),
   service_id=p_service_id,period_unit=p_period_unit,period_uses=p_period_uses,period_price=round(p_period_price,2),
   version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
 ELSE
  IF p_version<>0 THEN RAISE EXCEPTION 'Plan unavailable' USING ERRCODE='40001'; END IF;
  INSERT INTO public.subscription_plans(id,professional_id,name,description,service_id,period_unit,period_uses,period_price,active)
  VALUES(p_id,actor,btrim(p_name),coalesce(btrim(p_description),''),p_service_id,p_period_unit,p_period_uses,round(p_period_price,2),true);
 END IF;
 -- Internal templates only satisfy the existing ledger FK; periods carry immutable terms.
 INSERT INTO public.passes(id,professional_id,name,total_uses,price,valid_days,service_id,active,origin)
 VALUES(p_id,actor,'Periodo abbonamento',1,0,1,p_service_id,false,'subscription') ON CONFLICT(id) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM public.passes WHERE id=p_id AND professional_id=actor AND origin='subscription') THEN
  RAISE EXCEPTION 'Conflicting identifier' USING ERRCODE='22023'; END IF;
 RETURN p_id;
END $$;

CREATE FUNCTION pc_private.set_subscription_plan_active(p_id uuid,p_version integer,p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.subscription_plans;
BEGIN
 SELECT * INTO old FROM public.subscription_plans WHERE id=p_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_active IS NULL OR p_version IS NULL THEN RAISE EXCEPTION 'Invalid state' USING ERRCODE='22023'; END IF;
 IF p_active AND (old.service_id IS NULL OR old.period_unit IS NULL OR old.period_uses IS NULL OR old.period_price IS NULL) THEN
  RAISE EXCEPTION 'Complete plan first' USING ERRCODE='PSB01'; END IF;
 IF old.active=p_active THEN RETURN; END IF;
 IF old.version<>p_version THEN RAISE EXCEPTION 'Plan changed' USING ERRCODE='40001'; END IF;
 UPDATE public.subscription_plans SET active=p_active,version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
END $$;

CREATE FUNCTION pc_private.add_subscription_period(p_id uuid,p_subscription public.client_subscriptions,p_ordinal integer,p_previous uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE first_day date:=pc_private.subscription_boundary(p_subscription.starts_on,p_subscription.period_unit,p_ordinal);
 last_day date:=pc_private.subscription_boundary(p_subscription.starts_on,p_subscription.period_unit,p_ordinal+1);
BEGIN
 INSERT INTO public.client_passes(id,pass_id,client_id,professional_id,remaining_uses,purchased_at,expires_at,
 name_snapshot,service_id,service_name_snapshot,total_uses_snapshot,price_snapshot,lifecycle)
 VALUES(p_id,p_subscription.plan_id,p_subscription.client_id,p_subscription.professional_id,p_subscription.period_uses,
 first_day::timestamp AT TIME ZONE 'Europe/Rome',last_day::timestamp AT TIME ZONE 'Europe/Rome',
 p_subscription.name_snapshot,p_subscription.service_id,p_subscription.service_name_snapshot,
 p_subscription.period_uses,p_subscription.period_price,'active');
 INSERT INTO public.subscription_periods(id,subscription_id,ordinal,starts_on,ends_on,client_pass_id,previous_period_id)
 VALUES(p_id,p_subscription.id,p_ordinal,first_day,last_day,p_id,p_previous);
 RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION pc_private.add_subscription_period(uuid,public.client_subscriptions,integer,uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION pc_private.issue_client_subscription(p_id uuid,p_plan_id uuid,p_plan_version integer,p_client_id uuid,p_starts_on date)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); model public.subscription_plans; old public.client_subscriptions;
 service_label text; today date:=(clock_timestamp() AT TIME ZONE 'Europe/Rome')::date;
BEGIN
 IF p_id IS NULL OR p_plan_id IS NULL OR p_client_id IS NULL OR p_plan_version IS NULL OR p_starts_on IS NULL OR NOT isfinite(p_starts_on) THEN
  RAISE EXCEPTION 'Missing subscription data' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 SELECT * INTO old FROM public.client_subscriptions WHERE id=p_id;
 IF FOUND THEN
  IF old.professional_id=actor AND old.plan_id=p_plan_id AND old.client_id=p_client_id AND old.starts_on=p_starts_on THEN RETURN p_id; END IF;
  RAISE EXCEPTION 'Conflicting assignment' USING ERRCODE='22023'; END IF;
 IF p_starts_on<today OR p_starts_on>today+365 THEN RAISE EXCEPTION 'Start today or within one year' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=actor AND approved AND approval_status='approved')
 OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_client_id AND role='owner')
 OR NOT EXISTS(SELECT 1 FROM public.bookings WHERE professional_id=actor AND owner_id=p_client_id AND status IN ('accepted','completed')) THEN
  RAISE EXCEPTION 'Approved professional and existing client required' USING ERRCODE='42501'; END IF;
 SELECT * INTO model FROM public.subscription_plans WHERE id=p_plan_id AND professional_id=actor FOR SHARE;
 IF NOT FOUND OR NOT model.active OR model.period_unit IS NULL OR model.period_uses IS NULL OR model.period_price IS NULL THEN
  RAISE EXCEPTION 'Plan unavailable' USING ERRCODE='PSB01'; END IF;
 IF model.version<>p_plan_version THEN RAISE EXCEPTION 'Plan changed' USING ERRCODE='40001'; END IF;
 SELECT name INTO service_label FROM public.services WHERE id=model.service_id AND professional_id=actor AND active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='PSB01'; END IF;
 IF EXISTS(SELECT 1 FROM public.client_subscriptions WHERE professional_id=actor AND client_id=p_client_id AND plan_id=p_plan_id AND lifecycle='open') THEN
  RAISE EXCEPTION 'An open agreement already exists for this client and plan' USING ERRCODE='PSB02'; END IF;
 INSERT INTO public.client_subscriptions(id,plan_id,client_id,professional_id,name_snapshot,description_snapshot,service_id,
 service_name_snapshot,period_unit,period_uses,period_price,starts_on,lifecycle,started_at)
 VALUES(p_id,model.id,p_client_id,actor,model.name,model.description,model.service_id,service_label,
 model.period_unit,model.period_uses,model.period_price,p_starts_on,'open',clock_timestamp()) RETURNING * INTO old;
 PERFORM pc_private.add_subscription_period(p_id,old,0,null);
 RETURN p_id;
END $$;

CREATE FUNCTION pc_private.renew_client_subscription(p_id uuid,p_subscription_id uuid,p_last_period_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); agreement public.client_subscriptions; latest public.subscription_periods; old public.subscription_periods;
 today date:=(clock_timestamp() AT TIME ZONE 'Europe/Rome')::date;
BEGIN
 IF p_id IS NULL OR p_last_period_id IS NULL THEN RAISE EXCEPTION 'Missing period' USING ERRCODE='22023'; END IF;
 -- Same order as issue/plan save, then agreement: serialize renew and close.
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 SELECT * INTO agreement FROM public.client_subscriptions WHERE id=p_subscription_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 SELECT * INTO old FROM public.subscription_periods WHERE id=p_id;
 IF FOUND THEN
  IF old.subscription_id=agreement.id AND old.previous_period_id=p_last_period_id THEN RETURN p_id; END IF;
  RAISE EXCEPTION 'Conflicting renewal' USING ERRCODE='22023'; END IF;
 IF agreement.lifecycle<>'open' THEN RAISE EXCEPTION 'Renewals closed' USING ERRCODE='PSB03'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=actor AND approved AND approval_status='approved') THEN
  RAISE EXCEPTION 'Approved professional required' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.services WHERE id=agreement.service_id AND professional_id=actor AND active FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Service unavailable' USING ERRCODE='PSB01'; END IF;
 SELECT * INTO latest FROM public.subscription_periods WHERE subscription_id=agreement.id ORDER BY ordinal DESC LIMIT 1;
 IF latest.id IS DISTINCT FROM p_last_period_id THEN RAISE EXCEPTION 'Period changed' USING ERRCODE='40001'; END IF;
 IF latest.starts_on>today THEN RAISE EXCEPTION 'A future period already exists' USING ERRCODE='PSB04'; END IF;
 IF latest.ordinal>=1200 OR pc_private.subscription_boundary(agreement.starts_on,agreement.period_unit,latest.ordinal+2)<=today THEN
  RAISE EXCEPTION 'Next period already expired; start a new agreement' USING ERRCODE='PSB05'; END IF;
 PERFORM pc_private.add_subscription_period(p_id,agreement,latest.ordinal+1,latest.id);
 UPDATE public.client_subscriptions SET version=version+1 WHERE id=agreement.id;
 RETURN p_id;
END $$;

CREATE FUNCTION pc_private.close_client_subscription(p_id uuid,p_version integer,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.client_subscriptions;
BEGIN
 IF p_version IS NULL OR p_reason IS NULL OR char_length(btrim(p_reason)) NOT BETWEEN 3 AND 300 THEN
  RAISE EXCEPTION 'A reason is required' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 SELECT * INTO old FROM public.client_subscriptions WHERE id=p_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF old.lifecycle='closed' AND old.closure_reason=btrim(p_reason) THEN RETURN; END IF;
 IF old.version<>p_version THEN RAISE EXCEPTION 'Agreement changed' USING ERRCODE='40001'; END IF;
 IF old.lifecycle<>'open' THEN RAISE EXCEPTION 'Agreement not open' USING ERRCODE='PSB03'; END IF;
 UPDATE public.client_subscriptions SET lifecycle='closed',status='cancelled',closed_at=clock_timestamp(),
 closure_reason=btrim(p_reason),version=version+1 WHERE id=p_id;
END $$;

CREATE FUNCTION pc_private.list_my_subscriptions(p_professional boolean DEFAULT false)
RETURNS TABLE(id uuid,plan_id uuid,client_name text,professional_name text,name text,description text,service_name text,
 period_unit text,period_uses integer,period_price numeric,starts_on date,lifecycle text,version integer,
 closure_reason text,closed_at timestamptz,started_at timestamptz,latest_period_id uuid,latest_start date,latest_end date,
 next_start date,next_end date,can_renew boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); today date:=(now() AT TIME ZONE 'Europe/Rome')::date;
BEGIN
 IF actor IS NULL OR p_professional IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 IF p_professional THEN PERFORM public.pass_professional_actor(); END IF;
 RETURN QUERY SELECT c.id,c.plan_id,coalesce(nullif(btrim(u.full_name),''),'Cliente'),coalesce(nullif(btrim(pro.full_name),''),'Professionista'),
 coalesce(nullif(c.name_snapshot,''),'Abbonamento precedente'),c.description_snapshot,c.service_name_snapshot,
 c.period_unit,c.period_uses,c.period_price,c.starts_on,c.lifecycle,c.version,c.closure_reason,c.closed_at,c.started_at,
 latest.id,latest.starts_on,latest.ends_on,latest.ends_on,pc_private.subscription_boundary(c.starts_on,c.period_unit,latest.ordinal+2),
 coalesce(c.lifecycle='open' AND latest.ordinal<1200 AND latest.starts_on<=today
 AND pc_private.subscription_boundary(c.starts_on,c.period_unit,latest.ordinal+2)>today
 AND s.active AND p.approved AND p.approval_status='approved',false)
 FROM public.client_subscriptions c JOIN public.profiles u ON u.id=c.client_id JOIN public.profiles pro ON pro.id=c.professional_id
 LEFT JOIN public.professionals p ON p.id=c.professional_id LEFT JOIN public.services s ON s.id=c.service_id
 LEFT JOIN LATERAL(SELECT x.* FROM public.subscription_periods x WHERE x.subscription_id=c.id ORDER BY x.ordinal DESC LIMIT 1) latest ON true
 WHERE (p_professional AND c.professional_id=actor) OR (NOT p_professional AND c.client_id=actor)
 ORDER BY c.started_at DESC,c.id;
END $$;

CREATE FUNCTION pc_private.get_subscription_periods(p_id uuid)
RETURNS TABLE(id uuid,pass_id uuid,client_name text,professional_name text,name text,service_name text,
 total_uses integer,remaining_uses integer,price numeric,purchased_at timestamptz,expires_at timestamptz,state text,
 cancellation_reason text,version integer,ordinal integer,starts_on date,ends_on date,scheduled boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.client_subscriptions c WHERE c.id=p_id AND auth.uid() IN (c.client_id,c.professional_id)) THEN
  RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT cp.id,cp.pass_id,coalesce(nullif(btrim(u.full_name),''),'Cliente'),coalesce(nullif(btrim(pro.full_name),''),'Professionista'),
 cp.name_snapshot,cp.service_name_snapshot,cp.total_uses_snapshot,cp.remaining_uses,cp.price_snapshot,cp.purchased_at,cp.expires_at,
 CASE WHEN cp.lifecycle<>'active' THEN cp.lifecycle WHEN cp.expires_at<=now() THEN 'expired' WHEN cp.remaining_uses<=0 THEN 'exhausted' ELSE 'active' END,
 cp.cancellation_reason,cp.version,x.ordinal,x.starts_on,x.ends_on,cp.purchased_at>now()
 FROM public.subscription_periods x JOIN public.client_passes cp ON cp.id=x.client_pass_id
 JOIN public.profiles u ON u.id=cp.client_id JOIN public.profiles pro ON pro.id=cp.professional_id
 WHERE x.subscription_id=p_id ORDER BY x.ordinal DESC;
END $$;

CREATE OR REPLACE FUNCTION pc_private.list_own_pass_templates()
RETURNS TABLE(id uuid,name text,description text,total_uses integer,price numeric,valid_days integer,
  service_id uuid,service_name text,service_active boolean,active boolean,version integer,created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor();
BEGIN
 RETURN QUERY SELECT p.id,p.name,p.description,p.total_uses,p.price,p.valid_days,p.service_id,
   s.name,coalesce(s.active,false),p.active,p.version,p.created_at
 FROM public.passes p LEFT JOIN public.services s ON s.id=p.service_id
 WHERE p.professional_id=actor AND p.origin='pack' ORDER BY p.created_at DESC,p.id;
END $$;

CREATE OR REPLACE FUNCTION pc_private.save_own_pass_template(p_id uuid,p_version integer,p_service_id uuid,
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
  IF old.professional_id<>actor OR old.origin<>'pack' THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
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

CREATE OR REPLACE FUNCTION pc_private.set_own_pass_template_active(p_id uuid,p_version integer,p_active boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); old public.passes;
BEGIN
 SELECT * INTO old FROM public.passes WHERE id=p_id AND professional_id=actor FOR UPDATE;
 IF NOT FOUND OR old.origin<>'pack' THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_active IS NULL OR p_version IS NULL THEN RAISE EXCEPTION 'Invalid state' USING ERRCODE='22023'; END IF;
 IF old.active=p_active THEN RETURN; END IF;
 IF old.version<>p_version THEN RAISE EXCEPTION 'Changed version' USING ERRCODE='40001'; END IF;
 UPDATE public.passes SET active=p_active,version=version+1,updated_at=clock_timestamp() WHERE id=p_id;
END $$;

CREATE OR REPLACE FUNCTION pc_private.issue_client_pass(p_id uuid,p_template_id uuid,p_client_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' SET timezone='UTC' AS $$
DECLARE actor uuid:=public.pass_professional_actor(); model public.passes; old public.client_passes;
 service_label text; issued timestamptz:=clock_timestamp();
BEGIN
 IF p_id IS NULL OR p_client_id IS NULL OR p_template_id IS NULL THEN
  RAISE EXCEPTION 'Missing assignment data' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.professionals WHERE id=actor FOR UPDATE;
 SELECT * INTO old FROM public.client_passes WHERE id=p_id;
 IF FOUND THEN
  IF old.professional_id=actor AND NOT EXISTS(SELECT 1 FROM public.subscription_periods sp WHERE sp.client_pass_id=old.id) AND old.pass_id=p_template_id AND old.client_id=p_client_id THEN RETURN p_id; END IF;
  RAISE EXCEPTION 'Conflicting assignment' USING ERRCODE='22023';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.professionals WHERE id=actor AND approved AND approval_status='approved') THEN
  RAISE EXCEPTION 'Approved professional required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_client_id AND p.role='owner') OR NOT EXISTS(
  SELECT 1 FROM public.bookings b WHERE b.professional_id=actor AND b.owner_id=p_client_id AND b.status IN ('accepted','completed')) THEN
  RAISE EXCEPTION 'Existing client relationship required' USING ERRCODE='42501'; END IF;
 SELECT * INTO model FROM public.passes WHERE id=p_template_id AND professional_id=actor FOR SHARE;
 IF NOT FOUND OR model.origin<>'pack' OR NOT model.active OR model.service_id IS NULL OR model.total_uses NOT BETWEEN 1 AND 200
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

CREATE OR REPLACE FUNCTION pc_private.list_my_client_passes(p_professional boolean DEFAULT false)
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
 FROM public.client_passes cp JOIN public.passes source ON source.id=cp.pass_id AND source.origin='pack' JOIN public.profiles c ON c.id=cp.client_id JOIN public.profiles p ON p.id=cp.professional_id
 WHERE (p_professional AND cp.professional_id=actor) OR (NOT p_professional AND cp.client_id=actor)
 ORDER BY cp.purchased_at DESC,cp.id;
END $$;

-- Explicit private authorization plus public invoker contracts, matching the API boundary.
DO $wrappers$
DECLARE f record; types text; args text;
BEGIN
 FOR f IN SELECT p.*,pg_get_function_arguments(p.oid) declared_args,pg_get_function_result(p.oid) declared_result
 FROM pg_proc p WHERE p.pronamespace='pc_private'::regnamespace AND p.proname IN (
 'list_own_subscription_plans','save_own_subscription_plan','set_subscription_plan_active','issue_client_subscription',
 'renew_client_subscription','close_client_subscription','list_my_subscriptions','get_subscription_periods') LOOP
  types:=oidvectortypes(f.proargtypes);
  SELECT coalesce(string_agg('$'||i,', ' ORDER BY i),'') INTO args FROM generate_series(1,f.pronargs) i;
  EXECUTE format('REVOKE ALL ON FUNCTION pc_private.%I(%s) FROM PUBLIC,anon,authenticated',f.proname,types);
  EXECUTE format('GRANT EXECUTE ON FUNCTION pc_private.%I(%s) TO authenticated',f.proname,types);
  EXECUTE format('CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER %s SET search_path=%L AS %L',
   f.proname,f.declared_args,f.declared_result,CASE WHEN f.provolatile='s' THEN 'STABLE' ELSE 'VOLATILE' END,'',
   format('SELECT * FROM pc_private.%I(%s)',f.proname,args));
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon,authenticated',f.proname,types);
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated',f.proname,types);
 END LOOP;
END $wrappers$;
NOTIFY pgrst,'reload schema';
COMMIT;
