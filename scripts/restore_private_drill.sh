# Only invoked inside the fixed image by restore_encrypted_backups.py. No host mounts.
set -euf
set -o pipefail
umask 077
export LC_ALL=C TMPDIR=/tmp PGDATA=/tmp/dr-pg PGHOST=/tmp/dr-socket PGPORT=55446
export PGUSER=supabase_admin PGDATABASE=template1 PGCONNECT_TIMEOUT=4
mkdir -m 700 /tmp/dr-work "$PGHOST"
cd /tmp/dr-work
# All raw errors, query text, object names and data stay inside the private tmpfs.
exec 3>&1
exec >/tmp/dr-log 2>&1
stage=INPUT
finish() {
    rc=$?
    trap - EXIT
    if [ "$rc" != 0 ]; then
        kind=ERROR
        if grep -Eqi 'no space left|out of memory' /tmp/dr-log; then kind=SPACE
        elif grep -Eqi 'collation|locale.*(invalid|not found|not supported)' /tmp/dr-log; then kind=COLLATION
        elif grep -Eqi 'permission denied|must be (owner|superuser)|not allowed|admin option' /tmp/dr-log; then kind=PRIVILEGE
        elif grep -Eqi 'unrecognized configuration|invalid value for parameter' /tmp/dr-log; then kind=CONFIG
        elif grep -Eqi 'does not exist|is not available|could not access file' /tmp/dr-log; then kind=MISSING
        elif grep -Eqi 'already exists' /tmp/dr-log; then kind=EXISTS
        elif grep -Eqi 'archive version|unsupported data record' /tmp/dr-log; then kind=FORMAT
        fi
        printf 'DR_FAIL:%s:%s\n' "$stage" "$kind" >&3
    fi
    exit "$rc"
}
trap finish EXIT
tar -xf -
pg_restore --list db.dump > toc
grep -Eq '^;[[:space:]]*dbname: postgres$' toc
stage=START
initdb -D "$PGDATA" -U "$PGUSER" --auth-local=trust --auth-host=reject --no-locale --encoding=UTF8
pg_ctl -D "$PGDATA" -l /tmp/dr-pg.log -t 45 -w -o "-k $PGHOST -p $PGPORT -c listen_addresses='' -c wal_level=logical -c shared_preload_libraries=pg_stat_statements" start
test "$(psql -XAtw -v ON_ERROR_STOP=1 -c "SELECT current_setting('data_directory')='/tmp/dr-pg' AND current_setting('listen_addresses')='' AND inet_server_addr() IS NULL AND current_user='supabase_admin' AND current_setting('server_version_num')::int / 10000=17")" = t
stage=ROLES
psql -Xqw -v ON_ERROR_STOP=1 --single-transaction -f roles.apply
stage=DATABASE
# --clean --create acts ONLY on the disposable postgres database in this private cluster.
# It restores database-level ownership, configuration and ACLs with the archive.
pg_restore -w --clean --if-exists --create --exit-on-error -d template1 db.dump
export PGDATABASE=postgres
stage=ROLE_COMPARE
canonical_roles() {
    sed -E '/^($|--|\\(un)?restrict )/d' | LC_ALL=C sort | sha256sum
}
pg_dumpall -w --roles-only --no-role-passwords | canonical_roles > roles.after
canonical_roles < roles.original > roles.before
cmp roles.before roles.after
stage=DATA_COMPARE
# Sort by full COPY header and raw row. Escape sequences stay intact; duplicates
# and empty tables are counted. Unknown data kinds fail rather than being skipped.
canonical_data() {
  awk '
    in_copy && $0 == "\\." {in_copy=0; next}
    in_copy {print "R\t" header "\t" $0; next}
    /^COPY .* FROM stdin;$/ {in_copy=1; header=$0; print "H\t" header; next}
    /^SELECT pg_catalog\.setval\(/ {print "S\t" $0; next}
    /^SET / || /^SELECT pg_catalog\.set_config\(/ || /^--/ || /^\\(un)?restrict / || /^$/ {next}
    {bad=1}
    END {if (in_copy || bad) {print "unsupported data record" > "/dev/stderr"; exit 1}}
  ' | LC_ALL=C sort | sha256sum
}
pg_restore --exit-on-error --data-only --no-owner --no-acl --file=- db.dump | canonical_data > data.before
pg_dump -w --data-only --no-owner --no-acl | canonical_data > data.after
cmp data.before data.after
stage=PRIVACY
psql -Xqw -v ON_ERROR_STOP=1 <<'SQL'
SET search_path=pg_catalog;
DO $dr$ DECLARE n text; r text;
BEGIN
  FOREACH n IN ARRAY ARRAY['auth.users','public.profiles','public.dogs','public.bookings',
    'supabase_migrations.schema_migrations','storage.objects','storage.buckets'] LOOP
    IF to_regclass(n) IS NULL THEN RAISE EXCEPTION 'required relation missing'; END IF;
  END LOOP;
  FOREACH n IN ARRAY ARRAY['pc_private.signup_legal_receipts','public.professional_note_revisions'] LOOP
    IF NOT coalesce((SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass(n)),false)
      THEN RAISE EXCEPTION 'missing RLS'; END IF;
    FOREACH r IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF has_table_privilege(r,n,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
         OR has_any_column_privilege(r,n,'SELECT,INSERT,UPDATE,REFERENCES') THEN
        RAISE EXCEPTION 'unexpected direct privilege'; END IF;
    END LOOP;
  END LOOP;
  IF (SELECT count(*) FROM pg_extension WHERE (extname,extversion) IN
    (('plpgsql','1.0'),('pg_stat_statements','1.11'),('pgcrypto','1.3'),('uuid-ossp','1.1'),
     ('supabase_vault','0.3.1'))) <> 5 THEN RAISE EXCEPTION 'extension mismatch'; END IF;
  IF EXISTS (SELECT FROM vault.secrets) THEN RAISE EXCEPTION 'Vault key plan required'; END IF;
END $dr$;
SQL
stage=STORAGE_FILES
if [ -s object-hashes ]; then sha256sum -c object-hashes; fi
stage=STORAGE_CATALOG
psql -Xqw -v ON_ERROR_STOP=1 <<'SQL'
SET search_path=pg_catalog;
DO $dr$ DECLARE idx jsonb := pg_read_file('/tmp/dr-work/storage-index.json')::jsonb;
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets b FULL JOIN jsonb_each(idx->'buckets') e
      ON e.key=b.id WHERE e.key IS NULL OR b.id IS NULL OR to_jsonb(b.public) IS DISTINCT FROM e.value)
    THEN RAISE EXCEPTION 'separate bucket inventories differ'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects o FULL JOIN jsonb_to_recordset(idx->'objects')
      AS e(bucket text,path text,id text,size bigint,etag text,updated timestamptz)
      ON e.bucket=o.bucket_id AND e.path=o.name
      WHERE o.id IS NULL OR e.id IS NULL OR o.id::text IS DISTINCT FROM e.id
         OR (o.metadata->>'size')::bigint IS DISTINCT FROM e.size
         OR date_trunc('milliseconds',o.updated_at) IS DISTINCT FROM date_trunc('milliseconds',e.updated)
         OR (e.etag IS NOT NULL AND trim(both '"' from coalesce(o.metadata->>'eTag',o.metadata->>'etag','')) <> e.etag))
    THEN RAISE EXCEPTION 'separate object inventories differ'; END IF;
END $dr$;
SQL
stage=STOP
pg_ctl -D "$PGDATA" -m fast -t 45 -w stop
printf 'DR_OK\n' >&3
