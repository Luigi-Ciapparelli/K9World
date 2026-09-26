#!/usr/bin/env python3
"""Full migration history + isolated sport search regression. No online credentials.

Run as a normal user with PostgreSQL installed, or export the same SQL fixture
for a PostgreSQL WASM runner using --export-fixture /tmp/sport-fixture.json.
"""
from pathlib import Path
import argparse
import ast
import json
import os
import shutil
import subprocess
import tempfile

MIGRATION = '20260926220000_separate_sport_search.sql'
FIXTURE = """
INSERT INTO auth.users(id,email,email_confirmed_at,raw_user_meta_data) VALUES
('c0000000-0000-0000-0000-000000000001','daily@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Ada Gestione","role":"professional","professional_type":"trainer"}'),
('c0000000-0000-0000-0000-000000000002','sport@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Bea Sport","role":"professional","professional_type":"trainer"}'),
('c0000000-0000-0000-0000-000000000003','both@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Zoe IGP","role":"professional","professional_type":"trainer"}'),
('c0000000-0000-0000-0000-000000000004','pending@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Pending","role":"professional","professional_type":"trainer"}'),
('c0000000-0000-0000-0000-000000000005','owner@example.invalid',now(),'{"pawconnect_onboarding_version":"1","full_name":"Owner","role":"owner"}');
UPDATE public.professionals SET approved=true,approval_status='approved',
  zone_text='Rimini',latitude=44,longitude=12,coverage_radius_km=10,rating=4
  WHERE id<>'c0000000-0000-0000-0000-000000000004';
UPDATE public.professionals SET zone_text='Milano',latitude=46,longitude=9
  WHERE id='c0000000-0000-0000-0000-000000000003';
INSERT INTO public.services(professional_id,service_type,name,price,duration_minutes)
  SELECT id,'trainer','Lezione',30,60 FROM public.professionals;
INSERT INTO public.services(professional_id,service_type,name,price,duration_minutes)
  VALUES('c0000000-0000-0000-0000-000000000002','sitter','Pet sitting',20,60);
INSERT INTO public.professional_credentials(professional_id,credential_type,title,discipline,
  achievement,verification_status,is_public,dog_name)
  VALUES('c0000000-0000-0000-0000-000000000002','sport_result','Titolo IGP','IGP','IGP3','verified',true,'Cane test'),
  ('c0000000-0000-0000-0000-000000000003','sport_result','Titolo IGP','IGP','IGP3','verified',true,'Cane test');
"""


def fixture(repo):
    # Reuse Auth/Storage SQL doubles, never an online schema dump or real user data.
    tree = ast.parse((repo / 'scripts/tests/test_continuity_migration.py').read_text())
    bootstrap = next(ast.literal_eval(node.value) for node in tree.body
                     if isinstance(node, ast.Assign)
                     and any(isinstance(t, ast.Name) and t.id == 'BOOTSTRAP' for t in node.targets))
    bootstrap += '\nALTER TABLE storage.buckets ADD COLUMN file_size_limit bigint, ADD COLUMN allowed_mime_types text[];\n'
    migrations = sorted((repo / 'supabase/migrations').glob('*.sql'))
    if not migrations or migrations[-1].name != MIGRATION:
        raise RuntimeError('La storia delle migrazioni è cambiata: aggiornare il test prima di proseguire.')
    return {
        'bootstrap': bootstrap,
        'migrations': [[p.name, p.read_text()] for p in migrations[:-1]],
        'fixture': FIXTURE,
        'migration': migrations[-1].read_text(),
        'assertions': (repo / 'scripts/tests/sport_search_assertions.sql').read_text(),
    }


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
        raise SystemExit('PostgreSQL server non trovato.')
    binaries = max(candidates, key=lambda p: int(p.parent.parent.name.split('.')[0])).parent
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    env.update(LC_ALL='C', LANG='C')
    root = Path(tempfile.mkdtemp(prefix='pc-sport-test-'))
    sock = root / 'socket'
    sock.mkdir(mode=0o700)
    started = False

    def run(command, **kwargs):
        result = subprocess.run([str(x) for x in command], env=env, text=True,
                                capture_output=True, timeout=90, **kwargs)
        if result.returncode:
            raise RuntimeError(result.stderr or result.stdout)
        return result

    try:
        run([binaries / 'initdb', '-D', root / 'data', '-U', 'pc_test_admin',
             '--auth-local=trust', '--auth-host=reject', '--no-locale', '--encoding=UTF8'])
        started = True
        run([binaries / 'pg_ctl', '-D', root / 'data', '-l', root / 'server.log',
             '-o', f"-k {sock} -p 55439 -c listen_addresses='' -c shared_buffers=16MB", '-w', 'start'])
        cmd = [binaries / 'psql', '-X', '-h', sock, '-p', '55439', '-U', 'pc_test_admin',
               '-d', 'postgres', '-v', 'ON_ERROR_STOP=1']
        run(cmd, input=data['bootstrap'])
        for name, sql in data['migrations']:
            run(cmd, input=sql)
            print('Migration:', name, flush=True)
        run(cmd, input=data['fixture'])
        run(cmd, input=data['migration'])
        run(cmd, input=data['assertions'])
        print('OK: storia completa, migrazione profili, visibilità, discipline, filtri e permessi.')
        print('Auth/Storage simulati. Nessun database online modificato.')
    finally:
        if started:
            result = subprocess.run([str(binaries / 'pg_ctl'), '-D', str(root / 'data'),
                '-m', 'fast', '-w', 'stop'], env=env, text=True, capture_output=True, timeout=40)
            if result.returncode:
                raise RuntimeError(f'Arresto da verificare; dati conservati in {root}: {result.stderr}')
        shutil.rmtree(root)


if __name__ == '__main__':
    main()
