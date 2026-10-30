#!/usr/bin/env python3
"""Report installed backup tools without reading credentials or contacting a DB."""

from pathlib import Path
import argparse
import os
import re
import shutil
import subprocess


def version(label, command):
    try:
        result = subprocess.run(
            [str(command), "--version"], capture_output=True, text=True,
            timeout=4, stdin=subprocess.DEVNULL,
        )
    except (OSError, subprocess.TimeoutExpired):
        print(f"{label}: versione non rilevabile")
        return
    # Only the version banner; never print stderr, paths or configuration files.
    lines = result.stdout.strip().splitlines()
    if result.returncode != 0 or not lines:
        print(f"{label}: comando presente, versione non rilevabile")
        return
    print(f"{label}: {lines[0][:160]}")
    if "pg_dump" in label:
        match = re.search(r"PostgreSQL\)\s+(\d+)", lines[0])
        if match and int(match.group(1)) < 17:
            print("  Questo client è troppo vecchio per esportare il server 17.6.")


def restore_environment():
    print('Controllo ambiente per ripristino isolato. Nessun database contattato o avviato.')
    print('Non legge backup, password, chiavi o configurazioni degli account.')
    root = Path('/usr/lib/postgresql/17/bin')
    for name in ('postgres', 'initdb', 'pg_ctl'):
        executable = root / name
        if executable.is_file() and os.access(executable, os.X_OK):
            version(name + ' (server 17)', executable)
        else:
            print(name + ' (server 17): non disponibile')
    extensions = Path('/usr/share/postgresql/17/extension')
    for name in ('plpgsql', 'pg_stat_statements', 'pgcrypto', 'uuid-ossp', 'supabase_vault'):
        present = (extensions / (name + '.control')).is_file()
        print('Estensione ' + name + ' (control PG17): ' + ('presente' if present else 'non disponibile'))
    try:
        print('Spazio libero nel filesystem WSL: ' + str(round(shutil.disk_usage(Path.home()).free / 1024 ** 3, 1)) + ' GiB')
    except OSError:
        print('Spazio libero: non rilevabile')
    try:
        memory = Path('/proc/meminfo').read_text()
        match = re.search(r'^MemAvailable:\s+(\d+)\s+kB$', memory, re.MULTILINE)
        if match:
            print('Memoria disponibile al momento: ' + str(round(int(match.group(1)) / 1024 ** 2, 1)) + ' GiB')
    except OSError:
        print('Memoria disponibile: non rilevabile')
    print('File presenti non significano estensioni caricabili: compatibilità e ripristino restano da provare.')
    print('Nessun software installato, nessuna modifica al sito o ai backup.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--restore', action='store_true', help='Controlla solo i prerequisiti locali per il ripristino')
    options = parser.parse_args()
    if options.restore:
        restore_environment()
        return
    print("Controllo locale in sola lettura. Nessuna connessione al database.")
    for name in ("pg_dump", "pg_restore", "psql", "gpg", "age", "docker", "node"):
        executable = shutil.which(name)
        if executable:
            version(name, executable)
        else:
            print(f"{name}: non trovato nel PATH")
    print("Supabase CLI: " + ("presente nel PATH (non eseguita)" if shutil.which("supabase")
                                else "non trovata nel PATH; npx non eseguito"))
    # Debian/Ubuntu may have newer clients installed outside PATH.
    for executable in sorted(Path("/usr/lib/postgresql").glob("*/bin/pg_dump")):
        version(f"pg_dump installato ({executable.parent.parent.name})", executable)
    print("Docker presente non significa motore avviato. Questo controllo non crea backup.")
    print("Puoi condividere questo output; non aggiungere password o stringhe di connessione.")


if __name__ == "__main__":
    main()
