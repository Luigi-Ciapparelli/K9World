#!/usr/bin/env python3
"""Test explicit delegated agenda permission and concurrent revocation.

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

MIGRATION = '20261017093000_centre_agenda_delegation.sql'

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
        ['Messaggi delegati, autori, isolamento, revoca, pagine ed export', (tests / 'centre_instructor_messages_assertions.sql').read_text()],
        ['Note attribuite, consenso autore, revoche, isolamento e archivio', (tests / 'centre_lesson_notes_assertions.sql').read_text()],
        ['Turni, confini, assenze, permessi, versioni e ora italiana', (tests / 'instructor_weekly_shifts_assertions.sql').read_text()],
        ['Coordinamento, isolamento, revoca, attribuzione e limiti', (tests / 'centre_agenda_delegation_assertions.sql').read_text()]])


def concurrency_cases(run, cmd, env):
    import time
    scalar=[*cmd,'-At']
    actor="SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000006',false);"
    instructor='e8310000-0000-0000-0006-000000000020'
    def value(sql): return run(scalar,input=sql).stdout.strip().splitlines()[-1]
    def overlap(first, second, label, expected_error=None):
        process = subprocess.Popen([str(x) for x in cmd], env=env, text=True,
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        process.stdin.write(f"SET application_name='{label}'; BEGIN; {first} SELECT pg_sleep(2); COMMIT;")
        process.stdin.close(); process.stdin = None
        try:
            deadline = time.monotonic() + 8
            while time.monotonic() < deadline:
                seen = value(f"SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='{label}' AND wait_event='PgSleep');")
                if seen == 't': break
                if process.poll() is not None: raise RuntimeError('Concurrency holder ended early')
                time.sleep(.03)
            else: raise RuntimeError('Concurrency lock holder not observed')
            try: run(cmd, input=second)
            except RuntimeError as error:
                if not expected_error or expected_error not in str(error): raise
            else:
                if expected_error: raise RuntimeError('Concurrent operation unexpectedly accepted')
            out, err = process.communicate(timeout=10)
            if process.returncode: raise RuntimeError(err or out)
        finally:
            if process.poll() is None: process.kill(); process.communicate()

    person="SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);"
    member='e8310000-0000-0000-0007-000000000020'
    other='e8310000-0000-0000-0006-000000000030'
    for number,kind,write_first in [(801,'revocation',True),(802,'revocation',False),(803,'own_assignment',True),(804,'own_assignment',False),(805,'retry',True),(806,'conflict',True)]:
        booking=f'e8310000-0000-0000-0005-{number:012d}'
        run(cmd,input=f"INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) VALUES('{booking}','e8310000-0000-0000-0000-000000000007','e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0001-000000000006',now()+interval '70 days'+interval '{number} hours',now()+interval '70 days'+interval '{number+1} hours','pending');")
        run(cmd,input=actor+f"SELECT public.change_booking_status('{booking}','accepted');")
        version=value(f"SELECT version FROM pc_private.centre_memberships WHERE id='{member}';")
        run(cmd,input=actor+f"SELECT public.set_centre_agenda_permission('{member}',true,'{version}');")
        version=value(f"SELECT version FROM pc_private.centre_memberships WHERE id='{member}';")
        send=person+f"SELECT public.assign_delegated_centre_instructor('{member}','{version}','{booking}','{other}',NULL,false);"
        if kind=='revocation':
            change=actor+f"SELECT public.set_centre_agenda_permission('{member}',false,'{version}');"
            overlap(send if write_first else change,change if write_first else send,'pc_agenda_'+str(number),None if write_first else 'Agenda permission unavailable')
            count=value(f"SELECT count(*) FROM pc_private.centre_agenda_actions WHERE booking_id='{booking}';")
            if count!=('1' if write_first else '0'): raise RuntimeError('Revocation ordering failed')
        elif kind=='own_assignment':
            change=actor+f"SELECT public.assign_booking_instructor_checked('{booking}','{instructor}',NULL,true);"
            overlap(send if write_first else change,change if write_first else send,'pc_agenda_'+str(number),'Assegnazione cambiata' if write_first else 'Own lessons require the centre')
            wanted=other if write_first else instructor
            if value(f"SELECT instructor_id FROM pc_private.booking_instructors WHERE booking_id='{booking}';")!=wanted: raise RuntimeError('Assignment lost during concurrent edit')
        elif kind=='retry':
            overlap(send,send,'pc_agenda_'+str(number))
            if value(f"SELECT count(*) FROM pc_private.centre_agenda_actions WHERE booking_id='{booking}';")!='1': raise RuntimeError('Concurrent retry duplicated audit')
        else:
            second=person+f"SELECT public.assign_delegated_centre_instructor('{member}','{version}','{booking}',NULL,NULL,false);"
            overlap(send,second,'pc_agenda_'+str(number),'Assegnazione cambiata')
            if value(f"SELECT instructor_id FROM pc_private.booking_instructors WHERE booking_id='{booking}';")!=other: raise RuntimeError('Stale assignment overwrote previous edit')
        print('OK: coordinamento concorrente',kind,'scrittura-prima' if write_first else 'revoca-prima',flush=True)


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
    root = Path(tempfile.mkdtemp(prefix='pc-agenda-delegation-test-'))
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
