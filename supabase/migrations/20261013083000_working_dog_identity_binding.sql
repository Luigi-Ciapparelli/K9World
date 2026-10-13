-- A matching display name is not proof of control of a Working-Dog account.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';

ALTER TABLE public.professional_external_identities
 ADD COLUMN provider_user_id text,
 ADD COLUMN verification_version uuid NOT NULL DEFAULT gen_random_uuid();
CREATE FUNCTION pc_private.working_dog_user_id(p_url text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_url ~ '^https://(www\.)?working-dog\.(com|eu)/user/[^/?#[:space:]@]+-[1-9][0-9]{0,19}/?$'
 THEN substring(p_url FROM '/user/[^/?#[:space:]@]+-([1-9][0-9]{0,19})/?$') END;
$$;

CREATE TABLE pc_private.external_identity_history(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 identity_id uuid NOT NULL,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 actor_id uuid,
 snapshot jsonb NOT NULL
);
ALTER TABLE pc_private.external_identity_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.external_identity_history FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO pc_private.external_identity_history(identity_id,snapshot)
 SELECT id,to_jsonb(i) FROM public.professional_external_identities i;

-- No direct client/service writes: old Edge deployments cannot keep attesting names.
REVOKE INSERT,UPDATE,DELETE ON public.professional_external_identities FROM anon,authenticated,service_role;
DROP TRIGGER protect_external_identity_verification ON public.professional_external_identities;
UPDATE public.professional_external_identities SET provider_user_id=pc_private.working_dog_user_id(profile_url);
UPDATE public.professional_external_identities SET verification_status='pending',verification_method=NULL,
 verified_at=NULL,verification_version=gen_random_uuid(),updated_at=clock_timestamp(),
 verification_note='Collegamento da verificare: la corrispondenza del nome non prova la titolarità dell’account.'
 WHERE verification_status='verified';
-- Old links were mutable without invalidating even a manual attestation.
INSERT INTO pc_private.external_identity_history(identity_id,snapshot)
 SELECT id,to_jsonb(i) FROM public.professional_external_identities i;
-- Preserve all facts/history; automatic results need a new identity-bound check.
UPDATE public.professional_credentials SET verification_status='pending',verification_method=NULL,
 source_verified_at=NULL,reviewed_at=NULL,reviewed_by=NULL,
 verification_note='È necessaria una nuova verifica del risultato collegata all’identità Working-Dog.'
 WHERE verification_method='working_dog_auto';
DROP INDEX public.professional_external_identity_provider_url_uidx;
-- Pending claims do not reserve somebody else's account. Only confirmed ownership is unique.
CREATE UNIQUE INDEX external_identity_verified_user_uidx
 ON public.professional_external_identities(provider,provider_user_id) WHERE verification_status='verified';

CREATE FUNCTION pc_private.guard_external_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 NEW.provider_user_id:=pc_private.working_dog_user_id(NEW.profile_url);
 IF NEW.provider_user_id IS NULL AND (TG_OP='INSERT' OR NEW.profile_url IS DISTINCT FROM OLD.profile_url OR NEW.verification_status='verified') THEN
  RAISE EXCEPTION 'Inserisci l’URL HTTPS del profilo Working-Dog /user/…-numero.' USING ERRCODE='22023'; END IF;
 IF TG_OP='UPDATE' AND ROW(NEW.professional_id,NEW.provider) IS DISTINCT FROM ROW(OLD.professional_id,OLD.provider) THEN
  RAISE EXCEPTION 'Identity owner cannot change' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' OR NEW.profile_url IS DISTINCT FROM OLD.profile_url THEN
  NEW.verification_status:='pending';NEW.verification_method:=NULL;NEW.verified_at:=NULL;
  NEW.external_display_name:=NULL;NEW.source_fingerprint:=NULL;NEW.last_checked_at:=NULL;
  NEW.verification_note:='Collegamento ricevuto. La titolarità deve essere verificata prima dei risultati.';
 ELSIF NEW.verification_status='verified' THEN
  IF NEW.verification_method IS DISTINCT FROM 'manual_admin' OR
   current_setting('pc.identity_review',true) IS DISTINCT FROM NEW.id::text THEN
   RAISE EXCEPTION 'Identity review required' USING ERRCODE='42501'; END IF;
 END IF;
 NEW.verification_version:=gen_random_uuid();NEW.updated_at:=clock_timestamp();
 RETURN NEW;
END $$;
CREATE TRIGGER guard_external_identity BEFORE INSERT OR UPDATE ON public.professional_external_identities
 FOR EACH ROW EXECUTE FUNCTION pc_private.guard_external_identity();
CREATE FUNCTION pc_private.record_external_identity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous_invalidation text;
BEGIN
 INSERT INTO pc_private.external_identity_history(identity_id,actor_id,snapshot)
 VALUES(CASE WHEN TG_OP='DELETE' THEN OLD.id ELSE NEW.id END,auth.uid(),
  CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD)||jsonb_build_object('deleted',true) ELSE to_jsonb(NEW) END);
 IF TG_OP<>'INSERT' THEN
  -- Identity row is locked before credential rows, also in the verification RPC.
  previous_invalidation:=current_setting('pc.identity_invalidate',true);
  PERFORM set_config('pc.identity_invalidate',OLD.professional_id::text,true);
  UPDATE public.professional_credentials SET verification_status='pending',verification_method=NULL,
   source_verified_at=NULL,reviewed_at=NULL,reviewed_by=NULL,
   verification_note='Collegamento Working-Dog modificato o revocato: risultato da ricontrollare.'
   WHERE professional_id=OLD.professional_id AND verification_method='working_dog_auto';
  PERFORM set_config('pc.identity_invalidate',coalesce(previous_invalidation,''),true);
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER record_external_identity AFTER INSERT OR UPDATE OR DELETE ON public.professional_external_identities
 FOR EACH ROW EXECUTE FUNCTION pc_private.record_external_identity();

