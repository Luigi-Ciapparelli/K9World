CREATE FUNCTION pg_temp.ok(v boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF v IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAILED: %',label; END IF; END $$;
CREATE FUNCTION pg_temp.denied(q text,code text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN EXECUTE q; RAISE EXCEPTION 'Unexpected success: %',q;
EXCEPTION WHEN OTHERS THEN IF SQLSTATE<>code THEN RAISE; END IF; END $$;
GRANT EXECUTE ON FUNCTION pg_temp.ok(boolean,text),pg_temp.denied(text,text) TO anon,authenticated,service_role;
CREATE FUNCTION pg_temp.signup(n integer,role_name text DEFAULT 'owner',delta jsonb DEFAULT '{}') RETURNS uuid
LANGUAGE plpgsql AS $$
DECLARE uid uuid:=('ac280000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid;
 meta jsonb:=jsonb_build_object('pawconnect_onboarding_version','1','role',role_name,
 'full_name','Persona sintetica','professional_type','trainer','legal_declaration',
 jsonb_build_object('terms_accepted',true,'source','website-signup','terms_version','2026-10-21.1',
 'privacy_notice_version','2026-10-21.1','professional_terms_version',
 CASE WHEN role_name='professional' THEN '2026-10-21.1' ELSE NULL END));
BEGIN
 INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES(uid,'legal-receipt-'||n||'@example.invalid',meta||delta);
 RETURN uid;
END $$;

-- The admission fixture existed before this migration: never invent its terms.
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pc_private.signup_legal_receipts),'No historical acceptance backfill');
SELECT pg_temp.signup(1);
SELECT pg_temp.signup(2,'professional');
SELECT pg_temp.ok((SELECT count(*)=2 FROM pc_private.signup_legal_receipts),'Both website roles captured');
SELECT pg_temp.ok((SELECT account_role='professional' AND terms_accepted
 AND document_hashes ? 'professional-terms' AND recorded_at BETWEEN now() AND clock_timestamp()
 FROM pc_private.signup_legal_receipts WHERE user_id='ac280000-0000-0000-0000-000000000002'),'Professional receipt uses server time and documents');
SELECT pg_temp.ok((SELECT NOT (document_hashes ? 'professional-terms')
 AND (SELECT count(*) FROM jsonb_object_keys(document_hashes))=2
 FROM pc_private.signup_legal_receipts WHERE user_id='ac280000-0000-0000-0000-000000000001'),'Owner has no professional contract');
SELECT pg_temp.ok((SELECT NOT approved AND approval_status='pending' FROM public.professionals
 WHERE id='ac280000-0000-0000-0000-000000000002'),'Receipt cannot approve a trainer');
SELECT pg_temp.ok((SELECT NOT email_verified FROM public.profiles
 WHERE id='ac280000-0000-0000-0000-000000000001'),'Receipt cannot confirm an email');

-- Mutating editable Auth metadata cannot erase, backdate or replace the receipt.
CREATE TEMP TABLE receipt_before AS SELECT * FROM pc_private.signup_legal_receipts;
UPDATE auth.users SET raw_user_meta_data='{"legal_declaration":{"terms_accepted":false,"terms_version":"forged"},"role":"admin"}'
 WHERE id='ac280000-0000-0000-0000-000000000002';
SELECT pg_temp.ok(NOT EXISTS((SELECT * FROM receipt_before EXCEPT SELECT * FROM pc_private.signup_legal_receipts)
 UNION ALL (SELECT * FROM pc_private.signup_legal_receipts EXCEPT SELECT * FROM receipt_before)),
 'Metadata changes cannot change the initial receipt');

SELECT pg_temp.signup(3,'owner','{"legal_declaration":{"terms_accepted":true,"source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1","recorded_at":"2000-01-01","document_hashes":{"terms":"fake"},"ip":"not-stored","marketing_consent":true}}');
SELECT pg_temp.ok((SELECT recorded_at>=now() AND document_hashes->>'terms'=
 '96d78b94b54def38a083768c1e86f0376dacfd2d9ab8ee0d96819e23eca08b29'
 AND NOT (to_jsonb(r) ? 'marketing_consent') AND NOT (to_jsonb(r) ? 'ip')
 FROM pc_private.signup_legal_receipts r WHERE user_id='ac280000-0000-0000-0000-000000000003'),
 'Client timestamp, hashes, IP and marketing are not copied');

-- Simulate an Auth writer without superuser/schema/table rights to the ledger.
CREATE ROLE pc_test_auth_writer NOLOGIN NOSUPERUSER;
GRANT USAGE ON SCHEMA auth TO pc_test_auth_writer;
GRANT INSERT ON auth.users TO pc_test_auth_writer;
GRANT EXECUTE ON FUNCTION pg_temp.signup(integer,text,jsonb) TO pc_test_auth_writer;
SET LOCAL ROLE pc_test_auth_writer;
SELECT pg_temp.signup(4,'owner','{"dog_name":"Cane sintetico","dog_breed":"Meticcio / altra razza","dog_birth_date":"2026-01-01"}');
RESET ROLE;
SELECT pg_temp.ok(EXISTS(SELECT 1 FROM pc_private.signup_legal_receipts WHERE user_id='ac280000-0000-0000-0000-000000000004')
 AND EXISTS(SELECT 1 FROM public.dogs WHERE owner_id='ac280000-0000-0000-0000-000000000004'
 AND name='Cane sintetico' AND birth_date='2026-01-01'),'Auth writer preserves dog onboarding and records receipt');

-- Bad declarations roll back Auth and all previously executed onboarding triggers.
DO $$ DECLARE bad jsonb; declarations jsonb[]:=ARRAY[
 'null'::jsonb,'[]','{}','"not an object"',
 '{"terms_accepted":false,"source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1"}',
 '{"terms_accepted":"true","source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1"}',
 '{"terms_accepted":true,"source":"other","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1"}',
 '{"terms_accepted":true,"source":"website-signup","terms_version":"unknown","privacy_notice_version":"unknown"}',
 '{"terms_accepted":true,"source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"unknown"}',
 '{"terms_accepted":true,"source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1","professional_terms_version":"2026-10-21.1"}'
 ]; BEGIN
 FOREACH bad IN ARRAY declarations LOOP
  BEGIN
   PERFORM pg_temp.signup(20,'owner',jsonb_build_object('legal_declaration',bad));
   RAISE EXCEPTION 'Invalid declaration accepted: %',bad;
  EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 END LOOP;
END $$;
SELECT pg_temp.denied($q$SELECT pg_temp.signup(20,'professional','{"legal_declaration":{"terms_accepted":true,"source":"website-signup","terms_version":"2026-10-21.1","privacy_notice_version":"2026-10-21.1"}}')$q$,'22023');
SELECT pg_temp.denied($q$SELECT pg_temp.signup(20,'admin')$q$,'22023');
SELECT pg_temp.denied($q$SELECT pg_temp.signup(20,'owner','{"role":null}')$q$,'22023');
SELECT pg_temp.denied($q$SELECT pg_temp.signup(20,'owner','{"legal_declaration":null,"dog_name":"Cane da annullare","dog_breed":"Meticcio / altra razza"}')$q$,'22023');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM auth.users WHERE id='ac280000-0000-0000-0000-000000000020')
 AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='ac280000-0000-0000-0000-000000000020')
 AND NOT EXISTS(SELECT 1 FROM public.professionals WHERE id='ac280000-0000-0000-0000-000000000020'),
 'Rejected signup leaves no Auth, profile or professional row');
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM public.dogs WHERE owner_id='ac280000-0000-0000-0000-000000000020'),'Rejected signup leaves no dog');
UPDATE pc_private.signup_legal_revisions SET accepting_signups=false;
SELECT pg_temp.denied($q$SELECT pg_temp.signup(21)$q$,'22023');
UPDATE pc_private.signup_legal_revisions SET accepting_signups=true;

