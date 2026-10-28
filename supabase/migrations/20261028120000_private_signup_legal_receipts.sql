-- A server receipt of the initial website declaration, not marketing consent,
-- identity verification, proof of reading, or a general Auth access-control rule.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE TABLE pc_private.signup_legal_revisions (
 version text PRIMARY KEY,
 terms_sha256 text NOT NULL CHECK (terms_sha256 ~ '^[a-f0-9]{64}$'),
 professional_terms_sha256 text NOT NULL CHECK (professional_terms_sha256 ~ '^[a-f0-9]{64}$'),
 privacy_sha256 text NOT NULL CHECK (privacy_sha256 ~ '^[a-f0-9]{64}$'),
 accepting_signups boolean NOT NULL DEFAULT false
);
INSERT INTO pc_private.signup_legal_revisions VALUES (
 '2026-10-21.1',
 '96d78b94b54def38a083768c1e86f0376dacfd2d9ab8ee0d96819e23eca08b29',
 '9c11496628372bbfc2bd8ab58ea6ab9b7759370e6c04b4259cad8e6c952354f3',
 '255973cbeb9bb3a16f45ba41397bce1ca46f2ac0df9a5b549a91f668536dcc13',
 true
);

CREATE TABLE pc_private.signup_legal_receipts (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 account_role text NOT NULL CHECK (account_role IN ('owner','professional')),
 notice_version text NOT NULL REFERENCES pc_private.signup_legal_revisions(version),
 terms_accepted boolean NOT NULL CHECK (terms_accepted),
 document_hashes jsonb NOT NULL CHECK (jsonb_typeof(document_hashes)='object')
);
COMMENT ON TABLE pc_private.signup_legal_receipts IS
 'Initial website declaration observed by the server. No IP, email, marketing consent or backfill. Removed with the Auth account; no claim of legally mandated indefinite retention.';

ALTER TABLE pc_private.signup_legal_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_private.signup_legal_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON pc_private.signup_legal_revisions,pc_private.signup_legal_receipts
 FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION pc_private.capture_signup_legal_receipt() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
 meta jsonb := coalesce(NEW.raw_user_meta_data,'{}'::jsonb);
 declaration jsonb := meta->'legal_declaration';
 signup_role text := meta->>'role';
 revision pc_private.signup_legal_revisions;
 hashes jsonb;
BEGIN
 -- Match the existing onboarding boundary. Administrative imports and other
 -- Auth flows do not acquire an invented acceptance or an application profile.
 IF meta->>'pawconnect_onboarding_version' IS DISTINCT FROM '1' THEN RETURN NEW; END IF;
 IF signup_role IS NULL OR signup_role NOT IN ('owner','professional')
 OR jsonb_typeof(declaration) IS DISTINCT FROM 'object'
 OR declaration->'terms_accepted' IS DISTINCT FROM 'true'::jsonb
 OR declaration->>'source' IS DISTINCT FROM 'website-signup' THEN
  RAISE EXCEPTION 'Accetta i termini prima di creare il tuo account.' USING ERRCODE='22023';
 END IF;

 SELECT * INTO revision FROM pc_private.signup_legal_revisions
 WHERE version=declaration->>'terms_version' AND accepting_signups FOR SHARE;
 IF NOT FOUND OR declaration->>'privacy_notice_version' IS DISTINCT FROM revision.version
 OR (signup_role='professional' AND declaration->>'professional_terms_version' IS DISTINCT FROM revision.version)
 OR (signup_role='owner' AND declaration->>'professional_terms_version' IS NOT NULL) THEN
  RAISE EXCEPTION 'Versione dei termini non disponibile. Ricarica la registrazione.' USING ERRCODE='22023';
 END IF;

 hashes := jsonb_build_object('terms',revision.terms_sha256,'privacy',revision.privacy_sha256);
 IF signup_role='professional' THEN
  hashes := hashes||jsonb_build_object('professional-terms',revision.professional_terms_sha256);
 END IF;
 -- Only whitelisted fields are stored. Versions/hashes come from the server
 -- catalogue and the timestamp from the server clock, never from client input.
 INSERT INTO pc_private.signup_legal_receipts(user_id,account_role,notice_version,terms_accepted,document_hashes)
 VALUES(NEW.id,signup_role,revision.version,true,hashes);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION pc_private.capture_signup_legal_receipt()
 FROM PUBLIC,anon,authenticated,service_role;

-- Same transaction as Auth/profile/dog creation: failure leaves no partial
-- account. No UPDATE trigger: later user_metadata edits cannot rewrite history.
CREATE TRIGGER zz_pawconnect_signup_legal_receipt AFTER INSERT ON auth.users
 FOR EACH ROW EXECUTE FUNCTION pc_private.capture_signup_legal_receipt();

-- Deliberately no backfill, new public RPC or change to professional admission.
NOTIFY pgrst, 'reload schema';
COMMIT;