-- Runs after the legacy trigger that restores protected fields on owner writes.
CREATE FUNCTION pc_private.invalidate_identity_credentials() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF current_setting('pc.identity_invalidate',true)=NEW.professional_id::text AND OLD.verification_method='working_dog_auto' THEN
  NEW.verification_status:='pending';NEW.verification_method:=NULL;NEW.source_verified_at:=NULL;
  NEW.reviewed_at:=NULL;NEW.reviewed_by:=NULL;
  NEW.verification_note:='Collegamento Working-Dog modificato o revocato: risultato da ricontrollare.';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zzzzz_identity_credential_invalidation BEFORE UPDATE ON public.professional_credentials
 FOR EACH ROW EXECUTE FUNCTION pc_private.invalidate_identity_credentials();

CREATE FUNCTION pc_private.request_working_dog_identity(p_url text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE i public.professional_external_identities; url text:=regexp_replace(btrim(p_url),'/$',''); provider_id text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='professional') THEN
  RAISE EXCEPTION 'Professional required' USING ERRCODE='42501'; END IF;
 provider_id:=pc_private.working_dog_user_id(url);
 IF provider_id IS NULL THEN RAISE EXCEPTION 'URL del profilo Working-Dog non valido.' USING ERRCODE='22023'; END IF;
 IF EXISTS(SELECT 1 FROM public.professional_external_identities WHERE provider='working_dog' AND provider_user_id=provider_id
  AND verification_status='verified' AND professional_id<>auth.uid()) THEN
  RAISE EXCEPTION 'Profilo già collegato a un altro account verificato.' USING ERRCODE='23505'; END IF;
 INSERT INTO public.professional_external_identities(professional_id,provider,profile_url)
 VALUES(auth.uid(),'working_dog',url) ON CONFLICT(provider,professional_id) DO UPDATE SET profile_url=excluded.profile_url
 WHERE professional_external_identities.profile_url IS DISTINCT FROM excluded.profile_url;
 SELECT * INTO i FROM public.professional_external_identities WHERE professional_id=auth.uid() AND provider='working_dog';
 RETURN to_jsonb(i);
