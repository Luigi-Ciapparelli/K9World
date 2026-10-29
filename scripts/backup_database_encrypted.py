#!/usr/bin/env python3
"""Interactive, read-only database export for PortaleCinofilo. Never restores online."""
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from datetime import datetime, timezone

PROJECT = 'tyuptbiqqhkhfsikdaeq'
PG_BIN = Path('/usr/lib/postgresql/17/bin')
LIMIT = 240


class BackupError(Exception):
    pass


def clean_env():
    return {k: v for k, v in os.environ.items() if not k.startswith('PG')}


def stop(process):
    if process is not None and process.poll() is None:
        process.kill()
        process.wait(timeout=10)


@contextmanager
def crypto_home():
    with tempfile.TemporaryDirectory(prefix='pc-crypto-') as directory:
        home = Path(directory)
        home.chmod(0o700)
        try:
            yield home
        finally:
            # Only this temporary agent; never touches the user's normal keyring.
            subprocess.run(['gpgconf', '--homedir', str(home), '--kill', 'gpg-agent'],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=10)


def start_gpg(home, phrase, args, source, destination, errors):
    # Anonymous descriptor: the phrase never appears in argv, env or a file.
    read_fd, write_fd = os.pipe()
    try:
        raw = phrase.encode('utf-8')
        if not raw or len(raw) > 1024 or any(c in phrase for c in '\r\n\x00'):
            raise BackupError('INVALID_ENCRYPTION_PHRASE')
        os.write(write_fd, raw + b'\n')
        os.close(write_fd)
        write_fd = None
        return subprocess.Popen(
            ['gpg', '--no-options', '--homedir', str(home), '--batch',
             '--pinentry-mode', 'loopback', '--passphrase-fd', str(read_fd),
             '--no-symkey-cache', *args], stdin=source, stdout=destination,
            stderr=errors, pass_fds=(read_fd,))
    finally:
        os.close(read_fd)
        if write_fd is not None:
            os.close(write_fd)


def encrypt_command(command, env, home, phrase, output, logs):
    """Check BOTH producer and encryptor. Only ciphertext is written to output."""
    producer = encryptor = None
    partial = output.with_name(output.name + '.partial')
    try:
        with partial.open('xb') as encrypted, (logs / (output.name + '.log')).open('xb') as errors:
            producer = subprocess.Popen(command, env=env, stdin=subprocess.DEVNULL,
                                        stdout=subprocess.PIPE, stderr=errors)
            encryptor = start_gpg(home, phrase,
                                  ['--cipher-algo', 'AES256', '--compress-algo', 'none', '--symmetric'],
                                  producer.stdout, encrypted, errors)
            producer.stdout.close()
            source_status = producer.wait(timeout=LIMIT)
            crypto_status = encryptor.wait(timeout=LIMIT)
            if source_status or crypto_status:
                raise BackupError('EXPORT_OR_ENCRYPTION_FAILED')
            encrypted.flush()
            os.fsync(encrypted.fileno())
        if output.exists():
            raise BackupError('OUTPUT_ALREADY_EXISTS')
        partial.rename(output)
    finally:
        stop(producer)
        stop(encryptor)
        partial.unlink(missing_ok=True)


def verify_encrypted(path, home, phrase, logs, reader=None):
    """Fully decrypt; optionally parse the archive with pg_restore to /dev/null."""
    decryptor = consumer = None
    try:
        with (logs / (path.name + '.verify.log')).open('wb') as errors:
            decryptor = start_gpg(home, phrase, ['--decrypt', str(path)],
                                  subprocess.DEVNULL, subprocess.PIPE, errors)
            # A separate draining process makes the entire verification bounded.
            consumer = subprocess.Popen(reader or ['/bin/cat'], env=clean_env(), stdin=decryptor.stdout,
                                        stdout=subprocess.DEVNULL, stderr=errors)
            decryptor.stdout.close()
            reader_status = consumer.wait(timeout=LIMIT)
            crypto_status = decryptor.wait(timeout=LIMIT)
            if reader_status or crypto_status:
                raise BackupError('DECRYPTION_OR_ARCHIVE_CHECK_FAILED')
    finally:
        stop(decryptor)
        stop(consumer)


