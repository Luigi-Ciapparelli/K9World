#!/bin/sh
# This file is passed on stdin to an isolated container; never accept a host or archive.
set -eu
umask 077
export LC_ALL=C PGDATA=/tmp/pc-lab-data PGHOST=/tmp/pc-lab-socket PGPORT=55446
export PGUSER=pc_lab_admin PGDATABASE=postgres PGCONNECT_TIMEOUT=4
mkdir -m 700 "$PGHOST"
initdb -D "$PGDATA" -U "$PGUSER" --auth-local=trust --auth-host=reject --no-locale --encoding=UTF8 >/dev/null
pg_ctl -D "$PGDATA" -l /tmp/pc-lab.log -t 45 -w -o "-k $PGHOST -p $PGPORT -c listen_addresses='' -c shared_preload_libraries=pg_stat_statements" start >/dev/null || {
  cat /tmp/pc-lab.log >&2; exit 1;
}
trap 'pg_ctl -D "$PGDATA" -m fast -w stop >/dev/null' EXIT
psql -X -q -v ON_ERROR_STOP=1 <<'SQL'
CREATE EXTENSION pg_stat_statements VERSION '1.11';
CREATE EXTENSION pgcrypto VERSION '1.3';
CREATE EXTENSION "uuid-ossp" VERSION '1.1';
CREATE SCHEMA vault;
CREATE EXTENSION supabase_vault SCHEMA vault VERSION '0.3.1';
CREATE TABLE public.pc_lab (id integer PRIMARY KEY, note text NOT NULL);
INSERT INTO public.pc_lab VALUES (17, 'prova locale PortaleCinofilo');
SQL
pg_dump --format=custom --file=/tmp/prova.dump postgres
createdb --template=template0 pc_lab_copy
pg_restore --exit-on-error --single-transaction --dbname=pc_lab_copy /tmp/prova.dump
psql -X -q -d pc_lab_copy -v ON_ERROR_STOP=1 <<'SQL'
DO $probe$
BEGIN
  IF current_setting('server_version_num')::int / 10000 <> 17
    OR current_setting('listen_addresses') <> '' OR inet_server_addr() IS NOT NULL THEN
    RAISE EXCEPTION 'Server/versione o connessione non attesi';
  END IF;
  IF (SELECT count(*) FROM pg_extension WHERE (extname,extversion) IN
    (('plpgsql','1.0'),('pg_stat_statements','1.11'),('pgcrypto','1.3'),
     ('uuid-ossp','1.1'),('supabase_vault','0.3.1'))) <> 5 THEN
    RAISE EXCEPTION 'Versioni delle estensioni diverse dalla sorgente';
  END IF;
  IF (SELECT note FROM public.pc_lab WHERE id=17) IS DISTINCT FROM 'prova locale PortaleCinofilo'
    OR (SELECT count(*) FROM public.pc_lab) <> 1 THEN
    RAISE EXCEPTION 'Riga sintetica diversa dopo il ripristino';
  END IF;
  PERFORM 1 FROM public.pg_stat_statements LIMIT 1;
  IF length(public.digest('prova','sha256')) <> 32
     OR public.uuid_nil() <> '00000000-0000-0000-0000-000000000000'::uuid
     OR coalesce(octet_length(vault._crypto_aead_det_noncegen()),0) <= 0 THEN
    RAISE EXCEPTION 'Funzione di estensione non utilizzabile';
  END IF;
END
$probe$;
SQL
echo 'PostgreSQL 17: riga sintetica e cinque estensioni verificate nel database ripristinato.'
