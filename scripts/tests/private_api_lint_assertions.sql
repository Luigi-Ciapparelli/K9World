-- Predicates equivalent to Supabase Splinter 0010/0028/0029, scoped to the app.
-- Official rules were also run unmodified during package validation.
DO $$ DECLARE total integer; BEGIN
 SELECT count(*) INTO total FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prosecdef
 AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'));
 IF total<>0 THEN RAISE EXCEPTION 'Exposed callable SECURITY DEFINER functions: %',total; END IF;
 SELECT count(*) INTO total FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind='v'
 AND (has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('authenticated',c.oid,'SELECT'))
 AND NOT (coalesce(c.reloptions,'{}') && ARRAY['security_invoker=true','security_invoker=on','security_invoker=yes','security_invoker=1']);
 IF total<>0 THEN RAISE EXCEPTION 'Exposed definer views: %',total; END IF;
END $$;
