#!/usr/bin/env python3
"""Synthetic encryption/failure checks; no network and no production credentials."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backup_database_encrypted import (BackupError, checked_host, clean_env, crypto_home,
                                       encrypt_command, pgpass_field, start_gpg, verify_encrypted)


def reject(action):
    try:
        action()
    except BackupError:
        return
    raise AssertionError('Operation should have failed')


def main():
    old_umask = os.umask(0o077)
    try:
        assert checked_host('aws-1-eu-central-1.pooler.supabase.com')
        for host in ('evil.example', 'aws-1-eu-central-1.pooler.supabase.com.evil.example',
                     'postgres://secret@host/db', 'aws-1-eu-central-1.pooler.supabase.com:6543'):
            reject(lambda: checked_host(host))
        assert pgpass_field('a:b\\c') == 'a\\:b\\\\c'
        reject(lambda: pgpass_field('a\nb'))
        os.environ['PGPASSWORD'] = 'synthetic-env-value'
        assert 'PGPASSWORD' not in clean_env()
        del os.environ['PGPASSWORD']
        with tempfile.TemporaryDirectory(prefix='pc-encryption-test-') as directory, crypto_home() as home:
            root = Path(directory)
            phrase = 'Synthetic test phrase only 2026'
            output = root / 'test.gpg'
            # Payload only originates here, never from a real database.
            producer = [sys.executable, '-c', "import sys; sys.stdout.buffer.write(b'synthetic-secret-' * 8192)"]
            encrypt_command(producer, clean_env(), home, phrase, output, root)
            assert b'synthetic-secret-' not in output.read_bytes()
            assert output.stat().st_mode & 0o077 == 0
            verify_encrypted(output, home, phrase, root)
            with (root / 'decode.log').open('wb') as errors:
                process = start_gpg(home, phrase, ['--decrypt', str(output)],
                                    subprocess.DEVNULL, subprocess.PIPE, errors)
                payload, _ = process.communicate(timeout=15)
                assert process.returncode == 0 and payload == b'synthetic-secret-' * 8192
            reject(lambda: verify_encrypted(output, home, 'Wrong synthetic phrase', root))
            bad = root / 'failed.gpg'
            reject(lambda: encrypt_command([sys.executable, '-c',
                   "import sys; sys.stdout.write('partial'); sys.exit(9)"], clean_env(), home, phrase, bad, root))
            assert not bad.exists() and not bad.with_name(bad.name + '.partial').exists()
            damaged = root / 'damaged.gpg'
            raw = bytearray(output.read_bytes()); raw[-15] ^= 1; damaged.write_bytes(raw)
            reject(lambda: verify_encrypted(damaged, home, phrase, root))
        print('OK: host limitato, password file escaping, isolamento PG, cifratura/decifratura, frase errata, dati alterati e produttore fallito.')
        print('Solo dati sintetici. Nessun collegamento o backup del progetto online.')
    finally:
        os.umask(old_umask)


if __name__ == '__main__':
    main()
