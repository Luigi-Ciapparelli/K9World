#!/usr/bin/env python3
"""Test trainer admission against the complete migration history.

No online connection, credentials or application files are changed.
"""
import argparse
import ast
import json
import os
import select
import time
from pathlib import Path
import shutil
import subprocess
import tempfile

MIGRATION = '20261021100000_verified_trainer_admission.sql'

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
    return dict(bootstrap=bootstrap,migrations=prior,environment=(tests / 'trainer_admission_before.sql').read_text(),migration=migrations[-1].read_text(),tests=[
        ['Ammissione, fonti, isolamento, revoca e conservazione dati', (tests / 'trainer_admission_assertions.sql').read_text()],
    ])


def concurrency(cmd, env):
    prefix = [str(x) for x in cmd] + ['-At', '-v', 'VERBOSITY=verbose']
    admin = 'ad210000-0000-0000-0000-000000000006'
    pro = 'ad210000-0000-0000-0000-000000000001'
    credential = 'ad210000-0000-0000-0002-000000000001'
    def sql(statement):
        r = subprocess.run(prefix, input=statement, env=env, text=True, capture_output=True, timeout=20)
        if r.returncode: raise RuntimeError(r.stderr)
        return r.stdout.strip()
    def as_user(uid, statement):
        return f"SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{uid}',true);\n{statement}\n"
    def pair(first_uid, first_sql, second_uid, second_sql, expected_error=None):
        # First transaction signals after executing its mutation and retains locks.
        # Second transaction must be observed waiting on a real PostgreSQL lock.
        first=None; second=None
        try:
            first=subprocess.Popen(prefix, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
            first.stdin.write(('BEGIN;'+as_user(first_uid, first_sql)+"SELECT 'PC_HOLDER_READY';\n").encode())
            first.stdin.flush()
            buffer=b''; deadline=time.monotonic()+15
            while b'PC_HOLDER_READY' not in buffer:
                if time.monotonic()>deadline: raise RuntimeError('Timeout waiting for first transaction')
                ready,_,_=select.select([first.stdout],[],[],0.2)
                if ready:
                    chunk=os.read(first.stdout.fileno(),4096)
                    if not chunk: raise RuntimeError('First transaction failed: '+first.stderr.read().decode())
                    buffer+=chunk
            second_env=dict(env,PGAPPNAME='pc_admission_contender')
            second=subprocess.Popen(prefix,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=second_env)
            second.stdin.write(('BEGIN;'+as_user(second_uid,second_sql)+'COMMIT;\n').encode())
            second.stdin.close();second.stdin=None
            deadline=time.monotonic()+10; blocked=False
            while time.monotonic()<deadline:
                blocked=sql("SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='pc_admission_contender' AND wait_event_type='Lock');")=='t'
                if blocked: break
                if second.poll() is not None: break
                time.sleep(0.05)
            if not blocked: raise RuntimeError('Second transaction did not wait on the expected database lock')
            first.stdin.write(b'COMMIT;\n');first.stdin.close();first.stdin=None
            _,err=first.communicate(timeout=15)
            if first.returncode: raise RuntimeError('First commit failed: '+err.decode())
            out,err=second.communicate(timeout=15)
            if expected_error is None:
                if second.returncode: raise RuntimeError('Second transaction failed: '+err.decode())
            elif second.returncode==0 or expected_error not in err.decode():
                raise RuntimeError('Expected SQLSTATE '+expected_error+'; got '+err.decode())
        finally:
            for process in [first,second]:
                if process is not None and process.poll() is None:
                    process.terminate()
                    try: process.communicate(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill();process.communicate(timeout=5)
    def approval():
        # psql emits SET / BEGIN / COMMIT: get just the hash, not a command tag.
        import re
        tokens = re.findall(r'(?m)^[a-f0-9]{32}$', sql("BEGIN;"+as_user(admin,f"SELECT public.admin_get_trainer_admission('{pro}')->>'token';")+"COMMIT;"))
        if len(tokens)!=1: raise RuntimeError('Missing admission token')
        token=tokens[0]
        return f"SELECT public.admin_approve_trainer('{pro}','{token}','{credential}','CSEN','Persona 1',true,true,'Fonte e identità sintetiche controllate',NULL);"
    revoke = f"SELECT public.admin_review_credential_version(id,verification_version,'revoked','Revoca concorrente') FROM public.professional_credentials WHERE id='{credential}';"
    pair(admin,approval(),admin,revoke)
    if sql(f"SELECT approved FROM public.professionals WHERE id='{pro}';")!='f': raise RuntimeError('Concurrent revocation did not hide the profile')
    sql('BEGIN;'+as_user(admin,f"SELECT public.admin_review_credential_version(id,verification_version,'verified','Nuova verifica di prova') FROM public.professional_credentials WHERE id='{credential}';")+'COMMIT;')
    pair(admin,revoke,admin,approval(),'40001')
    if sql(f"SELECT approved FROM public.professionals WHERE id='{pro}';")!='f': raise RuntimeError('Stale approval published the profile')
    print('OK: approvazione/revoca in entrambi gli ordini con due connessioni e lock osservati.', flush=True)


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
    root = Path(tempfile.mkdtemp(prefix='pc-admission-test-'))
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
        run(cmd, input=data['environment'] + data['migration'] + 'BEGIN;\n' + data['tests'][0][1] + '\nROLLBACK;')
        print('OK: nuova migrazione e ' + data['tests'][0][0], flush=True)
        for name, sql in data['tests'][1:]:
            run(cmd, input=sql)
            print('OK:', name, flush=True)
        concurrency(cmd, env)
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
