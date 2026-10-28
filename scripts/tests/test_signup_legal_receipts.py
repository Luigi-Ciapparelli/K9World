#!/usr/bin/env python3
"""Private PostgreSQL: signup receipts, full migration history and admission regression."""
import argparse
import hashlib
import json
from pathlib import Path
from test_trainer_admission import fixture as admission_fixture, run_suite

MIGRATION = '20261028120000_private_signup_legal_receipts.sql'


def fixture(repo):
    migrations = sorted((repo / 'supabase/migrations').glob('*.sql'))
    if migrations[-1].name != MIGRATION:
        raise RuntimeError('New migration history: review this integration suite.')
    archive = repo / 'docs/legal/2026-10-21.1'
    manifest = json.loads((archive / 'manifest.json').read_text())
    migration = migrations[-1].read_text()
    for name, page in manifest['pages'].items():
        digest = hashlib.sha256((archive / (name + '.html')).read_bytes()).hexdigest()
        if digest != page['sha256'] or digest not in migration:
            raise RuntimeError('Legal document hash mismatch: ' + name)
    if manifest['version'] not in (repo / 'src/lib/legalNotices.ts').read_text():
        raise RuntimeError('Client notice version changed: review server catalogue.')
    data = admission_fixture(repo)
    # Preserve the admission fixture and test the next migration on the real
    # schema. No real account, email, Storage service or online database is used.
    data['migrations'].append(['trainer-admission', data['environment'] + data['migration']])
    data['environment'] = ''
    data['migration'] = migration
    data['tests'] = [
        ['Ricevute iniziali, falsificazioni, rollback, ruoli e cancellazione',
         (repo / 'scripts/tests/signup_legal_receipts_assertions.sql').read_text()],
        ['Regressione ammissione: identità, qualifica, isolamento e revoca',
         'BEGIN;\n' + (repo / 'scripts/tests/trainer_admission_assertions.sql').read_text() + '\nROLLBACK;'],
        ['Controllo strutturale in sola lettura, senza dati personali',
         (repo / 'scripts/audit/real_use_privacy_status.sql').read_text()],
    ]
    return data


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('repo', nargs='?', type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument('--export-fixture', type=Path)
    args = parser.parse_args()
    data = fixture(args.repo.resolve())
    if args.export_fixture:
        args.export_fixture.write_text(json.dumps(data))
        print('Fixture sintetica esportata; hash dei documenti verificati.')
        return
    run_suite(data)


if __name__ == '__main__':
    main()
