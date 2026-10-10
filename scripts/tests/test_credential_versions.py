#!/usr/bin/env python3
"""Test credential revisions and version-bound verification against all migrations.

No online connection, credentials or application files are changed.
"""
import argparse
import ast
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

MIGRATION = '20261010190000_versioned_credential_verification.sql'

# Test-only helpers in pg_temp need explicit privileges after default EXECUTE
# has been secured. This never grants access to an application function.
TEST_HELPER_GRANTS = """
CREATE TEMP TABLE IF NOT EXISTS pc_test_keepalive(dummy boolean);
DO $$ BEGIN
  EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT EXECUTE ON FUNCTIONS TO anon,authenticated',
    pg_my_temp_schema()::regnamespace::text);
END $$;
"""


def constant(path, name):
    tree = ast.parse(path.read_text())
    return next(ast.literal_eval(n.value) for n in tree.body
                if isinstance(n, ast.Assign)
                and any(isinstance(t, ast.Name) and t.id == name for t in n.targets))


def fixture(repo):
    tests = repo / 'scripts/tests'
    migrations = sorted((repo / 'supabase/migrations').glob('*.sql'))
    if migrations[-1].name != MIGRATION:
        raise RuntimeError('Storia migration cambiata: rivedere il test.')
    bootstrap = constant(tests / 'test_continuity_migration.py', 'BOOTSTRAP')
    bootstrap += "ALTER TABLE auth.users ADD COLUMN confirmation_sent_at timestamptz, ADD COLUMN phone text;"
    bootstrap += "ALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint, ADD COLUMN allowed_mime_types text[];"
    bootstrap += 'CREATE UNIQUE INDEX storage_test_names ON storage.objects(bucket_id,name); GRANT USAGE ON SCHEMA storage TO anon,authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO anon,authenticated;'
    prior = []
    for migration in migrations[:-1]:
        sql = migration.read_text()
        if migration.name == '20260927131000_harden_client_privileges_and_rls.sql':
            sql = (tests / 'supabase_audit_environment.sql').read_text() + sql
        if migration.name == '20260927170000_restore_professional_passes.sql':
            sql = (tests / 'professional_passes_fixture.sql').read_text() + sql
        if migration.name == '20260928100000_private_api_boundary.sql':
            sql = (tests / 'private_api_before.sql').read_text() + sql
        prior.append([migration.name,sql])
    return dict(bootstrap=bootstrap,migrations=prior,environment=(tests / 'credential_versions_before.sql').read_text(),migration=migrations[-1].read_text(),tests=[
        ['Revisioni, invalidazione, verifiche obsolete, permessi e compatibilità ENCI', (tests / 'credential_versions_assertions.sql').read_text()]])


