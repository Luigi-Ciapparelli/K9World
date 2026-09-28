-- Read-only post-release catalog check. Auth settings are not stored here.
SELECT 'public_definer_views' AS check_name,count(*) AS remaining
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='v'
 AND (has_table_privilege('anon',c.oid,'SELECT') OR has_table_privilege('authenticated',c.oid,'SELECT'))
 AND NOT (coalesce(c.reloptions,'{}') && ARRAY['security_invoker=true','security_invoker=on','security_invoker=yes','security_invoker=1'])
UNION ALL
SELECT 'anon_callable_public_definers',count(*) FROM pg_proc p
WHERE p.pronamespace='public'::regnamespace AND p.prosecdef AND has_function_privilege('anon',p.oid,'EXECUTE')
UNION ALL
SELECT 'authenticated_callable_public_definers',count(*) FROM pg_proc p
WHERE p.pronamespace='public'::regnamespace AND p.prosecdef AND has_function_privilege('authenticated',p.oid,'EXECUTE');

SELECT current_setting('pgrst.db_schemas',true) AS session_exposed_schemas;
-- Also check Supabase Data API settings: pc_private must never be exposed.
