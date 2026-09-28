#!/usr/bin/env python3
"""Test public invoker APIs, private implementations and data isolation.

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

MIGRATION = '20260928100000_private_api_boundary.sql'

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
    if not migrations or migrations[-1].name != MIGRATION:
        raise RuntimeError('Storia migrazioni cambiata: aggiornare il test prima di proseguire.')
    bootstrap = constant(tests / 'test_continuity_migration.py', 'BOOTSTRAP')
    bootstrap += '\nALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint, ADD COLUMN allowed_mime_types text[];\n'
    prior = []
    for migration in migrations[:-1]:
        sql = migration.read_text()
        if migration.name == '20260927131000_harden_client_privileges_and_rls.sql':
            sql = (tests / 'supabase_audit_environment.sql').read_text() + sql
            sql += TEST_HELPER_GRANTS + (tests / 'supabase_audit_assertions.sql').read_text()
        if migration.name == '20260927170000_restore_professional_passes.sql':
            sql = (tests / 'professional_passes_fixture.sql').read_text() + sql
        prior.append([migration.name, sql])
    regressions = constant(tests / 'test_continuity_sharing.py', 'REGRESSION_TESTS')
    sport_fixture = constant(tests / 'test_sport_search.py', 'FIXTURE')
    sport_fixture += """
INSERT INTO public.professional_search_modes(professional_id,show_companion,show_sport,migrated_from_legacy)
SELECT id,true,true,true FROM public.professionals
ON CONFLICT (professional_id) DO UPDATE SET show_companion=true,show_sport=true,migrated_from_legacy=true;
"""
    after = (tests / 'private_api_assertions.sql').read_text()
    if any(name == '20260927170000_restore_professional_passes.sql' for name,_ in prior):
        after += (tests / 'professional_passes_assertions.sql').read_text()
        after += "\nBEGIN; DELETE FROM auth.users WHERE id::text LIKE 'd0000000-%'; COMMIT;\n"
    after += (tests / 'private_api_lint_assertions.sql').read_text()
    return dict(bootstrap=bootstrap, migrations=prior,
                environment=(tests / 'private_api_before.sql').read_text(),
                migration=migrations[-1].read_text(),
                tests=[['Contratti API, dati pubblici, ruoli e regole linter', after],
                       *[[name,TEST_HELPER_GRANTS+sql] for name,sql in regressions],
                       ['Ricerca quotidiana e sport con ruoli reali',
                        TEST_HELPER_GRANTS+sport_fixture+(tests / 'sport_search_assertions.sql').read_text()]])


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
    root = Path(tempfile.mkdtemp(prefix='pc-private-api-test-'))
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