def concurrency_cases(run, cmd, env):
    """Two native PostgreSQL connections; wait for an observed row-lock holder."""
    import time
    import uuid
    cid = 'e8310000-0000-0000-0003-000000000001'
    owner = 'e8310000-0000-0000-0000-000000000001'
    admin = 'e8310000-0000-0000-0000-000000000008'
    scalar = [*cmd, '-At']
    def version():
        return str(uuid.UUID(run(scalar, input=f"SELECT verification_version FROM public.professional_credentials WHERE id='{cid}';").stdout.strip()))
    def actor(uid):
        return f"SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{uid}',false);"
    def hold(sql, label):
        process = subprocess.Popen([str(x) for x in cmd], env=env, text=True,
                                   stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process.stdin.write(f"SET application_name='{label}'; BEGIN; {sql} SELECT pg_sleep(2); COMMIT;")
        process.stdin.close(); process.stdin = None
        deadline = time.monotonic()+8
        while time.monotonic()<deadline:
            seen = run(scalar, input=f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{label}' AND wait_event='PgSleep');").stdout.strip()
            if seen == 't': return process
            if process.poll() is not None: break
            time.sleep(.03)
        process.kill(); out,err=process.communicate()
        raise RuntimeError('No observed concurrency lock holder: '+err+out)
    token=version()
    process=hold(actor(owner)+f"UPDATE public.professional_credentials SET event_name='Concurrent edit first' WHERE id='{cid}';",'pc_edit_first')
    try:
        run(cmd,input=actor(admin)+f"""DO $$ BEGIN
          BEGIN PERFORM public.admin_review_credential_version('{cid}','{token}','verified',NULL);
            RAISE EXCEPTION 'Stale review accepted';
          EXCEPTION WHEN serialization_failure THEN NULL; END;
        END $$;""")
        out,err=process.communicate(timeout=10)
        if process.returncode: raise RuntimeError(err or out)
    finally:
        if process.poll() is None: process.kill(); process.communicate()
    print('OK: modifica concorrente prima della verifica; attestazione obsoleta respinta.',flush=True)
    token=version()
    process=hold(actor(admin)+f"SELECT public.admin_review_credential_version('{cid}','{token}','verified',NULL);",'pc_review_first')
    try:
        run(cmd,input=actor(owner)+f"UPDATE public.professional_credentials SET event_name='Concurrent edit after review' WHERE id='{cid}';")
        out,err=process.communicate(timeout=10)
        if process.returncode: raise RuntimeError(err or out)
    finally:
        if process.poll() is None: process.kill(); process.communicate()
    state=run(scalar,input=f"SELECT verification_status FROM public.professional_credentials WHERE id='{cid}';").stdout.strip()
    if state!='pending': raise RuntimeError('Later edit kept stale verification: '+state)
    print('OK: verifica concorrente prima della modifica; nuova versione torna da verificare.',flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo', nargs='?', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--export-fixture', type=Path)
    args = parser.parse_args()
    data = fixture(args.repo.expanduser().resolve())
    if args.export_fixture:
        args.export_fixture.write_text(json.dumps(data))
        print('Fixture sintetica esportata:', args.export_fixture)
        return
    if os.geteuid() == 0:
        raise SystemExit('Esegui come Luigi, senza sudo.')
    candidates = list(Path('/usr/lib/postgresql').glob('*/bin/initdb'))
    if not candidates:
        raise SystemExit('PostgreSQL server non trovato: nessuna modifica eseguita.')
    binaries = max(candidates, key=lambda p: int(p.parent.parent.name.split('.')[0])).parent
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    env.update(LC_ALL='C', LANG='C')
    root = Path(tempfile.mkdtemp(prefix='pc-credential-versions-test-'))
    sock = root / 'socket'
    sock.mkdir(mode=0o700)
    started = False

    def run(command, **kwargs):
        result = subprocess.run([str(x) for x in command], env=env, text=True,
                                capture_output=True, timeout=100, **kwargs)
        if result.returncode:
            raise RuntimeError(result.stderr or result.stdout)
        return result

    try:
        print('PostgreSQL temporaneo privato; nessuna porta TCP.', flush=True)
        run([binaries / 'initdb', '-D', root / 'data', '-U', 'pc_test_admin',
             '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8'])
        started = True
        run([binaries / 'pg_ctl', '-D', root / 'data', '-l', root / 'server.log',
             '-o', f"-k {sock} -p 55445 -c listen_addresses='' -c shared_buffers=16MB", '-w', 'start'])
        cmd = [binaries / 'psql', '-X', '-h', sock, '-p', '55445', '-U', 'pc_test_admin',
               '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
        run(cmd, input=data['bootstrap'])
        for name, sql in data['migrations']:
            run(cmd, input=sql)
        print(f"OK: {len(data['migrations'])} migration precedenti ricostruite.", flush=True)
        # Keep catalog snapshots and the first assertions in the same session.
        run(cmd, input=data['environment'] + data['migration'] + data['tests'][0][1])
        print('OK: nuova migrazione e ' + data['tests'][0][0], flush=True)
        for name, sql in data['tests'][1:]:
            run(cmd, input=sql)
            print('OK:', name, flush=True)
        concurrency_cases(run, cmd, env)
        print('TEST SUPERATI. Auth/Storage simulati; database online e servizi Supabase non modificati né verificati.')
    finally:
        if started:
            result = subprocess.run([str(binaries / 'pg_ctl'), '-D', str(root / 'data'),
                '-m', 'fast', '-w', 'stop'], env=env, text=True, capture_output=True, timeout=40)
            if result.returncode:
                raise RuntimeError(f'Arresto da verificare; dati conservati in {root}: {result.stderr}')
        shutil.rmtree(root)


if __name__ == '__main__':
    main()
