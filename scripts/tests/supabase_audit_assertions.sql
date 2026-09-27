BEGIN;
CREATE FUNCTION pg_temp.audit_check(ok boolean, message text) RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'TEST FAILED: %', message; END IF;
END $$;
CREATE FUNCTION pg_temp.audit_denied(statement text, expected text DEFAULT '42501') RETURNS void
LANGUAGE plpgsql AS $$ BEGIN
  EXECUTE statement;
  RAISE EXCEPTION 'TEST FAILED: operation succeeded: %', statement;
EXCEPTION WHEN OTHERS THEN
  IF sqlstate<>expected THEN RAISE; END IF;
END $$;

-- Canonical comparison tolerates formatting/names but rejects changed access.
CREATE TEMP TABLE pc_policy_comparison_probe(id uuid);
CREATE POLICY short_name ON pc_policy_comparison_probe
  FOR SELECT TO authenticated USING (id=(SELECT auth.uid()));
CREATE POLICY deliberately_longer_policy_name ON pc_policy_comparison_probe
  FOR SELECT TO authenticated USING (
    id = ( SELECT auth.uid() )
  );
SELECT pg_temp.audit_check((SELECT
  pg_get_expr(a.polqual,a.polrelid,false)=pg_get_expr(b.polqual,b.polrelid,false)
  FROM pg_policy a JOIN pg_policy b USING(polrelid)
  WHERE a.polrelid='pc_policy_comparison_probe'::regclass
    AND a.polname='short_name' AND b.polname='deliberately_longer_policy_name'),
  'equivalent policy expressions not recognized');
ALTER POLICY deliberately_longer_policy_name ON pc_policy_comparison_probe USING (true);
SELECT pg_temp.audit_check((SELECT
  pg_get_expr(a.polqual,a.polrelid,false)<>pg_get_expr(b.polqual,b.polrelid,false)
  FROM pg_policy a JOIN pg_policy b USING(polrelid)
  WHERE a.polrelid='pc_policy_comparison_probe'::regclass
    AND a.polname='short_name' AND b.polname='deliberately_longer_policy_name'),
  'non-equivalent policy expressions incorrectly accepted');
DROP TABLE pc_policy_comparison_probe;

-- Views remain explicit projections: SQL, options and privileges are identical.
SELECT pg_temp.audit_check(NOT EXISTS (
  SELECT 1 FROM pc_audit_views_before b JOIN pg_class c ON c.oid=('public.'||b.relname)::regclass
  WHERE b.definition IS DISTINCT FROM pg_get_viewdef(c.oid)
     OR b.reloptions IS DISTINCT FROM c.reloptions OR b.relacl IS DISTINCT FROM c.relacl
), 'public projection changed');

-- Only scalar auth.uid() wrapping and the four exact duplicates may differ.
DO $$ DECLARE p record; old_count integer; new_count integer; BEGIN
  SELECT count(*) INTO old_count FROM pc_audit_policies_before;
  SELECT count(*) INTO new_count FROM pg_policies WHERE schemaname IN ('public','storage');
  PERFORM pg_temp.audit_check(old_count-new_count=4+(SELECT count(*)::integer
    FROM pc_audit_policies_before WHERE schemaname='public' AND tablename='profiles'
      AND policyname='View professional profiles'), 'unexpected policy deletion');
  FOR p IN SELECT b.*, a.qual AS new_using, a.with_check AS new_check,
      a.cmd AS new_cmd, a.roles AS new_roles, a.permissive AS new_permissive
    FROM pc_audit_policies_before b JOIN pg_policies a
      USING (schemaname,tablename,policyname)
  LOOP
    PERFORM pg_temp.audit_check(p.cmd=p.new_cmd AND p.roles=p.new_roles
      AND p.permissive=p.new_permissive, 'roles/command changed: '||p.policyname);
    PERFORM pg_temp.audit_check(
      regexp_replace(p.qual,'\s+','','g') IS NOT DISTINCT FROM
      regexp_replace(regexp_replace(p.new_using,'\( SELECT auth.uid\(\) AS uid\)', 'auth.uid()', 'g'),'\s+','','g'),
      'USING changed beyond uid caching: '||p.policyname);
    PERFORM pg_temp.audit_check(
      regexp_replace(p.with_check,'\s+','','g') IS NOT DISTINCT FROM
      regexp_replace(regexp_replace(p.new_check,'\( SELECT auth.uid\(\) AS uid\)', 'auth.uid()', 'g'),'\s+','','g'),
      'WITH CHECK changed beyond uid caching: '||p.policyname);
  END LOOP;
END $$;

