BEGIN;
-- Fixtures are synthetic professionals created by test_sport_search.py.
CREATE TEMP TABLE evidence_test_context AS
SELECT id FROM public.professional_credentials
WHERE professional_id='c0000000-0000-0000-0000-000000000002';
GRANT SELECT ON evidence_test_context TO authenticated;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',true);
UPDATE public.professional_credentials SET achievement='IGP1'
WHERE id IN (SELECT id FROM evidence_test_context);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.professional_credentials
  WHERE id IN (SELECT id FROM evidence_test_context)
  AND verification_status='pending' AND verification_method IS NULL
  AND reviewed_at IS NULL AND source_fingerprint IS NULL) THEN
   RAISE EXCEPTION 'Changed level retained attestation';
 END IF;
END $$;
UPDATE public.professional_credentials SET verification_status='verified',
 verification_method='working_dog_auto',source_verified_at=now()
WHERE id IN (SELECT id FROM evidence_test_context);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.professional_credentials
  WHERE id IN (SELECT id FROM evidence_test_context) AND verification_status='verified') THEN
   RAISE EXCEPTION 'Owner forged verification';
 END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
-- Even a trusted writer cannot attest a changed fact in the same operation.
UPDATE public.professional_credentials SET achievement='IGP3',verification_status='verified'
WHERE id IN (SELECT id FROM evidence_test_context);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.professional_credentials
  WHERE id IN (SELECT id FROM evidence_test_context) AND verification_status='verified') THEN
   RAISE EXCEPTION 'Evidence change and attestation combined';
 END IF;
END $$;
-- A separate attestation with identical evidence is possible for trusted service.
UPDATE public.professional_credentials SET verification_status='verified',
 verification_method='manual_admin',source_verified_at=now()
WHERE id IN (SELECT id FROM evidence_test_context);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c0000000-0000-0000-0000-000000000002',true);
UPDATE public.professional_credentials SET is_public=false
WHERE id IN (SELECT id FROM evidence_test_context);
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.professional_credentials
  WHERE id IN (SELECT id FROM evidence_test_context) AND verification_status='verified') THEN
   RAISE EXCEPTION 'Visibility toggle invalidated unchanged evidence';
 END IF;
END $$;
UPDATE public.professional_credentials SET score_text='300',dog_name='Different dog'
WHERE id IN (SELECT id FROM evidence_test_context);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.professional_credentials
  WHERE id IN (SELECT id FROM evidence_test_context) AND verification_status='verified') THEN
   RAISE EXCEPTION 'Score/dog edit retained attestation';
 END IF;
END $$;
ROLLBACK;