def sha256(path):
    with path.open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def pgpass_field(value):
    if any(c in value for c in '\r\n\x00'):
        raise BackupError('INVALID_DATABASE_PASSWORD')
    return value.replace('\\', '\\\\').replace(':', '\\:')


def checked_host(value):
    host = value.strip().lower()
    # Accept only the session pooler in the project's verified region.
    if not re.fullmatch(r'aws-\d+-eu-central-1\.pooler\.supabase\.com', host):
        raise BackupError('INVALID_HOST_USE_SESSION_POOLER_HOST_ONLY')
    return host


def main():
    if os.geteuid() == 0 or not sys.stdin.isatty() or len(sys.argv) != 1:
        raise BackupError('RUN_IN_WSL_WITHOUT_SUDO_OR_ARGUMENTS')
    for tool in ('psql', 'pg_dump', 'pg_dumpall', 'pg_restore'):
        executable = PG_BIN / tool
        result = subprocess.run([str(executable), '--version'], capture_output=True, timeout=5)
        if result.returncode or b'PostgreSQL) 17.' not in result.stdout:
            raise BackupError('POSTGRESQL_17_CLIENT_REQUIRED')
    for tool in ('gpg', 'gpgconf'):
        if not shutil.which(tool):
            raise BackupError('GNUPG_REQUIRED')
    ca = Path('/etc/ssl/certs/ca-certificates.crt')
    if not ca.is_file():
        raise BackupError('SYSTEM_CA_CERTIFICATES_REQUIRED')
    print('Backup database PortaleCinofilo. Solo lettura; nessun restore o acquisto.', flush=True)
    print('Supabase > Connect > Session pooler: copia soltanto il campo Host.')
    host = checked_host(input('Host: '))
    password = getpass.getpass('Password database Supabase (nascosta): ')
    if not password:
        raise BackupError('DATABASE_PASSWORD_REQUIRED')
    phrase = getpass.getpass('Nuova frase per cifrare la copia (almeno 16 caratteri): ')
    if len(phrase) < 16 or phrase == password:
        raise BackupError('USE_A_DISTINCT_ENCRYPTION_PHRASE_OF_AT_LEAST_16_CHARACTERS')
    if phrase != getpass.getpass('Ripeti la frase di cifratura: '):
        raise BackupError('ENCRYPTION_PHRASES_DO_NOT_MATCH')

    root = Path.home() / 'PortaleCinofilo-backups'
    if root.is_symlink():
        raise BackupError('BACKUP_DIRECTORY_MUST_NOT_BE_A_SYMLINK')
    root.mkdir(mode=0o700, exist_ok=True)
    if root.stat().st_uid != os.getuid() or root.stat().st_mode & 0o077:
        raise BackupError('BACKUP_DIRECTORY_REQUIRES_OWNER_ONLY_PERMISSIONS')
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    output = Path(tempfile.mkdtemp(prefix=stamp + '-', dir=root))
    logs = output / 'private-logs'
    logs.mkdir(mode=0o700)
    print('Directory privata:', output, flush=True)
    try:
        with tempfile.TemporaryDirectory(prefix='pc-db-auth-') as credentials, crypto_home() as home:
            passfile = Path(credentials) / 'pgpass'
            username = 'postgres.' + PROJECT
            passfile.write_text(':'.join(map(pgpass_field, [host, '5432', 'postgres', username, password])) + '\n')
            passfile.chmod(0o600)
            env = clean_env()
            env.update(PGHOST=host, PGPORT='5432', PGUSER=username, PGDATABASE='postgres',
                       PGPASSFILE=str(passfile), PGSSLMODE='verify-full', PGSSLROOTCERT=str(ca),
                       PGCONNECT_TIMEOUT='10', PGAPPNAME='PortaleCinofilo private backup',
                       PGOPTIONS='-c default_transaction_read_only=on -c statement_timeout=180000')
            sql = """SELECT json_build_object('version',current_setting('server_version'),
'version_num',current_setting('server_version_num')::int,'database',current_database(),
'vault_secrets_count',(SELECT count(*) FROM vault.secrets));"""
            with (logs / 'connection.log').open('wb') as errors:
                check = subprocess.run([str(PG_BIN / 'psql'), '-X', '-A', '-t', '-w', '-v',
                                        'ON_ERROR_STOP=1', '-c', sql], env=env,
                                       stdout=subprocess.PIPE, stderr=errors, timeout=30)
            if check.returncode:
                raise BackupError('DATABASE_CONNECTION_FAILED_CHECK_HOST_PASSWORD_AND_TLS')
            metadata = json.loads(check.stdout)
            if metadata['version_num'] // 10000 != 17 or metadata['database'] != 'postgres':
                raise BackupError('UNEXPECTED_DATABASE_VERSION')
            if metadata['vault_secrets_count']:
                raise BackupError('VAULT_RECOVERY_KEY_PLAN_REQUIRED')
            print('Connessione TLS verificata. Esportazione cifrata in corso...', flush=True)
            archive = output / 'database.dump.gpg'
            roles = output / 'roles.sql.gpg'
            encrypt_command([str(PG_BIN / 'pg_dump'), '-w', '--format=custom',
                             '--lock-wait-timeout=15s'], env, home, phrase, archive, logs)
            print('Archivio database creato. Esporto i ruoli senza password...', flush=True)
            encrypt_command([str(PG_BIN / 'pg_dumpall'), '-w', '--roles-only', '--no-role-passwords'],
                            env, home, phrase, roles, logs)
            print('Verifico decifratura completa e leggibilità archivio...', flush=True)
            verify_encrypted(archive, home, phrase, logs,
                             [str(PG_BIN / 'pg_restore'), '--exit-on-error', '--file=/dev/null'])
            verify_encrypted(roles, home, phrase, logs)
            manifest = {'project': PROJECT, 'started_at_utc': stamp,
                        'finished_at_utc': datetime.now(timezone.utc).isoformat(),
                        'server_version': metadata['version'], 'client_major': 17,
                        'state': 'database_export_verified_restore_pending',
                        'scope': 'native PostgreSQL database and roles without role passwords',
                        'excluded': ['Storage file bytes', 'Edge secrets and deployed code',
                                     'Auth/SMTP/platform configuration', 'Vault recovery key'],
                        'storage_status': 'not_backed_up', 'restore_status': 'not_tested',
                        'files': {p.name: {'bytes': p.stat().st_size, 'sha256': sha256(p)}
                                  for p in (archive, roles)}}
            (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
        print('OK_DATABASE_EXPORT_VERIFIED', flush=True)
        print('Copia cifrata:', output)
        print('Conserva la frase nel gestore password, separata dalla copia.')
        print('Restano copia indipendente, file Storage e ripristino isolato.')
        print('Non caricare copie o log su GitHub o nella chat; condividi soltanto la riga OK.')
    except BaseException:
        (output / 'INCOMPLETE.txt').write_text('Copia incompleta. Nessun ripristino verificato.\n')
        raise


if __name__ == '__main__':
    previous_umask = os.umask(0o077)
    try:
        main()
    except (BackupError, OSError, ValueError, subprocess.SubprocessError) as error:
        code = str(error) if isinstance(error, BackupError) else type(error).__name__
        print('BACKUP_NON_COMPLETATO:', code, file=sys.stderr)
        print('Il database online non è stato modificato. Non condividere password o log privati.', file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print('\nBACKUP_INTERROTTO. Non considerare completa la directory.', file=sys.stderr)
        sys.exit(130)
    finally:
        os.umask(previous_umask)
