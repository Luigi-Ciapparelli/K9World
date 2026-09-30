-- Real contact proof, cross-channel authorization and single-use challenges.
-- No provider configuration or message delivery happens in this migration.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TABLE pc_private.contact_proofs (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email','phone')),
  target text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (user_id,kind)
);
CREATE TABLE pc_private.contact_challenges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('email','phone')),
  target text NOT NULL,
  old_target text NOT NULL,
  other_target text,
  other_verified_at timestamptz,
  target_hash text NOT NULL,
  other_hash text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT clock_timestamp() + interval '10 minutes',
  attempts integer NOT NULL DEFAULT 0,
  state text NOT NULL DEFAULT 'sending' CHECK (state IN ('sending','ready','authorized','applied','cancelled','failed'))
);
CREATE INDEX contact_challenges_user_time ON pc_private.contact_challenges(user_id,created_at DESC);
ALTER TABLE pc_private.contact_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.contact_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.contact_proofs,pc_private.contact_challenges FROM PUBLIC,anon,authenticated,service_role;
REVOKE UPDATE (phone) ON public.profiles FROM authenticated;

CREATE FUNCTION pc_private.contact_normalize(p_kind text,p_value text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_kind='email' THEN lower(btrim(coalesce(p_value,'')))
 ELSE regexp_replace(coalesce(p_value,''),'[[:space:]().-]','','g') END
$$;
REVOKE ALL ON FUNCTION pc_private.contact_normalize(text,text) FROM PUBLIC,anon,authenticated,service_role;

-- Preserve evidence from Auth's email-confirmation flow, not autoconfirmed accounts.
-- Historical SMS flags cannot prove that delivery happened: the old endpoint
-- could return a development code. Reverification does not delete any account.
INSERT INTO pc_private.contact_proofs(user_id,kind,target,verified_at)
SELECT id,'email',lower(btrim(email)),email_confirmed_at FROM auth.users
WHERE email_confirmed_at IS NOT NULL AND confirmation_sent_at IS NOT NULL
 AND email_confirmed_at >= confirmation_sent_at AND nullif(btrim(email),'') IS NOT NULL;
UPDATE public.profiles p SET
 email_verified=EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=p.id AND v.kind='email' AND v.target=lower(btrim(p.email))),
 phone_verified=false;
UPDATE public.verification_codes SET consumed_at=clock_timestamp() WHERE consumed_at IS NULL;

CREATE FUNCTION pc_private.account_contact_status(p_user uuid)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('email',p.email,'phone',p.phone,
  'emailVerified',EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=p.id AND v.kind='email' AND v.target=pc_private.contact_normalize('email',p.email)),
  'phoneVerified',EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=p.id AND v.kind='phone' AND v.target=pc_private.contact_normalize('phone',p.phone)))
 FROM public.profiles p WHERE p.id=p_user
$$;

