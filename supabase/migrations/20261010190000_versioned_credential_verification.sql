-- SPORT-03: invalidate changed evidence and bind reviews to the exact version read.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';
ALTER TABLE public.professional_credentials
 ADD COLUMN evidence_revision bigint NOT NULL DEFAULT 1 CHECK(evidence_revision>0),
 ADD COLUMN verification_version uuid NOT NULL DEFAULT gen_random_uuid();

CREATE FUNCTION pc_private.credential_evidence(p public.professional_credentials) RETURNS jsonb
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('professional_id',p.professional_id,'credential_type',p.credential_type,
 'title',p.title,'issuer_name',p.issuer_name,'issued_at',p.issued_at,'discipline',p.discipline,
 'achievement',p.achievement,'description',p.description,'external_url',p.external_url,
 'document_path',p.document_path,'dog_name',p.dog_name,'event_name',p.event_name,
 'event_scope',p.event_scope,'placement',p.placement,'score_text',p.score_text,
 'source_provider',p.source_provider,'enci_section',p.enci_section);
$$;
CREATE FUNCTION pc_private.enforce_credential_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE changed boolean:=false;
BEGIN
 IF TG_OP='INSERT' THEN NEW.evidence_revision:=1;
 ELSE
  changed:=pc_private.credential_evidence(NEW) IS DISTINCT FROM pc_private.credential_evidence(OLD);
  NEW.evidence_revision:=OLD.evidence_revision+CASE WHEN changed THEN 1 ELSE 0 END;
  IF changed THEN
   NEW.verification_status:=CASE WHEN NEW.external_url IS NOT NULL OR NEW.document_path IS NOT NULL THEN 'pending' ELSE 'self_declared' END;
   NEW.reviewed_at:=NULL;NEW.reviewed_by:=NULL;NEW.verification_method:=NULL;
   NEW.source_verified_at:=NULL;NEW.source_checked_at:=NULL;NEW.source_fingerprint:=NULL;
   NEW.verification_note:='Dati modificati: è necessaria una nuova verifica della fonte.';
  END IF;
 END IF;
 -- Legacy verifier updates cannot attest an unchecked or stale revision.
 IF NEW.verification_status='verified' AND NEW.verification_method='working_dog_auto' THEN
  IF TG_OP='INSERT' OR ROW(NEW.verification_status,NEW.verification_method,NEW.source_fingerprint,NEW.source_verified_at)
    IS DISTINCT FROM ROW(OLD.verification_status,OLD.verification_method,OLD.source_fingerprint,OLD.source_verified_at) THEN
   IF current_setting('pc.credential_check',true) IS DISTINCT FROM NEW.id::text THEN
    RAISE EXCEPTION 'Verificatore non aggiornato: ricarica e riprova.' USING ERRCODE='40001';
   END IF;
  END IF;
 END IF;
 NEW.verification_version:=gen_random_uuid();
 RETURN NEW;
END $$;
-- After both the existing ownership protection and the ENCI consistency trigger.
CREATE TRIGGER zzzz_credential_revision BEFORE INSERT OR UPDATE ON public.professional_credentials
 FOR EACH ROW EXECUTE FUNCTION pc_private.enforce_credential_revision();

CREATE TABLE pc_private.credential_verification_history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 credential_id uuid NOT NULL REFERENCES public.professional_credentials(id) ON DELETE CASCADE,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 actor_id uuid,
 event_kind text NOT NULL CHECK(event_kind IN ('baseline','created','evidence_changed','review_changed')),
 evidence_revision bigint NOT NULL,
 verification_version uuid NOT NULL,
 snapshot jsonb NOT NULL,
 UNIQUE(credential_id,verification_version)
);
ALTER TABLE pc_private.credential_verification_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.credential_verification_history FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO pc_private.credential_verification_history(credential_id,event_kind,evidence_revision,verification_version,snapshot)
 SELECT id,'baseline',evidence_revision,verification_version,to_jsonb(c) FROM public.professional_credentials c;