-- Other Auth flows remain outside website onboarding and are never backfilled.
INSERT INTO auth.users(id,email,raw_user_meta_data)
 VALUES('ac280000-0000-0000-0000-000000000030','admin-created@example.invalid','{}');
UPDATE auth.users SET raw_user_meta_data=(SELECT raw_user_meta_data FROM auth.users
 WHERE id='ac280000-0000-0000-0000-000000000003') WHERE id='ac280000-0000-0000-0000-000000000030';
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pc_private.signup_legal_receipts
 WHERE user_id='ac280000-0000-0000-0000-000000000030'),'No acceptance inferred from later metadata edits');

-- Real SQL privileges, including service_role, not merely UI visibility.
DO $$ DECLARE t text; r text; p text; BEGIN
 FOREACH t IN ARRAY ARRAY['signup_legal_revisions','signup_legal_receipts'] LOOP
  PERFORM pg_temp.ok((SELECT relrowsecurity FROM pg_class WHERE oid=('pc_private.'||t)::regclass),'RLS: '||t);
  FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
   FOREACH p IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
    PERFORM pg_temp.ok(NOT has_table_privilege(r,'pc_private.'||t,p),'No direct privilege: '||r||' '||t||' '||p);
   END LOOP;
   PERFORM pg_temp.ok(NOT has_function_privilege(r,'pc_private.capture_signup_legal_receipt()','EXECUTE'),'No direct capture execution: '||r);
  END LOOP;
 END LOOP;
END $$;
SET LOCAL ROLE anon;
SELECT pg_temp.denied('SELECT * FROM pc_private.signup_legal_receipts','42501');
RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ac280000-0000-0000-0000-000000000001',true);
SELECT pg_temp.denied('SELECT * FROM pc_private.signup_legal_receipts','42501');
SELECT pg_temp.denied('UPDATE pc_private.signup_legal_receipts SET recorded_at=now()','42501');
SELECT pg_temp.denied('DELETE FROM pc_private.signup_legal_receipts','42501');
SELECT pg_temp.denied('TRUNCATE pc_private.signup_legal_receipts','42501');
RESET ROLE;
SET LOCAL ROLE service_role;
SELECT pg_temp.denied('SELECT * FROM pc_private.signup_legal_receipts','42501');
RESET ROLE;

-- Deletion of an Auth account removes this narrowly scoped record as documented.
DELETE FROM auth.users WHERE id='ac280000-0000-0000-0000-000000000001';
SELECT pg_temp.ok(NOT EXISTS(SELECT 1 FROM pc_private.signup_legal_receipts
 WHERE user_id='ac280000-0000-0000-0000-000000000001'),'No orphan receipt after account deletion');
SELECT pg_temp.ok((SELECT count(*)=3 FROM pc_private.signup_legal_receipts),'Other receipts preserved');
