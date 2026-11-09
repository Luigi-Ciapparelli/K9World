# Generate invented inputs in a disposable offline source, never against a supplied host.
set -eu
umask 077
export LC_ALL=C PGDATA=/tmp/fixture-pg PGPORT=55446 PGUSER=supabase_admin PGDATABASE=postgres
export PGHOST=/tmp/fixture-sock
mkdir -m 700 "$PGHOST" /tmp/out
initdb -D "$PGDATA" -U "$PGUSER" --auth-local=trust --auth-host=reject --no-locale --encoding=UTF8 >&2
pg_ctl -D "$PGDATA" -l /tmp/fixture.log -w -o "-k $PGHOST -p $PGPORT -c listen_addresses='' -c shared_preload_libraries=pg_stat_statements" start >&2
psql -Xqw -v ON_ERROR_STOP=1 >&2 <<'SQL'
CREATE ROLE postgres LOGIN;
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE supabase_storage_admin;
GRANT pg_monitor TO postgres WITH ADMIN OPTION;
GRANT pg_monitor TO supabase_storage_admin GRANTED BY postgres;
ALTER DATABASE postgres SET timezone='UTC';
CREATE SCHEMA extensions;
CREATE SCHEMA vault;
CREATE EXTENSION pgcrypto SCHEMA extensions;
CREATE EXTENSION "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION pg_stat_statements SCHEMA extensions;
CREATE EXTENSION supabase_vault SCHEMA vault VERSION '0.3.1';
CREATE SCHEMA auth;
CREATE TABLE auth.users(id int PRIMARY KEY);
CREATE TABLE public.profiles(id int);
CREATE TABLE public.dogs(id int);
CREATE TABLE public.bookings(id bigint GENERATED ALWAYS AS IDENTITY, note text);
INSERT INTO public.bookings(note) VALUES ('--looks like a comment'),(''),(NULL),(E'\n\t'), ('à'),('duplicate'),('duplicate');
CREATE TABLE public.professional_note_revisions(id int, note text);
ALTER TABLE public.professional_note_revisions ENABLE ROW LEVEL SECURITY;
CREATE SCHEMA pc_private;
CREATE TABLE pc_private.signup_legal_receipts(id int, note text);
ALTER TABLE pc_private.signup_legal_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY fixture_policy ON public.professional_note_revisions FOR SELECT TO postgres USING (false);
CREATE SCHEMA supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations(version text);
CREATE SCHEMA storage;
CREATE TABLE storage.buckets(id text PRIMARY KEY, public boolean);
CREATE TABLE storage.objects(id uuid PRIMARY KEY,bucket_id text REFERENCES storage.buckets,name text,metadata jsonb,updated_at timestamptz);
ALTER TABLE storage.objects OWNER TO supabase_storage_admin;
INSERT INTO storage.buckets VALUES ('private-photo',false),('empty-public',true);
INSERT INTO storage.objects VALUES ('00000000-0000-4000-a000-000000000001','private-photo',
 'gruppo/spazio e città.webp','{"size":3,"eTag":"synthetic-tag"}','2026-10-29T10:12:30.123456Z');
SQL
pg_dumpall -w --roles-only --no-role-passwords > /tmp/out/roles
pg_dump -w --format=custom --file=/tmp/out/db
pg_ctl -D "$PGDATA" -m fast -w stop >&2
tar -cf - -C /tmp/out roles db