CREATE FUNCTION pc_private.begin_account_contact(p_user uuid,p_id uuid,p_kind text,p_target text,p_target_hash text,p_other_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.profiles; old_value text; other_value text; proof_time timestamptz; v_target text;
BEGIN
 PERFORM 1 FROM auth.users WHERE id=p_user FOR UPDATE;
 SELECT * INTO STRICT p FROM public.profiles WHERE id=p_user FOR UPDATE;
 DELETE FROM pc_private.contact_challenges WHERE user_id=p_user AND created_at<clock_timestamp()-interval '1 day';
 IF p_kind NOT IN ('email','phone') OR p_target_hash !~ '^[a-f0-9]{64}$' OR p_other_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid contact request'; END IF;
 v_target:=pc_private.contact_normalize(p_kind,p_target);
 IF (p_kind='email' AND (length(v_target)>254 OR v_target !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
 OR (p_kind='phone' AND v_target !~ '^\+[1-9][0-9]{7,14}$') THEN RAISE EXCEPTION 'Invalid contact'; END IF;
 old_value:=pc_private.contact_normalize(p_kind,CASE WHEN p_kind='email' THEN p.email ELSE p.phone END);
 IF old_value<>v_target THEN
  other_value:=pc_private.contact_normalize(CASE WHEN p_kind='email' THEN 'phone' ELSE 'email' END,CASE WHEN p_kind='email' THEN p.phone ELSE p.email END);
  SELECT verified_at INTO proof_time FROM pc_private.contact_proofs WHERE user_id=p_user AND kind=CASE WHEN p_kind='email' THEN 'phone' ELSE 'email' END AND target=other_value;
  IF proof_time IS NULL THEN RETURN jsonb_build_object('error','other_contact_unverified'); END IF;
 END IF;
 IF EXISTS(SELECT 1 FROM pc_private.contact_challenges WHERE user_id=p_user AND created_at>clock_timestamp()-interval '60 seconds')
 OR (SELECT count(*) FROM pc_private.contact_challenges WHERE user_id=p_user AND created_at>clock_timestamp()-interval '1 hour')>=5 THEN
  RETURN jsonb_build_object('error','rate_limited');
 END IF;
 UPDATE pc_private.contact_challenges SET state='cancelled' WHERE user_id=p_user AND state IN ('sending','ready','authorized');
 INSERT INTO pc_private.contact_challenges(id,user_id,kind,target,old_target,other_target,other_verified_at,target_hash,other_hash)
 VALUES(p_id,p_user,p_kind,v_target,old_value,other_value,proof_time,p_target_hash,CASE WHEN other_value IS NOT NULL THEN p_other_hash END);
 RETURN jsonb_build_object('id',p_id,'kind',p_kind,'target',v_target,'otherTarget',other_value,'expiresIn',600);
END $$;

CREATE FUNCTION pc_private.mark_account_contact_delivery(p_user uuid,p_id uuid,p_delivered boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 UPDATE pc_private.contact_challenges SET state=CASE WHEN p_delivered THEN 'ready' ELSE 'failed' END
 WHERE user_id=p_user AND id=p_id AND state='sending' AND expires_at>clock_timestamp();
 RETURN FOUND;
END $$;

CREATE FUNCTION pc_private.complete_account_contact(p_user uuid,p_id uuid,p_target_hash text,p_other_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c pc_private.contact_challenges; p public.profiles; other_kind text;
BEGIN
 PERFORM 1 FROM auth.users WHERE id=p_user FOR UPDATE;
 SELECT * INTO STRICT p FROM public.profiles WHERE id=p_user FOR UPDATE;
 SELECT * INTO c FROM pc_private.contact_challenges WHERE id=p_id AND user_id=p_user FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('error','expired'); END IF;
 IF c.state='applied' THEN RETURN jsonb_build_object('applied',true); END IF;
 IF c.state NOT IN ('ready','authorized') OR c.expires_at<=clock_timestamp() THEN RETURN jsonb_build_object('error','expired'); END IF;
 IF c.attempts>=5 THEN RETURN jsonb_build_object('error','too_many_attempts'); END IF;
 IF c.target_hash IS DISTINCT FROM p_target_hash OR (c.other_hash IS NOT NULL AND c.other_hash IS DISTINCT FROM p_other_hash) THEN
  UPDATE pc_private.contact_challenges SET attempts=attempts+1 WHERE id=c.id;
  RETURN jsonb_build_object('error','invalid_code');
 END IF;
 other_kind:=CASE WHEN c.kind='email' THEN 'phone' ELSE 'email' END;
 IF c.old_target<>pc_private.contact_normalize(c.kind,CASE WHEN c.kind='email' THEN p.email ELSE p.phone END)
 OR (c.other_target IS NOT NULL AND NOT EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=p_user AND v.kind=other_kind AND v.target=c.other_target AND v.verified_at=c.other_verified_at AND v.target=pc_private.contact_normalize(other_kind,CASE WHEN c.kind='email' THEN p.phone ELSE p.email END))) THEN
  UPDATE pc_private.contact_challenges SET state='cancelled' WHERE id=c.id;
  RETURN jsonb_build_object('error','contact_changed');
 END IF;
 IF c.kind='email' AND c.target<>c.old_target THEN
  UPDATE pc_private.contact_challenges SET state='authorized' WHERE id=c.id;
  -- The Auth admin API changes the login email. Its DB trigger consumes this
  -- authorization, checks both snapshots again and commits the proof atomically.
  RETURN jsonb_build_object('applyEmail',c.target);
 END IF;
 INSERT INTO pc_private.contact_proofs(user_id,kind,target) VALUES(p_user,c.kind,c.target)
 ON CONFLICT(user_id,kind) DO UPDATE SET target=excluded.target,verified_at=clock_timestamp();
 IF c.kind='phone' THEN
  UPDATE public.profiles SET phone=c.target WHERE id=p_user;
  UPDATE public.profiles SET phone_verified=true,updated_at=clock_timestamp() WHERE id=p_user;
 ELSE
  UPDATE public.profiles SET email_verified=true,updated_at=clock_timestamp() WHERE id=p_user;
 END IF;
 UPDATE pc_private.contact_challenges SET state='applied' WHERE id=c.id;
 RETURN jsonb_build_object('applied',true);
END $$;

CREATE FUNCTION pc_private.guard_auth_email_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c pc_private.contact_challenges; p public.profiles;
BEGIN
 IF pc_private.contact_normalize('email',new.email)=pc_private.contact_normalize('email',old.email) THEN RETURN new; END IF;
 SELECT * INTO p FROM public.profiles WHERE id=old.id FOR UPDATE;
 SELECT * INTO c FROM pc_private.contact_challenges WHERE user_id=old.id AND kind='email'
  AND state='authorized' AND expires_at>clock_timestamp()
  AND old_target=pc_private.contact_normalize('email',old.email)
  AND target=pc_private.contact_normalize('email',new.email) FOR UPDATE;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=old.id AND v.kind='phone'
  AND v.target=c.other_target AND v.verified_at=c.other_verified_at AND v.target=pc_private.contact_normalize('phone',p.phone)) THEN
  RAISE EXCEPTION 'Change email from Account contacts after both confirmations' USING ERRCODE='42501';
 END IF;
 INSERT INTO pc_private.contact_proofs(user_id,kind,target) VALUES(old.id,'email',c.target)
 ON CONFLICT(user_id,kind) DO UPDATE SET target=excluded.target,verified_at=clock_timestamp();
 UPDATE pc_private.contact_challenges SET state='applied' WHERE id=c.id;
 RETURN new;
END $$;
CREATE TRIGGER pc_guard_auth_email_change BEFORE UPDATE OF email ON auth.users
 FOR EACH ROW EXECUTE FUNCTION pc_private.guard_auth_email_change();

CREATE OR REPLACE FUNCTION public.sync_auth_email_verification()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='UPDATE' AND old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL AND new.confirmation_sent_at IS NOT NULL THEN
  INSERT INTO pc_private.contact_proofs(user_id,kind,target) VALUES(new.id,'email',lower(btrim(new.email)))
  ON CONFLICT(user_id,kind) DO UPDATE SET target=excluded.target,verified_at=clock_timestamp();
 END IF;
 UPDATE public.profiles p SET email=coalesce(new.email,''),email_verified=EXISTS(
  SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=new.id AND v.kind='email' AND v.target=lower(btrim(new.email))
 ),updated_at=clock_timestamp() WHERE p.id=new.id;
 RETURN new;
END $$;

CREATE FUNCTION pc_private.enforce_contact_proof_flags()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 new.email_verified:=EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=new.id AND v.kind='email' AND v.target=pc_private.contact_normalize('email',new.email));
 new.phone_verified:=EXISTS(SELECT 1 FROM pc_private.contact_proofs v WHERE v.user_id=new.id AND v.kind='phone' AND v.target=pc_private.contact_normalize('phone',new.phone));
 RETURN new;
END $$;
CREATE TRIGGER zz_pc_contact_proof_flags BEFORE INSERT OR UPDATE OF email,phone,email_verified,phone_verified
 ON public.profiles FOR EACH ROW EXECUTE FUNCTION pc_private.enforce_contact_proof_flags();
REVOKE ALL ON FUNCTION pc_private.enforce_contact_proof_flags() FROM PUBLIC,anon,authenticated,service_role;

-- No direct client entry into privileged implementations or proof tables.
REVOKE ALL ON FUNCTION pc_private.guard_auth_email_change() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.sync_auth_email_verification() FROM PUBLIC,anon,authenticated,service_role;
DO $$ DECLARE f record; args text; BEGIN
 FOR f IN SELECT p.*,pg_get_function_arguments(p.oid) AS declared_args,pg_get_function_result(p.oid) AS result
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='pc_private'
 AND p.proname IN ('account_contact_status','begin_account_contact','mark_account_contact_delivery','complete_account_contact') LOOP
  SELECT string_agg('$'||i,',' ORDER BY i) INTO args FROM generate_series(1,f.pronargs) i;
  EXECUTE format('REVOKE ALL ON FUNCTION pc_private.%I(%s) FROM PUBLIC,anon,authenticated,service_role',f.proname,oidvectortypes(f.proargtypes));
  EXECUTE format('GRANT EXECUTE ON FUNCTION pc_private.%I(%s) TO service_role',f.proname,oidvectortypes(f.proargtypes));
  EXECUTE format('CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER SET search_path=%L AS %L',f.proname,f.declared_args,f.result,'','SELECT pc_private.'||f.proname||'('||args||')');
  EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC,anon,authenticated,service_role',f.proname,oidvectortypes(f.proargtypes));
  EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role',f.proname,oidvectortypes(f.proargtypes));
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