DO $$ DECLARE role_name text; signature text; t record; privilege text; BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH signature IN ARRAY ARRAY['public.handle_pawconnect_new_user()',
      'public.set_pawconnect_signup_dog_birth_date()', 'public.sync_auth_email_verification()',
      'public.rls_auto_enable()'] LOOP
      PERFORM pg_temp.audit_check(NOT has_function_privilege(role_name,signature,'EXECUTE'),
        'client trigger access: '||signature);
    END LOOP;
    FOR t IN SELECT c.oid,n.nspname,c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='public' AND c.relkind IN ('r','p') LOOP
      FOREACH privilege IN ARRAY ARRAY['TRUNCATE','REFERENCES','TRIGGER'] LOOP
        PERFORM pg_temp.audit_check(NOT has_table_privilege(role_name,t.oid,privilege),
          'maintenance privilege: '||role_name||' '||t.relname||' '||privilege);
      END LOOP;
      IF current_setting('server_version_num')::integer >= 170000 THEN
        PERFORM pg_temp.audit_check(NOT has_table_privilege(role_name,t.oid,'MAINTAIN'),'MAINTAIN privilege');
      END IF;
    END LOOP;
  END LOOP;
  PERFORM pg_temp.audit_check(NOT has_function_privilege('anon',
    'public.admin_set_professional_approval(uuid,text,text,text)','EXECUTE'), 'anonymous admin RPC');
  PERFORM pg_temp.audit_check(NOT has_function_privilege('anon','public.is_admin()','EXECUTE'),'anonymous admin helper');
  PERFORM pg_temp.audit_check(has_function_privilege('authenticated',
    'public.admin_set_professional_approval(uuid,text,text,text)','EXECUTE'), 'admin RPC unavailable');
END $$;

-- The dashboard event trigger still enables RLS; new objects are private.
CREATE TABLE public.pc_audit_new_table(id bigint);
CREATE SEQUENCE public.pc_audit_new_sequence;
CREATE FUNCTION public.pc_audit_new_function() RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
SELECT pg_temp.audit_check((SELECT relrowsecurity FROM pg_class
  WHERE oid='public.pc_audit_new_table'::regclass),'RLS event trigger broken');
DO $$ DECLARE actor text; privilege text; BEGIN
  FOREACH actor IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH privilege IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] LOOP
      PERFORM pg_temp.audit_check(NOT has_table_privilege(actor,'public.pc_audit_new_table',privilege),'new table public');
    END LOOP;
    FOREACH privilege IN ARRAY ARRAY['SELECT','UPDATE','USAGE'] LOOP
      PERFORM pg_temp.audit_check(NOT has_sequence_privilege(actor,'public.pc_audit_new_sequence',privilege),'new sequence public');
    END LOOP;
    PERFORM pg_temp.audit_check(NOT has_function_privilege(actor,'public.pc_audit_new_function()','EXECUTE'),'new function public');
  END LOOP;
END $$;

-- Auth triggers still create profiles/dog birth dates and sync email verification.
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
('d0000000-0000-0000-0000-000000000001','admin@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Admin","role":"owner"}'),
('d0000000-0000-0000-0000-000000000002','pro@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Public Pro","role":"professional","professional_type":"trainer"}'),
('d0000000-0000-0000-0000-000000000003','owner@example.invalid',NULL,'{"pawconnect_onboarding_version":"1","full_name":"Private Owner","role":"owner"}');
UPDATE public.profiles SET role='admin' WHERE id='d0000000-0000-0000-0000-000000000001';
UPDATE auth.users SET email_confirmed_at=now() WHERE id='d0000000-0000-0000-0000-000000000003';
SELECT pg_temp.audit_check((SELECT email_verified FROM public.profiles
  WHERE id='d0000000-0000-0000-0000-000000000003'),'email sync trigger broken');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-000000000003',true);
SELECT pg_temp.audit_check((SELECT count(*)=1 FROM public.profiles),'owner sees another profile');
SELECT pg_temp.audit_denied($q$SELECT public.admin_set_professional_approval(
  'd0000000-0000-0000-0000-000000000002','approved',NULL,NULL)$q$,'P0001');
SELECT set_config('request.jwt.claim.sub','d0000000-0000-0000-0000-000000000001',true);
SELECT public.admin_set_professional_approval('d0000000-0000-0000-0000-000000000002','approved',NULL,NULL);
SELECT pg_temp.audit_check((SELECT count(*)=3 FROM public.profiles),'admin RLS broken');
RESET ROLE;
SET LOCAL ROLE anon;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT pg_temp.audit_denied($q$SELECT public.admin_set_professional_approval(
  'd0000000-0000-0000-0000-000000000002','approved',NULL,NULL)$q$);
SELECT pg_temp.audit_denied('SELECT public.is_admin()');
SELECT pg_temp.audit_check((SELECT count(*)=1 FROM public.public_professional_profiles),'public profiles missing');
SELECT count(*) FROM public.public_reviews;
SELECT count(*) FROM public.public_professional_sport_merit;
SELECT pg_temp.audit_denied('SELECT * FROM public.profiles');
SELECT pg_temp.audit_denied('SELECT * FROM public.professionals');
SELECT pg_temp.audit_denied('SELECT * FROM public.reviews');
SELECT pg_temp.audit_denied('SELECT * FROM public.professional_note_revisions');
SELECT pg_temp.audit_denied('TRUNCATE public.profiles CASCADE');
RESET ROLE;
ROLLBACK;
