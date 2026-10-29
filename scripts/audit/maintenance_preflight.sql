-- Read-only metadata. Not an upgrade, backup or full compatibility certification.
BEGIN READ ONLY;
SET LOCAL statement_timeout='15s';
SELECT jsonb_build_object(
 'server_version',current_setting('server_version'),
 'extensions',(SELECT jsonb_agg(jsonb_build_object('name',extname,'version',extversion))
   FROM pg_extension WHERE extname IN ('ltree','btree_gist','pgcrypto')),
 'ltree_indexes',(SELECT count(DISTINCT idx.indexrelid) FROM pg_index idx
   CROSS JOIN LATERAL unnest(idx.indclass::oid[]) WITH ORDINALITY k(opclass,pos)
   JOIN pg_opclass oc ON oc.oid=k.opclass JOIN pg_type ty ON ty.oid=oc.opcintype
   WHERE k.pos<=idx.indnkeyatts AND ty.typname IN ('ltree','_ltree')),
 'gist_float_indexes',(SELECT count(DISTINCT idx.indexrelid) FROM pg_index idx
   JOIN pg_class ic ON ic.oid=idx.indexrelid JOIN pg_am am ON am.oid=ic.relam
   CROSS JOIN LATERAL unnest(idx.indclass::oid[]) WITH ORDINALITY k(opclass,pos)
   JOIN pg_opclass oc ON oc.oid=k.opclass JOIN pg_type ty ON ty.oid=oc.opcintype
   WHERE k.pos<=idx.indnkeyatts AND am.amname='gist' AND ty.typname IN ('float4','float8')),
 'custom_estimators',(SELECT count(*) FROM pg_operator o
   JOIN pg_namespace n ON n.oid=o.oprnamespace
   LEFT JOIN pg_proc r ON r.oid=o.oprrest LEFT JOIN pg_namespace nr ON nr.oid=r.pronamespace
   LEFT JOIN pg_proc j ON j.oid=o.oprjoin LEFT JOIN pg_namespace nj ON nj.oid=j.pronamespace
   WHERE n.nspname NOT IN ('pg_catalog','information_schema')
   AND ((nr.nspname IS DISTINCT FROM 'pg_catalog' AND o.oprrest<>0)
     OR (nj.nspname IS DISTINCT FROM 'pg_catalog' AND o.oprjoin<>0))),
 'application_pgp_function_references',(SELECT count(*) FROM pg_proc p
   JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname IN ('public','pc_private') AND p.prosrc ~* 'pgp_(sym|pub)_(encrypt|decrypt)'),
 'application_tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname IN ('public','pc_private') AND c.relkind='r'),
 'database_bytes',pg_database_size(current_database())
) AS maintenance_preflight;
ROLLBACK;
