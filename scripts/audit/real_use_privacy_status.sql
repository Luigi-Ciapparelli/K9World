-- Run in Supabase SQL Editor as the project administrator.
-- Read-only structural checks; no names, email addresses, notes, tokens or rows
-- from user tables are returned. Missing components produce DA_COMPLETARE.
-- This is not a legal certification or a behavioural/backup restore test.
BEGIN READ ONLY;
SET LOCAL statement_timeout = '15s';
WITH tables AS (
 SELECT name,to_regclass('pc_private.'||name) AS oid
 FROM (VALUES ('trainer_admission_reviews'),('signup_legal_revisions'),('signup_legal_receipts')) x(name)
), checks AS (
 SELECT 'tabella_privata_'||t.name AS controllo,
 coalesce(c.relrowsecurity,false)
 AND NOT EXISTS(SELECT 1 FROM unnest(ARRAY['anon','authenticated','service_role']) r(role_name)
  CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(privilege_name)
  WHERE has_table_privilege(r.role_name,t.oid,p.privilege_name)) AS ok
 FROM tables t LEFT JOIN pg_class c ON c.oid=t.oid
 UNION ALL
 SELECT 'ricevuta_trigger_attivo',EXISTS(
  SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid
  WHERE t.tgrelid=to_regclass('auth.users') AND t.tgname='zz_pawconnect_signup_legal_receipt'
   AND t.tgenabled IN ('O','A') AND NOT t.tgisinternal AND t.tgtype=5
   AND p.oid=to_regprocedure('pc_private.capture_signup_legal_receipt()')
   AND p.prosecdef AND 'search_path=""'=ANY(coalesce(p.proconfig,'{}')))
 UNION ALL
 SELECT 'ricevuta_non_invocabile_da_client',EXISTS(
  SELECT 1 FROM pg_proc p WHERE p.oid=to_regprocedure('pc_private.capture_signup_legal_receipt()')
   AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
   AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
   AND NOT has_function_privilege('service_role',p.oid,'EXECUTE'))
 UNION ALL
 SELECT 'ammissione_rpc_presenti',
  to_regprocedure('public.admin_get_trainer_admission(uuid)') IS NOT NULL
  AND to_regprocedure('public.admin_approve_trainer(uuid,text,uuid,text,text,boolean,boolean,text,text)') IS NOT NULL
 UNION ALL
 SELECT 'ricevuta_cancellata_con_account',EXISTS(
  SELECT 1 FROM pg_constraint WHERE conrelid=to_regclass('pc_private.signup_legal_receipts')
  AND confrelid=to_regclass('auth.users') AND contype='f' AND confdeltype='c')
)
SELECT controllo,CASE WHEN ok THEN 'OK' ELSE 'DA_COMPLETARE' END AS esito FROM checks ORDER BY controllo;

-- A session setting is not authoritative evidence of the project dashboard.
SELECT 'Data API: pc_private escluso dagli schemi esposti' AS controllo,
 'DA_VERIFICARE_NEL_PANNELLO' AS esito
UNION ALL SELECT 'Auth: conferma email, SMTP e impostazioni antiabuso', 'DA_VERIFICARE_NEL_PANNELLO'
UNION ALL SELECT 'Fornitori/DPA, ruoli, conservazione e prova di ripristino', 'EVIDENZE_OPERATIVE_RICHIESTE';
ROLLBACK;
