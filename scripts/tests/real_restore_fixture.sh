# Generate invented inputs in a disposable offline source, never against a supplied host.
set -eu
umask 077
export LC_ALL=C PGDATA=/tmp/fixture-pg PGPORT=55446 PGUSER=supabase_admin PGDATABASE=postgres
export PGHOST=/tmp/fixture-sock
mkdir -m 700 "$PGHOST" /tmp/out
initdb -D "$PGDATA" -U "$PGUSER" --auth-local=trust --auth-host=reject --no-locale --encoding=UTF8 >&2
echo "include = '/etc/postgresql-custom/supautils.conf'" >> "$PGDATA/postgresql.conf"
if [ "${PC_SYNTHETIC_MANAGED_EVENTS:-none}" != none ]; then
    # The provider preloads the library in server config, never via a GUC
    # supplied by the unprivileged login. Keep the bootstrap control native.
    echo "session_preload_libraries = 'supautils'" >> "$PGDATA/postgresql.conf"
    export PGOPTIONS='-c session_preload_libraries='
fi
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
if [ "${PC_SYNTHETIC_MANAGED_EVENTS:-none}" != none ]; then
    psql -Xqw -v ON_ERROR_STOP=1 >&2 <<'SQL'
CREATE ROLE supabase_privileged_role;
GRANT supabase_privileged_role TO postgres;
CREATE FUNCTION public.pc_event_handler() RETURNS event_trigger LANGUAGE plpgsql
AS $$ BEGIN RETURN; END $$;
ALTER FUNCTION public.pc_event_handler() OWNER TO postgres;

-- The old restore operation fails even for the native bootstrap superuser.
BEGIN;
CREATE EVENT TRIGGER pc_native_control ON ddl_command_end EXECUTE FUNCTION public.pc_event_handler();
DO $$ BEGIN
  IF (SELECT rolsuper FROM pg_roles WHERE rolname='postgres') THEN RAISE EXCEPTION 'invalid fixture'; END IF;
  BEGIN
    ALTER EVENT TRIGGER pc_native_control OWNER TO postgres;
    RAISE EXCEPTION 'native assignment unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
SQL
    # Create the actual fixtures as the original non-superuser using the shipped policy.
    PGUSER=postgres PGOPTIONS='' psql -Xqw -v ON_ERROR_STOP=1 >&2 <<'SQL'
DO $$ BEGIN
  IF current_user<>'postgres' OR current_setting('is_superuser')<>'off' THEN RAISE EXCEPTION 'wrong event creator'; END IF;
END $$;
CREATE EVENT TRIGGER "fixture ""disabled"" event" ON ddl_command_end
WHEN TAG IN ('CREATE TABLE','COMMENT') EXECUTE FUNCTION public.pc_event_handler();
ALTER EVENT TRIGGER "fixture ""disabled"" event" DISABLE;
COMMENT ON EVENT TRIGGER "fixture ""disabled"" event" IS E'Private test comment.\n-- Dumped by pg_dump version sample';
CREATE EVENT TRIGGER pc_fixture_replica ON sql_drop EXECUTE FUNCTION public.pc_event_handler();
ALTER EVENT TRIGGER pc_fixture_replica ENABLE REPLICA;
SQL
    if [ "$PC_SYNTHETIC_MANAGED_EVENTS" = no_membership ]; then
        psql -Xqw -v ON_ERROR_STOP=1 -c 'REVOKE supabase_privileged_role FROM postgres' >&2
    fi
fi
if [ "${PC_SYNTHETIC_OWNER_FAILURE:-0}" = 1 ]; then
    # A valid source can have a demoted event-trigger owner. PG17 rejects
    # assigning ownership to that non-superuser during replay (42501).
    psql -Xqw -v ON_ERROR_STOP=1 >&2 <<'SQL'
CREATE ROLE private_test_owner SUPERUSER;
CREATE FUNCTION pc_private.synthetic_event() RETURNS event_trigger LANGUAGE plpgsql
AS $$ BEGIN RETURN; END $$;
CREATE EVENT TRIGGER "not-for-diagnostic@example.invalid" ON ddl_command_end
WHEN TAG IN ('COMMENT') EXECUTE FUNCTION pc_private.synthetic_event();
ALTER EVENT TRIGGER "not-for-diagnostic@example.invalid" OWNER TO private_test_owner;
ALTER ROLE private_test_owner NOSUPERUSER;
SQL
fi
pg_dumpall -w --roles-only --no-role-passwords > /tmp/out/roles
pg_dump -w --format=custom --file=/tmp/out/db
pg_ctl -D "$PGDATA" -m fast -w stop >&2
tar -cf - -C /tmp/out roles db
