#!/usr/bin/env python3
"""Release the reviewed trainer admission change: database, then frontend.

Default: read-only preflight. --publish applies the one expected migration and
pushes this checkout to main without force. No account or archive is deleted.
"""
import argparse
from pathlib import Path
import re
import subprocess
import sys

PROJECT = 'tyuptbiqqhkhfsikdaeq'
MIGRATION = '20261021100000_verified_trainer_admission.sql'
BRANCH = 'codex/professional-admission-20261021'
CLI = ['npx', '--yes', 'supabase@2.118.0']
REPO = Path(__file__).resolve().parents[1]


def run(args, capture=False, timeout=90):
    print('> ' + ' '.join(args), flush=True)
    result = subprocess.run(args, cwd=REPO, text=True,
                            stdout=subprocess.PIPE if capture else None,
                            stderr=subprocess.STDOUT if capture else None, timeout=timeout)
    if result.returncode:
        if capture:
            print(result.stdout)
        raise RuntimeError('Comando interrotto: nessun passo successivo eseguito.')
    return result.stdout.strip() if capture else ''


def pending_migrations(output):
    clean = re.sub(r'\x1b\[[0-9;]*[A-Za-z]', '', output)
    return re.findall(r'^\s*[•*-]\s*(\d{14}_[A-Za-z0-9_]+\.sql)\s*$', clean, re.M)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    if run(['git', 'branch', '--show-current'], True) != BRANCH:
        raise RuntimeError('Apri prima il branch ' + BRANCH + '. Non cambio branch automaticamente.')
    dirty = run(['git', 'status', '--porcelain', '--untracked-files=no'], True)
    if any(line.strip() and not line.endswith('supabase/.temp/cli-latest') for line in dirty.splitlines()):
        raise RuntimeError('Ci sono modifiche locali tracciate: conservale prima del rilascio.')
    # Do not push newly introduced, uncommitted migrations.
    if run(['git', 'ls-files', '--others', '--exclude-standard', 'supabase/migrations'], True):
        raise RuntimeError('Migration non versionate presenti: rivedere il rilascio.')
    link = REPO / 'supabase/.temp/project-ref'
    if not link.is_file() or link.read_text().strip() != PROJECT:
        raise RuntimeError('Il repository non risulta collegato al progetto Supabase atteso.')
    run(['git', 'fetch', 'origin'])
    run(['git', 'merge-base', '--is-ancestor', 'origin/main', 'HEAD'])
    if run(['git', 'rev-parse', 'HEAD'], True) != run(['git', 'rev-parse', 'origin/' + BRANCH], True):
        raise RuntimeError('Il checkout differisce dal branch revisionato su GitHub.')
    output = run(CLI + ['db', 'push', '--dry-run'], True)
    print(output)
    pending = pending_migrations(output)
    if pending != [MIGRATION]:
        if pending or 'up to date' not in output.lower():
            raise RuntimeError('Il piano remoto non contiene soltanto la migration attesa. Nessuna applicazione eseguita.')
    print('Effetto: i profili che offrono addestramento tornano in attesa di verifica. Account, prenotazioni e archivi restano conservati.', flush=True)
    if not args.publish:
        print('Preflight completato. Nessuna modifica online. Per rilasciare: stesso comando con --publish.')
        return
    if pending:
        run(CLI + ['db', 'push', '--yes'])
    # A concurrent main update makes this ordinary push fail; never force it.
    run(['git', 'push', 'origin', 'HEAD:main'])
    print('Database aggiornato e codice pubblicato su main. Attendi Vercel Ready: poi riesamina i profili da approvare.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, subprocess.TimeoutExpired) as exc:
        print('Rilascio fermato:', str(exc), file=sys.stderr)
        print('Se il database è già aggiornato, i suoi controlli restano attivi. Non disattivarli; completa il rilascio frontend dopo aver risolto il blocco.', file=sys.stderr)
        raise SystemExit(1)
