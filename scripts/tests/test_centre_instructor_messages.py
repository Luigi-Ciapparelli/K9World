#!/usr/bin/env python3
"""Test assigned-instructor messages, privacy, history and concurrency.

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

MIGRATION = '20261016110000_centre_instructor_messages.sql'

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
        ['Elenco, assegnazioni, isolamento, storico, recensioni ed export', (tests / 'centre_team_assertions.sql').read_text()],
        ['Sovrapposizioni, lezioni di gruppo, retry, RPC precedente e permessi', (tests / 'centre_calendar_assertions.sql').read_text()],
        ['Consenso account, revoche, scadenze e agenda limitata', (tests / 'centre_memberships_assertions.sql').read_text()],
        ['Assenze, isolamento, retry, revoca, assegnazioni e storico', (tests / 'instructor_time_off_assertions.sql').read_text()],
        ['Delega minima, completamento, versioni, revoca e autore', (tests / 'centre_lesson_permissions_assertions.sql').read_text()],
        ['Fasce orarie, confini, fuso italiano, isolamento, retry e giornate intere', (tests / 'instructor_hourly_time_off_assertions.sql').read_text()],
        ['Messaggi delegati, autori, isolamento, revoca, pagine ed export', (tests / 'centre_instructor_messages_assertions.sql').read_text()]])


def concurrency_cases(run, cmd, env):
    import time
    scalar=[*cmd,'-At']
    actor="SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);"
    person="SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);"
    def overlap(first, second, label, expected_error=None):
        process = subprocess.Popen([str(x) for x in cmd], env=env, text=True,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process.stdin.write(f"SET application_name='{label}'; BEGIN; {first} SELECT pg_sleep(2); COMMIT;")
        process.stdin.close(); process.stdin = None
        try:
            deadline = time.monotonic()+8
            while time.monotonic()<deadline:
                seen = run(scalar, input=f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{label}' AND wait_event='PgSleep');").stdout.strip()
                if seen == 't': break
                if process.poll() is not None: raise RuntimeError('Concurrency holder ended early')
                time.sleep(.03)
            else: raise RuntimeError('Concurrency lock holder not observed')
            try:
                run(cmd, input=second)
            except RuntimeError as error:
                if not expected_error or expected_error not in str(error): raise
            else:
                if expected_error: raise RuntimeError('Concurrent message unexpectedly accepted')
            out, err = process.communicate(timeout=10)
            if process.returncode: raise RuntimeError(err or out)
        finally:
            if process.poll() is None: process.kill(); process.communicate()

    def scalar_value(sql): return run(scalar,input=sql).stdout.strip().splitlines()[-1]
    for number,kind,send_first in [(80,'permission',False),(81,'permission',True),(82,'assignment',False),(83,'assignment',True),(84,'retry',True)]:
        booking=f'e8310000-0000-0000-0005-{number:012d}'
        request=f'e8310000-0000-0000-0010-{number:012d}'
        run(cmd,input=f"INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) VALUES('{booking}','e8310000-0000-0000-0000-000000000007','e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0001-000000000006',now()+interval '25 days',now()+interval '25 days 1 hour','pending');")
        run(cmd,input=actor+f"SELECT public.change_booking_status('{booking}','accepted');SELECT public.assign_booking_instructor_checked('{booking}','e8310000-0000-0000-0006-000000000020',NULL,true);")
        version=scalar_value("SELECT version FROM pc_private.centre_memberships WHERE id='e8310000-0000-0000-0007-000000000020';")
        run(cmd,input=actor+f"SELECT public.set_centre_message_permission('e8310000-0000-0000-0007-000000000020',true,'{version}');")
        version=scalar_value("SELECT version FROM pc_private.centre_memberships WHERE id='e8310000-0000-0000-0007-000000000020';")
        assignment=scalar_value(f"SELECT version FROM pc_private.booking_instructors WHERE booking_id='{booking}';")
        send=person+f"SELECT public.send_centre_lesson_message('{request}','{booking}','e8310000-0000-0000-0007-000000000020','{version}','{assignment}','Parallel response');"
        mutation=actor+(f"SELECT public.set_centre_message_permission('e8310000-0000-0000-0007-000000000020',false,'{version}');" if kind=='permission' else f"SELECT public.assign_booking_instructor_checked('{booking}',NULL,'{assignment}');")
        if kind=='retry': mutation=send
        overlap(send if send_first else mutation,mutation if send_first else send,'pc_message_'+str(number),None if send_first else 'Conversation permission unavailable')
        count=scalar_value(f"SELECT count(*) FROM public.booking_messages WHERE id='{request}';")
        if count!=('1' if send_first else '0'): raise RuntimeError('Unexpected concurrent message result')
        print('OK: messaggi concorrenti',kind,'invio-prima' if send_first else 'revoca-prima',flush=True)

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
    root = Path(tempfile.mkdtemp(prefix='pc-centre-memberships-test-'))
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
