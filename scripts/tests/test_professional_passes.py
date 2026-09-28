#!/usr/bin/env python3
"""Pacchetti: PostgreSQL isolato, storia completa, permessi e concorrenza. Nessun accesso online."""
import argparse
import json
import os
from pathlib import Path
import shutil
import selectors
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from test_supabase_audit_fixes import constant, TEST_HELPER_GRANTS

MIGRATION = '20260927170000_restore_professional_passes.sql'


def fixture(repo):
    tests = repo / 'scripts/tests'
    migrations = sorted((repo / 'supabase/migrations').glob('*.sql'))
    if not migrations or migrations[-1].name != MIGRATION:
        raise RuntimeError('Storia delle migrazioni cambiata: aggiornare il test.')
    bootstrap = constant(tests / 'test_continuity_migration.py', 'BOOTSTRAP')
    bootstrap += '\nALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint, ADD COLUMN allowed_mime_types text[];\n'
    regression = constant(tests / 'test_continuity_sharing.py', 'REGRESSION_TESTS')[1]
    return dict(bootstrap=bootstrap, migrations=[[p.name, p.read_text()] for p in migrations[:-1]],
                fixture=(tests / 'professional_passes_fixture.sql').read_text(), migration=migrations[-1].read_text(),
                tests=[['Pacchetti, storico, isolamento, scadenze, retry e cancellazioni',
                        (tests / 'professional_passes_assertions.sql').read_text()],
                       [regression[0], "DELETE FROM auth.users WHERE id::text LIKE 'd0000000-0000-0000-0000-%';\n" + TEST_HELPER_GRANTS + regression[1]]])


