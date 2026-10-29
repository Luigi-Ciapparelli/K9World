#!/usr/bin/env python3
"""Dump/restore two private PostgreSQL clusters. Synthetic data; no remote target accepted."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time

from test_signup_legal_receipts import fixture


def sql_identifier(value):
    return '"' + value.replace('"', '""') + '"'


def normalized_schema(text):
    # PostgreSQL adds a random psql safety token to recent plain-text dumps.
    return '\n'.join(line for line in text.splitlines()
                     if not line.startswith(('\\restrict ', '\\unrestrict ')))


class Cluster:
    def __init__(self, root, binaries, env, role):
        self.root, self.binaries, self.env, self.role = root, binaries, env, role
        self.socket = root / 'socket'
        self.socket.mkdir(parents=True, mode=0o700)
        self.started = False

    def run(self, program, args=(), data=None):
        result = subprocess.run([str(self.binaries / program), *map(str, args)],
                                input=data, text=True, env=self.env,
                                capture_output=True, timeout=100)
        if result.returncode:
            raise RuntimeError(program + ': ' + (result.stderr or result.stdout))
        return result.stdout

    def connect(self, database='postgres'):
        return ['-h', str(self.socket), '-p', '55446', '-U', self.role, '-d', database]

    def start(self):
        self.run('initdb', ['-D', self.root / 'data', '-U', self.role,
                           '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8'])
        self.started = True
        self.run('pg_ctl', ['-D', self.root / 'data', '-l', self.root / 'server.log', '-o',
                           f"-k {self.socket} -p 55446 -c listen_addresses='' -c shared_buffers=16MB", '-w', 'start'])

    def sql(self, sql, database='postgres'):
        return self.run('psql', ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
                                *self.connect(database)], sql).strip()

    def stop(self):
        if self.started:
            self.run('pg_ctl', ['-D', self.root / 'data', '-m', 'fast', '-w', 'stop'])
            self.started = False


def data_fingerprint(cluster, database):
    # Only the local synthetic fixture is read. Never print rows or digest inputs.
    tables = json.loads(cluster.sql("""
SELECT coalesce(jsonb_agg(jsonb_build_array(n.nspname,c.relname) ORDER BY n.nspname,c.relname),'[]')
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind='r' AND n.nspname NOT IN ('pg_catalog','information_schema')
AND n.nspname NOT LIKE 'pg_toast%';""", database))
    result = {}
    for schema, table in tables:
        ref = sql_identifier(schema) + '.' + sql_identifier(table)
        rows = cluster.sql(f"SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]') FROM {ref} t;", database)
        result[ref] = hashlib.sha256(rows.encode()).hexdigest()
    sequences = cluster.sql("""SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY schemaname,sequencename),'[]')
FROM pg_sequences s WHERE schemaname NOT IN ('pg_catalog','information_schema');""", database)
    result['sequence_state'] = hashlib.sha256(sequences.encode()).hexdigest()
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo', nargs='?', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    if os.geteuid() == 0:
        raise SystemExit('Esegui senza sudo: il test avvia solo istanze locali private.')
    candidates = list(Path('/usr/lib/postgresql').glob('*/bin/initdb'))
    if not candidates:
        raise SystemExit('PostgreSQL locale non disponibile; nessuna connessione online tentata.')
    binaries = max(candidates, key=lambda p: int(p.parent.parent.name.split('.')[0])).parent
    repo = args.repo.resolve()
    data = fixture(repo)
    # Ignore ambient DB settings/passwords and never accept a URL, host or dump input.
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    env.update(LC_ALL='C', LANG='C')
    previous_umask = os.umask(0o077)
    root = Path(tempfile.mkdtemp(prefix='pc-restore-'))
    source = Cluster(root / 'source', binaries, env, 'pc_source_admin')
    target = Cluster(root / 'target', binaries, env, 'pc_restore_admin')
    started_at = time.monotonic()
    try:
        source.start()
        print('PostgreSQL:', source.sql('SHOW server_version;'), flush=True)
        source.sql(data['bootstrap'])
        for _, sql in data['migrations']:
            source.sql(sql)
        source.sql(data['migration'])
        source.sql((repo / 'scripts/tests/recovery_seed.sql').read_text())
        expected_rows = data_fingerprint(source, 'postgres')
        expected_schema = normalized_schema(source.run('pg_dump', ['--schema-only', *source.connect()]))
        dump = root / 'database.dump'
        roles = source.run('pg_dumpall', ['-h', source.socket, '-p', '55446', '-U', source.role,
                                         '--roles-only', '--no-role-passwords'])
        source.run('pg_dump', ['--format=custom', '--file', dump, *source.connect()])
        dump_hash = hashlib.sha256(dump.read_bytes()).hexdigest()
        source.stop()  # Prove recovery without the source database being available.
        target.start()
        target.sql(roles)
        target.sql('CREATE DATABASE pc_recovery WITH TEMPLATE template0 OWNER pc_source_admin;')
        target.run('pg_restore', ['--exit-on-error', '--single-transaction',
                                  *target.connect('pc_recovery'), dump])
        if hashlib.sha256(dump.read_bytes()).hexdigest() != dump_hash:
            raise RuntimeError('Archive changed during restore')
        actual_schema = normalized_schema(target.run('pg_dump', ['--schema-only', *target.connect('pc_recovery')]))
        if actual_schema != expected_schema:
            raise RuntimeError('Schema/owners/grants/functions/RLS differ after restore')
        if data_fingerprint(target, 'pc_recovery') != expected_rows:
            raise RuntimeError('Rows or sequence state differ after restore')
        print(f'OK: {len(data["migrations"])+1} migration; schema, proprietari, ACL, RLS, righe e sequenze ripristinati.', flush=True)
        target.sql("""BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','ad210000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
 IF (SELECT count(*) FROM public.list_own_professional_note_revisions(50,0))<>2 THEN
  RAISE EXCEPTION 'Missing authorized note revisions after restore'; END IF;
 BEGIN
  PERFORM 1 FROM pc_private.signup_legal_receipts;
  RAISE EXCEPTION 'Private receipt exposed after restore';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;""", 'pc_recovery')
        target.sql('BEGIN;\n' + (repo / 'scripts/tests/trainer_admission_assertions.sql').read_text() + '\nROLLBACK;', 'pc_recovery')
        print('OK: lettura autorizzata delle revisioni, isolamento delle ricevute e regressione ammissione dopo il ripristino.', flush=True)
        target.sql("UPDATE public.professional_note_revisions SET body=body||'alterato' WHERE revision_number=2;", 'pc_recovery')
        if data_fingerprint(target, 'pc_recovery') == expected_rows:
            raise RuntimeError('Comparison failed to detect altered data')
        print('OK: una modifica ai dati viene rilevata dal confronto, non solo dai conteggi.', flush=True)
        print(f'TEST SUPERATO in {time.monotonic()-started_at:.1f}s. Solo fixture sintetica; Auth/Storage simulati.', flush=True)
        print('Nessun backup del progetto online, file Storage reale, prova SMTP o upgrade Supabase eseguito.', flush=True)
    finally:
        failures = []
        for cluster in (source, target):
            try:
                cluster.stop()
            except Exception as error:
                failures.append(str(error))
        os.umask(previous_umask)
        if failures:
            raise RuntimeError(f'Controllare arresto delle istanze in {root}: ' + '; '.join(failures))
        shutil.rmtree(root)


if __name__ == '__main__':
    main()
