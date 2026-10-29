#!/usr/bin/env python3
"""Report installed backup tools without reading credentials or contacting a DB."""

from pathlib import Path
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


def main():
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
    print("Docker presente non significa motore avviato. Nessun backup ancora creato.")
    print("Puoi condividere questo output; non aggiungere password o stringhe di connessione.")


if __name__ == "__main__":
    main()