CREATE FUNCTION pc_private.record_credential_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.evidence_revision IS DISTINCT FROM OLD.evidence_revision OR
  ROW(NEW.verification_status,NEW.verification_method,NEW.reviewed_at,NEW.reviewed_by,NEW.source_fingerprint,NEW.source_checked_at,NEW.verification_note)
  IS DISTINCT FROM ROW(OLD.verification_status,OLD.verification_method,OLD.reviewed_at,OLD.reviewed_by,OLD.source_fingerprint,OLD.source_checked_at,OLD.verification_note) THEN
  INSERT INTO pc_private.credential_verification_history(credential_id,actor_id,event_kind,evidence_revision,verification_version,snapshot)
  VALUES(NEW.id,coalesce(auth.uid(),nullif(current_setting('pc.credential_actor',true),'')::uuid),
   CASE WHEN TG_OP='INSERT' THEN 'created' WHEN NEW.evidence_revision<>OLD.evidence_revision THEN 'evidence_changed' ELSE 'review_changed' END,
   NEW.evidence_revision,NEW.verification_version,to_jsonb(NEW));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER record_credential_revision AFTER INSERT OR UPDATE ON public.professional_credentials
 FOR EACH ROW EXECUTE FUNCTION pc_private.record_credential_revision();

CREATE FUNCTION pc_private.admin_review_credential_version(p_credential_id uuid,p_expected_version uuid,p_status text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.professional_credentials;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin') THEN
  RAISE EXCEPTION 'admin required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('pending','verified','rejected','revoked') THEN
  RAISE EXCEPTION 'invalid credential status' USING ERRCODE='22023'; END IF;
 SELECT * INTO c FROM public.professional_credentials WHERE id=p_credential_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credenziale non trovata.' USING ERRCODE='P0002'; END IF;
 IF p_expected_version IS NULL OR c.verification_version<>p_expected_version THEN
  RAISE EXCEPTION 'La credenziale è cambiata. Ricarica e controlla la nuova versione prima di decidere.' USING ERRCODE='40001'; END IF;
 UPDATE public.professional_credentials SET verification_status=p_status,
 verification_method=CASE WHEN p_status='pending' THEN NULL ELSE 'manual_admin' END,
 reviewed_at=clock_timestamp(),reviewed_by=auth.uid(),verification_note=nullif(btrim(p_note),''),
 source_verified_at=NULL WHERE id=c.id;
END $$;
CREATE FUNCTION public.admin_review_credential_version(p_credential_id uuid,p_expected_version uuid,p_status text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.admin_review_credential_version(p_credential_id,p_expected_version,p_status,p_note);
$$;
-- An older administration screen must reload; it cannot approve unseen edits.
CREATE OR REPLACE FUNCTION pc_private.admin_review_professional_credential(p_credential_id uuid,p_status text,p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin') THEN
  RAISE EXCEPTION 'admin required' USING ERRCODE='42501'; END IF;
 RAISE EXCEPTION 'Ricarica il pannello: la verifica richiede la versione della credenziale.' USING ERRCODE='40001';
END $$;

CREATE FUNCTION pc_private.commit_working_dog_check(p_credential_id uuid,p_expected_version uuid,p_actor_id uuid,
 p_outcome text,p_fingerprint text,p_reason text,p_placement integer DEFAULT NULL,p_score_text text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.professional_credentials; previous_check text;previous_actor text;
BEGIN
 IF p_outcome IS NULL OR p_outcome NOT IN ('matched','not_matched','unavailable') OR length(coalesce(p_reason,''))>2000
  OR (p_outcome<>'unavailable' AND coalesce(p_fingerprint,'') !~ '^[0-9a-f]{64}$')
  OR length(coalesce(p_score_text,''))>100 OR (p_placement IS NOT NULL AND p_placement<1) THEN
  RAISE EXCEPTION 'Invalid verification result' USING ERRCODE='22023'; END IF;
 SELECT * INTO c FROM public.professional_credentials WHERE id=p_credential_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Credenziale non trovata.' USING ERRCODE='P0002'; END IF;
 IF p_actor_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_actor_id
  AND (p.role='admin' OR (p.role='professional' AND p.id=c.professional_id))) THEN
  RAISE EXCEPTION 'Not permitted' USING ERRCODE='42501'; END IF;
 IF c.credential_type NOT IN ('sport_result','official_test') THEN
  RAISE EXCEPTION 'Sport evidence required' USING ERRCODE='22023'; END IF;
 IF p_expected_version IS NULL OR c.verification_version<>p_expected_version THEN
  RAISE EXCEPTION 'I dati sono cambiati durante il controllo. Riprova sulla versione aggiornata.' USING ERRCODE='40001'; END IF;
 previous_check:=current_setting('pc.credential_check',true);previous_actor:=current_setting('pc.credential_actor',true);
 PERFORM set_config('pc.credential_check',c.id::text,true);
 PERFORM set_config('pc.credential_actor',p_actor_id::text,true);
 IF p_outcome='matched' THEN
  -- Persist the parsed facts first. Invalidation and history also apply here.
  UPDATE public.professional_credentials SET source_provider='working_dog',
   placement=coalesce(p_placement,c.placement),score_text=coalesce(p_score_text,c.score_text) WHERE id=c.id;
 END IF;
 -- Same transaction and row lock: no user edit or revocation fits between facts and decision.
 UPDATE public.professional_credentials SET
  verification_status=CASE WHEN p_outcome='unavailable' THEN verification_status WHEN p_outcome='matched' THEN 'verified' ELSE 'pending' END,
  verification_method=CASE WHEN p_outcome='unavailable' THEN verification_method WHEN p_outcome='matched' THEN 'working_dog_auto' ELSE NULL END,
  reviewed_at=CASE WHEN p_outcome='unavailable' THEN reviewed_at ELSE NULL END,
  reviewed_by=CASE WHEN p_outcome='unavailable' THEN reviewed_by ELSE NULL END,
  source_verified_at=CASE WHEN p_outcome='unavailable' THEN source_verified_at WHEN p_outcome='matched' THEN clock_timestamp() ELSE NULL END,
  source_checked_at=clock_timestamp(),source_fingerprint=CASE WHEN p_outcome='unavailable' THEN source_fingerprint ELSE p_fingerprint END,
  verification_note=p_reason WHERE id=c.id RETURNING * INTO c;
 PERFORM set_config('pc.credential_check',coalesce(previous_check,''),true);
 PERFORM set_config('pc.credential_actor',coalesce(previous_actor,''),true);
 RETURN jsonb_build_object('verification_status',c.verification_status,'evidence_revision',c.evidence_revision,'verification_version',c.verification_version);
END $$;
CREATE FUNCTION public.commit_working_dog_check(p_credential_id uuid,p_expected_version uuid,p_actor_id uuid,
 p_outcome text,p_fingerprint text,p_reason text,p_placement integer DEFAULT NULL,p_score_text text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.commit_working_dog_check(p_credential_id,p_expected_version,p_actor_id,p_outcome,p_fingerprint,p_reason,p_placement,p_score_text);
$$;
REVOKE ALL ON FUNCTION pc_private.credential_evidence(public.professional_credentials),pc_private.enforce_credential_revision(),pc_private.record_credential_revision() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION pc_private.admin_review_credential_version(uuid,uuid,text,text),public.admin_review_credential_version(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.admin_review_credential_version(uuid,uuid,text,text),public.admin_review_credential_version(uuid,uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION pc_private.commit_working_dog_check(uuid,uuid,uuid,text,text,text,integer,text),public.commit_working_dog_check(uuid,uuid,uuid,text,text,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.commit_working_dog_check(uuid,uuid,uuid,text,text,text,integer,text),public.commit_working_dog_check(uuid,uuid,uuid,text,text,text,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