def concurrency(cmd, env, run):
    def uid(n):
        return "'d0000000-0000-0000-0000-" + str(n).zfill(12) + "'"
    actor = f"SET ROLE authenticated; SELECT set_config('request.jwt.claim.sub',{uid(1)},false);"
    run(cmd, input=actor + f"SELECT public.save_own_pass_template({uid(301)},0,{uid(101)},'Una lezione','',1,25,30);")

    def race(lock_sql, operations, expected_success, assertion):
        locker = subprocess.Popen([*map(str, cmd), '-Atq'], env=env, text=True,
                                  stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            # Suppress the locked-row result; one flushed marker and a bounded wait.
            locker.stdin.write('BEGIN; DO $$ BEGIN ' + lock_sql.replace('SELECT ', 'PERFORM ', 1) + "; END $$; SELECT 'READY';\n")
            locker.stdin.flush()
            with selectors.DefaultSelector() as selector:
                selector.register(locker.stdout, selectors.EVENT_READ)
                if not selector.select(timeout=10) or locker.stdout.readline().strip() != 'READY':
                    raise RuntimeError('Blocco di prova non disponibile entro 10 secondi.')
            with ThreadPoolExecutor(max_workers=2) as pool:
                futures = [pool.submit(subprocess.run, list(map(str, cmd)), env=env, text=True, capture_output=True,
                                       timeout=20, input=f"SET application_name='pc_pass_race_{i}';" + actor + sql)
                           for i, sql in enumerate(operations)]
                deadline = time.monotonic() + 6
                blocked = False
                while time.monotonic() < deadline:
                    result = run([*cmd, '-Atq'], input="SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE 'pc_pass_race_%' AND wait_event_type='Lock';")
                    if result.stdout.strip() == '2':
                        blocked = True
                        break
                    time.sleep(0.04)
                locker.stdin.write('COMMIT;\n\\q\n'); locker.stdin.flush()
                results = [future.result() for future in futures]
                if not blocked:
                    raise RuntimeError('Il test non ha osservato entrambe le connessioni in attesa: risultato non valido.')
            if sum(r.returncode == 0 for r in results) != expected_success:
                raise RuntimeError('Esito concorrente inatteso: ' + '\n'.join(r.stderr for r in results))
            # Assertions execute as the isolated database administrator.
            run(cmd, input="DO $$ BEGIN IF NOT (" + assertion + ") THEN RAISE EXCEPTION 'Concurrent invariant failed'; END IF; END $$;")
        finally:
            if locker.poll() is None:
                locker.terminate()
            locker.communicate(timeout=10)

    issue = f"SELECT public.issue_client_pass({uid(401)},{uid(301)},{uid(11)});"
    race(f'SELECT id FROM public.professionals WHERE id={uid(1)} FOR UPDATE', [issue, issue], 2,
         f"(SELECT count(*)=1 FROM public.client_passes WHERE id={uid(401)})")
    print('OK: assegnazione concorrente ripetuta, un solo pacchetto.', flush=True)
    run(cmd, input=f"UPDATE public.client_passes SET purchased_at=now()-interval '1 day' WHERE id={uid(401)};")
    use = f"SELECT public.record_pass_use({uid(501)},{uid(401)},{uid(201)});"
    lock = f'SELECT id FROM public.client_passes WHERE id={uid(401)} FOR UPDATE'
    race(lock, [use, use], 2, f"(SELECT remaining_uses=0 FROM public.client_passes WHERE id={uid(401)}) AND (SELECT count(*)=1 FROM public.pass_usage_events WHERE client_pass_id={uid(401)})")
    print('OK: doppio invio concorrente, una sola lezione scalata.', flush=True)
    reverse = f"SELECT public.reverse_pass_use({uid(502)},{uid(501)},'Correzione di prova');"
    race(lock, [reverse, reverse], 2, f"(SELECT remaining_uses=1 FROM public.client_passes WHERE id={uid(401)}) AND (SELECT count(*)=1 FROM public.pass_usage_events WHERE reversal_of={uid(501)})")
    print('OK: storno concorrente ripetuto, un solo credito restituito.', flush=True)
    uses = [f"SELECT public.record_pass_use({uid(n)},{uid(401)},null,(SELECT start_at FROM public.bookings WHERE id={uid(201)}),'Lezione concorrente');" for n in (503, 504)]
    race(lock, uses, 1, f"(SELECT remaining_uses=0 FROM public.client_passes WHERE id={uid(401)}) AND (SELECT count(*)=1 FROM public.pass_usage_events WHERE client_pass_id={uid(401)} AND kind='use' AND reversed_at IS NULL)")
    print('OK: due lezioni concorrenti sull’ultimo credito, solo una accettata.', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo', nargs='?', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--export-fixture', type=Path)
    args = parser.parse_args(); data = fixture(args.repo.expanduser().resolve())
    if args.export_fixture:
        args.export_fixture.write_text(json.dumps(data)); print('Fixture esportata:', args.export_fixture); return
    if os.geteuid() == 0:
        raise SystemExit('Esegui come Luigi, senza sudo.')
    candidates = list(Path('/usr/lib/postgresql').glob('*/bin/initdb'))
    if not candidates:
        raise SystemExit('PostgreSQL server non trovato. Nessuna modifica eseguita.')
    binaries = max(candidates, key=lambda p: int(p.parent.parent.name.split('.')[0])).parent
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}; env.update(LC_ALL='C', LANG='C')
    root = Path(tempfile.mkdtemp(prefix='pc-passes-test-')); sock = root / 'socket'; sock.mkdir(mode=0o700); started = False

    def run(command, **kwargs):
        result = subprocess.run([str(x) for x in command], env=env, text=True, capture_output=True, timeout=100, **kwargs)
        if result.returncode:
            raise RuntimeError(result.stderr or result.stdout)
        return result
    try:
        print('PostgreSQL temporaneo privato; nessuna porta TCP.', flush=True)
        run([binaries / 'initdb', '-D', root / 'data', '-U', 'pc_test_admin', '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8'])
        started = True
        run([binaries / 'pg_ctl', '-D', root / 'data', '-l', root / 'server.log', '-o', f"-k {sock} -p 55444 -c listen_addresses='' -c shared_buffers=16MB", '-w', 'start'])
        cmd = [binaries / 'psql', '-X', '-h', sock, '-p', '55444', '-U', 'pc_test_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
        run(cmd, input=data['bootstrap'])
        for _, sql in data['migrations']:
            run(cmd, input=sql)
        run(cmd, input=data['fixture'] + data['migration'])
        print(f"OK: {len(data['migrations']) + 1} migrazioni applicate senza riscritture.", flush=True)
        for name, sql in data['tests']:
            run(cmd, input=sql); print('OK:', name, flush=True)
        run(cmd, input=data['fixture'])
        concurrency(cmd, env, run)
        print('TEST SUPERATI. Auth/Storage simulati; servizi e database online non contattati.')
    finally:
        if started:
            run([binaries / 'pg_ctl', '-D', root / 'data', '-m', 'fast', '-w', 'stop'])
        shutil.rmtree(root)


if __name__ == '__main__':
    main()
