#!/usr/bin/env python3
"""Test explicit centre lesson-completion permission and actor audit.

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

MIGRATION = '20261014210000_centre_lesson_completion_permissions.sql'

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
        ['Delega minima, completamento, versioni, revoca e autore', (tests / 'centre_lesson_permissions_assertions.sql').read_text()]])


def concurrency_cases(run, cmd, env):
    import time
    centre = 'e8310000-0000-0000-0000-000000000006'
    member = 'e8310000-0000-0000-0006-000000000002'
    booking = 'e8310000-0000-0000-0005-000000000003'
    scalar = [*cmd, '-At']
    actor = f"SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','{centre}',false);"
    def member_write(active):
        return actor + f"SELECT public.save_centre_instructor('{member}',m->>'display_name',{str(active).lower()},(m->>'version')::uuid) FROM jsonb_array_elements(public.get_my_centre_team()->'members') m WHERE m->>'id'='{member}';"
    assign = actor + f"SELECT public.assign_booking_instructor('{booking}','{member}');"
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
                if expected_error: raise RuntimeError('Concurrent inactive assignment unexpectedly accepted')
            out, err = process.communicate(timeout=10)
            if process.returncode: raise RuntimeError(err or out)
        finally:
            if process.poll() is None: process.kill(); process.communicate()
    overlap(member_write(False), assign, 'pc_team_inactive_first', 'Scegli un istruttore attivo')
    run(cmd, input=member_write(True))
    overlap(assign, member_write(False), 'pc_team_assignment_first')
    result=run(scalar,input=f"SELECT (a.name_at_assignment='Istruttore Due' AND NOT i.active)::text FROM pc_private.booking_instructors a JOIN pc_private.centre_instructors i ON i.id=a.instructor_id WHERE a.booking_id='{booking}';").stdout.strip()
    if result!='true': raise RuntimeError('Assignment snapshot lost after concurrent deactivation')
    print('OK: due ordini concorrenti assegnazione/disattivazione su connessioni separate.', flush=True)
    run(cmd,input="INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) SELECT ('e8310000-0000-0000-0005-'||lpad(n::text,12,'0'))::uuid,'e8310000-0000-0000-0000-000000000007','e8310000-0000-0000-0000-000000000006','e8310000-0000-0000-0001-000000000006',now()+interval '1 day',now()+interval '1 day 1 hour','pending' FROM generate_series(8,9) n;")
    run(cmd,input=member_write(True))
    run(cmd,input=actor+"SELECT public.change_booking_status(id,'accepted') FROM public.bookings WHERE id IN ('e8310000-0000-0000-0005-000000000008','e8310000-0000-0000-0005-000000000009');")
    first=actor+f"SELECT public.assign_booking_instructor_checked('e8310000-0000-0000-0005-000000000008','{member}');"
    second=actor+f"SELECT public.assign_booking_instructor_checked('e8310000-0000-0000-0005-000000000009','{member}');"
    overlap(first,second,'pc_team_parallel_lessons','Istruttore già assegnato')
    count=run(scalar,input="SELECT count(*) FROM pc_private.booking_instructors WHERE booking_id IN ('e8310000-0000-0000-0005-000000000008','e8310000-0000-0000-0005-000000000009');").stdout.strip()
    if count!='1': raise RuntimeError('Parallel assignment escaped overlap check')
    print('OK: due assegnazioni simultanee sovrapposte; la seconda richiede conferma.',flush=True)
    person = "SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000001',false);"
    instructor = 'e8310000-0000-0000-0006-000000000010'
    code=run(scalar,input=person+"SELECT public.get_centre_link_code()->>'code';").stdout.strip().splitlines()[-1]
    roster_version=run(scalar,input=f"SELECT version FROM pc_private.centre_instructors WHERE id='{instructor}';").stdout.strip()
    for number,first_action in [(3,'accept'),(4,'revoke')]:
        membership=f'e8310000-0000-0000-0007-{number:012d}'
        run(cmd,input=actor+f"SELECT public.invite_centre_account('{membership}','{instructor}','{code}','{roster_version}');")
        revision=run(scalar,input=f"SELECT version FROM pc_private.centre_memberships WHERE id='{membership}';").stdout.strip()
        accept=person+f"SELECT public.change_centre_membership('{membership}','accept','{revision}');"
        revoke=actor+f"SELECT public.change_centre_membership('{membership}','revoke','{revision}');"
        overlap(accept if first_action=='accept' else revoke,revoke if first_action=='accept' else accept,
            'pc_membership_'+first_action+'_first','Collegamento cambiato')
        if first_action=='accept':
            revision=run(scalar,input=f"SELECT version FROM pc_private.centre_memberships WHERE id='{membership}';").stdout.strip()
            run(cmd,input=actor+f"SELECT public.change_centre_membership('{membership}','revoke','{revision}');")
        status=run(scalar,input=f"SELECT status FROM pc_private.centre_memberships WHERE id='{membership}';").stdout.strip()
        if status!='revoked': raise RuntimeError('Concurrent consent/revocation revived access')
        count=run(scalar,input=person+"SELECT jsonb_array_length(public.get_my_centre_lessons(now(),now()+interval '10 days')->'items');").stdout.strip().splitlines()[-1]
        if count!='0': raise RuntimeError('Revoked account still sees delegated agenda')
    print('OK: accettazione/revoca in entrambi gli ordini; versioni e rimozione accesso.',flush=True)
    # Absence and assignment both serialize on the centre, with either ordering.
    run(cmd,input=actor+f"SELECT public.assign_booking_instructor_checked('e8310000-0000-0000-0005-000000000011',NULL,(SELECT (a->>'version')::uuid FROM jsonb_array_elements(public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000011']::uuid[])) a));")
    assignment=actor+f"SELECT public.assign_booking_instructor_checked('e8310000-0000-0000-0005-000000000011','{instructor}',(SELECT (a->>'version')::uuid FROM jsonb_array_elements(public.get_booking_instructors(ARRAY['e8310000-0000-0000-0005-000000000011']::uuid[])) a));"
    for n,absence_first in [(10,True),(11,False)]:
        period=f'e8310000-0000-0000-0009-{n:012d}'
        absence=actor+f"SELECT public.add_instructor_time_off('{period}','{instructor}',(now() AT TIME ZONE 'Europe/Rome')::date,(now() AT TIME ZONE 'Europe/Rome')::date+2);"
        overlap(absence if absence_first else assignment,assignment if absence_first else absence,'pc_absence_'+str(n),'Istruttore indisponibile' if absence_first else None)
        count=run(scalar,input=actor+f"SELECT (x->>'affected_bookings') FROM jsonb_array_elements(public.get_instructor_time_off('{instructor}',current_date-1,current_date+7)) x WHERE x->>'id'='{period}';").stdout.strip().splitlines()[-1]
        if count!=('1' if absence_first else '2'): raise RuntimeError('Absence did not preserve/count prior assignments')
        version=run(scalar,input=f"SELECT version FROM pc_private.instructor_time_off WHERE id='{period}';").stdout.strip()
        run(cmd,input=actor+f"SELECT public.cancel_instructor_time_off('{period}','{version}');")
    print('OK: assenza/assegnazione concorrenti in entrambi gli ordini.',flush=True)
    # Four narrow permission/reassignment races, all serialized by the centre lock.
    member20='e8310000-0000-0000-0006-000000000020'
    membership20='e8310000-0000-0000-0007-000000000020'
    delegate="SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','e8310000-0000-0000-0000-000000000004',false);"
    for n,operation,completion_first in [(30,'permission',False),(31,'permission',True),(32,'assignment',False),(33,'assignment',True)]:
        booking20=f'e8310000-0000-0000-0005-{n:012d}'
        run(cmd,input=f"INSERT INTO public.bookings(id,owner_id,professional_id,service_id,start_at,end_at,status) VALUES('{booking20}','e8310000-0000-0000-0000-000000000007','{centre}','e8310000-0000-0000-0001-000000000006',now()-interval '90 minutes',now()-interval '30 minutes','pending');")
        run(cmd,input=actor+f"SELECT public.change_booking_status('{booking20}','accepted');SELECT public.assign_booking_instructor_checked('{booking20}','{member20}',NULL,true);")
        ver=run(scalar,input=f"SELECT version FROM pc_private.centre_memberships WHERE id='{membership20}';").stdout.strip()
        run(cmd,input=actor+f"SELECT public.set_centre_lesson_permission('{membership20}',true,'{ver}');")
        ver=run(scalar,input=f"SELECT version FROM pc_private.centre_memberships WHERE id='{membership20}';").stdout.strip()
        aver=run(scalar,input=f"SELECT version FROM pc_private.booking_instructors WHERE booking_id='{booking20}';").stdout.strip()
        complete=delegate+f"SELECT public.complete_assigned_centre_lesson('{booking20}','{membership20}','{ver}','{aver}');"
        rival=actor+(f"SELECT public.set_centre_lesson_permission('{membership20}',false,'{ver}');" if operation=='permission' else f"SELECT public.assign_booking_instructor_checked('{booking20}',NULL,'{aver}');")
        expected=None if completion_first and operation=='permission' else 'L’istruttore si assegna' if completion_first else 'Lesson permission unavailable' if operation=='permission' else 'Lesson no longer assigned'
        overlap(complete if completion_first else rival,rival if completion_first else complete,'pc_complete_'+str(n),expected)
        result=run(scalar,input=f"SELECT status FROM public.bookings WHERE id='{booking20}';").stdout.strip()
        if result!=('completed' if completion_first else 'accepted'): raise RuntimeError('Concurrent completion escaped authorization')
        count=run(scalar,input=f"SELECT count(*) FROM pc_private.centre_lesson_completions WHERE booking_id='{booking20}';").stdout.strip()
        if count!=('1' if completion_first else '0'): raise RuntimeError('Concurrent completion audit incorrect')
    print('OK: completamento/revoca permesso e completamento/riassegnazione in entrambi gli ordini.',flush=True)




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