END $$;
CREATE FUNCTION public.request_working_dog_identity(p_url text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.request_working_dog_identity(p_url); $$;

CREATE FUNCTION pc_private.review_working_dog_identity(p_id uuid,p_expected_version uuid,p_status text,p_note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE i public.professional_external_identities; previous_review text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=auth.uid() AND role='admin') THEN
  RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('verified','rejected','revoked') OR length(btrim(coalesce(p_note,''))) NOT BETWEEN 20 AND 1000 THEN
  RAISE EXCEPTION 'Indica l’esito e come è stata accertata la titolarità (20–1000 caratteri).' USING ERRCODE='22023'; END IF;
 SELECT * INTO i FROM public.professional_external_identities WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Collegamento non trovato.' USING ERRCODE='P0002'; END IF;
 IF p_expected_version IS NULL OR i.verification_version<>p_expected_version THEN
  RAISE EXCEPTION 'Collegamento cambiato: ricarica e controlla la nuova versione.' USING ERRCODE='40001'; END IF;
 previous_review:=current_setting('pc.identity_review',true);PERFORM set_config('pc.identity_review',i.id::text,true);
 UPDATE public.professional_external_identities SET verification_status=p_status,verification_method='manual_admin',
  verified_at=CASE WHEN p_status='verified' THEN clock_timestamp() END,last_checked_at=clock_timestamp(),verification_note=btrim(p_note) WHERE id=i.id;
 PERFORM set_config('pc.identity_review',coalesce(previous_review,''),true);
END $$;
CREATE FUNCTION public.review_working_dog_identity(p_id uuid,p_expected_version uuid,p_status text,p_note text) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT pc_private.review_working_dog_identity(p_id,p_expected_version,p_status,p_note); $$;

-- The old public entry point must not accept a stale Edge verifier.
CREATE OR REPLACE FUNCTION public.commit_working_dog_check(p_credential_id uuid,p_expected_version uuid,p_actor_id uuid,
 p_outcome text,p_fingerprint text,p_reason text,p_placement integer DEFAULT NULL,p_score_text text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Aggiorna il verificatore: è richiesta la verifica dell’identità.' USING ERRCODE='40001'; END $$;
REVOKE EXECUTE ON FUNCTION pc_private.commit_working_dog_check(uuid,uuid,uuid,text,text,text,integer,text) FROM service_role;
CREATE FUNCTION pc_private.commit_bound_working_dog_check(p_credential_id uuid,p_expected_version uuid,p_actor_id uuid,
 p_identity_version uuid,p_handler_id text,p_outcome text,p_fingerprint text,p_reason text,
 p_placement integer DEFAULT NULL,p_score_text text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE i public.professional_external_identities; owner_id uuid; credential_status text; result jsonb;
BEGIN
 SELECT professional_id INTO owner_id FROM public.professional_credentials WHERE id=p_credential_id;
 SELECT * INTO i FROM public.professional_external_identities WHERE professional_id=owner_id AND provider='working_dog' FOR UPDATE;
 IF NOT FOUND OR i.verification_status<>'verified' OR i.verification_method IS DISTINCT FROM 'manual_admin' OR
  p_identity_version IS NULL OR i.verification_version<>p_identity_version OR i.provider_user_id IS NULL THEN
  RAISE EXCEPTION 'Identità non verificata o cambiata: ricarica e riprova.' USING ERRCODE='40001'; END IF;
 IF p_outcome='matched' AND p_handler_id IS DISTINCT FROM i.provider_user_id THEN
  RAISE EXCEPTION 'Il conduttore del risultato non coincide con il profilo verificato.' USING ERRCODE='22023'; END IF;
 SELECT verification_status INTO credential_status FROM public.professional_credentials WHERE id=p_credential_id FOR UPDATE;
 IF p_outcome='matched' AND credential_status IN ('rejected','revoked') THEN
  RAISE EXCEPTION 'Risultato revocato o rifiutato: è richiesta una nuova revisione amministrativa.' USING ERRCODE='40001'; END IF;
 result:=pc_private.commit_working_dog_check(p_credential_id,p_expected_version,p_actor_id,p_outcome,p_fingerprint,p_reason,p_placement,p_score_text);
 RETURN result;
END $$;
CREATE FUNCTION public.commit_bound_working_dog_check(p_credential_id uuid,p_expected_version uuid,p_actor_id uuid,
 p_identity_version uuid,p_handler_id text,p_outcome text,p_fingerprint text,p_reason text,
 p_placement integer DEFAULT NULL,p_score_text text DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.commit_bound_working_dog_check(p_credential_id,p_expected_version,p_actor_id,p_identity_version,p_handler_id,p_outcome,p_fingerprint,p_reason,p_placement,p_score_text);
$$;
REVOKE ALL ON FUNCTION pc_private.working_dog_user_id(text),pc_private.guard_external_identity(),pc_private.record_external_identity(),pc_private.invalidate_identity_credentials() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.request_working_dog_identity(text),pc_private.request_working_dog_identity(text),
 public.review_working_dog_identity(uuid,uuid,text,text),pc_private.review_working_dog_identity(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.request_working_dog_identity(text),pc_private.request_working_dog_identity(text),
 public.review_working_dog_identity(uuid,uuid,text,text),pc_private.review_working_dog_identity(uuid,uuid,text,text) TO authenticated;
REVOKE ALL ON FUNCTION public.commit_bound_working_dog_check(uuid,uuid,uuid,uuid,text,text,text,text,integer,text),
 pc_private.commit_bound_working_dog_check(uuid,uuid,uuid,uuid,text,text,text,text,integer,text) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.commit_bound_working_dog_check(uuid,uuid,uuid,uuid,text,text,text,text,integer,text),
 pc_private.commit_bound_working_dog_check(uuid,uuid,uuid,uuid,text,text,text,text,integer,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
