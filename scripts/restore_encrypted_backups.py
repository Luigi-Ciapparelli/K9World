#!/usr/bin/env python3
"""Drill on encrypted local originals. No URLs, destinations or secrets on the command line."""
import getpass
import hashlib
import io
import json
import os
from pathlib import Path
import re
import resource
import stat
import subprocess
import sys
import tarfile
import tempfile
import uuid
import warnings

from backup_database_encrypted import BackupError, PROJECT, crypto_home, start_gpg, stop
from backup_storage_encrypted import leaf, MAX_OBJECT, MAX_OBJECTS, MAX_TOTAL
from verify_backup_copy import CopyError, decode_manifest, expected_files, MAX_MANIFEST

HERE = Path(__file__).resolve().parent
IMAGE = 'docker.io/supabase/postgres@sha256:4c39816ce8d9303a3aba1161c842929c73a40c7109a9ef1b644582478e31832e'
SOCKET = 'unix:///var/run/docker.sock'
MIB = 1024 ** 2
DB_LIMIT, ROLES_LIMIT, INDEX_LIMIT = 128*MIB, 4*MIB, 8*MIB
TAG = 'it.portalecinofilo.private-drill'
ENV = {'PATH': '/usr/bin:/bin', 'LC_ALL': 'C'}


class DrillError(Exception):
    """Messages are fixed public status codes only."""


def require(condition, code):
    if not condition:
        raise DrillError(code)


def private_dir(path):
    s = path.lstat()
    require(stat.S_ISDIR(s.st_mode) and s.st_uid == os.getuid() and not s.st_mode & 0o077,
            'DIRECTORY_ORIGINALE_NON_PRIVATA')


def read_regular(path, limit):
    # No symlinks, devices or FIFOs. Hash the same bytes that go into GnuPG.
    fd = os.open(path, os.O_RDONLY | os.O_NONBLOCK | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as f:
        s = os.fstat(f.fileno())
        require(stat.S_ISREG(s.st_mode) and s.st_uid == os.getuid() and not s.st_mode & 0o077
                and 0 < s.st_size <= limit, 'FILE_NON_PRIVATO_O_FUORI_LIMITE')
        data = f.read(s.st_size + 1)
        require(len(data) == s.st_size, 'FILE_MODIFICATO')
        return data


def select_set(root, kind):
    private_dir(root)
    prefix = 'storage-' if kind == 'Storage' else ''
    candidates = []
    for p in sorted(root.iterdir()):
        if not re.fullmatch(prefix + r'\d{8}T\d{6}Z-[A-Za-z0-9_-]+', p.name) or p.is_symlink() or not p.is_dir():
            continue
        private_dir(p)
        if not os.path.lexists(p / 'INCOMPLETE.txt') and (p / 'manifest.json').exists():
            candidates.append(p)
    require(candidates, 'COPIA_COMPLETA_ASSENTE_' + kind.upper())
    pos = 0
    if len(candidates) > 1:
        for i, p in enumerate(candidates, 1):
            print(f'{i}. {kind} UTC: {p.name.removeprefix(prefix).split("-")[0]} ({p.name})')
        choice = input('Numero della copia ' + kind + ' da provare: ').strip()
        require(choice.isascii() and choice.isdecimal() and 1 <= int(choice) <= len(candidates),
                'SCELTA_NON_VALIDA')
        pos = int(choice) - 1
    path = candidates[pos]
    manifest = decode_manifest(read_regular(path / 'manifest.json', MAX_MANIFEST))
    files = expected_files(manifest, kind)
    require({p.name for p in path.glob('*.gpg')} == set(files), 'ELENCO_CIFRATI_DIVERSO')
    print('Copia ' + kind + ': ' + path.name.removeprefix(prefix).split('-')[0] + ' UTC', flush=True)
    return path, manifest, files


def memory_file():
    return os.fdopen(os.memfd_create('pc-private-drill', os.MFD_CLOEXEC), 'w+b')


def decrypt(source, name, plain_cap, home, phrase, kind):
    folder, _, files = source
    raw = read_regular(folder / name, plain_cap + MIB)
    require(len(raw) == files[name]['bytes'] and hashlib.sha256(raw).hexdigest() == files[name]['sha256'],
            'HASH_CIFRATO_DIVERSO_' + kind)
    with memory_file() as inp, memory_file() as out:
        inp.write(raw)
        inp.seek(0)
        p = None
        try:
            p = start_gpg(home, phrase, ['--max-output', str(plain_cap), '--decrypt'],
                          inp, out, subprocess.DEVNULL)
            require(p.wait(timeout=120) == 0, 'DECIFRATURA_FALLITA_' + kind)
        finally:
            stop(p)
        require(out.tell() <= plain_cap, 'LIMITE_DECIFRATURA')
        out.seek(0)
        return out.read()


def tar_member(tar, name, data):
    item = tarfile.TarInfo(name)
    item.mode, item.size = 0o600, len(data)
    tar.addfile(item, io.BytesIO(data))


def add_storage(tar, storage, home, phrase, inventory_bytes=None):
    _, manifest, _ = storage
    require(manifest.get('format') == 1, 'FORMATO_STORAGE')
    idx = json.loads(inventory_bytes if inventory_bytes is not None else
                     decrypt(storage, 'inventory.json.gpg', INDEX_LIMIT, home, phrase, 'STORAGE'))
    require(idx.get('format') == 1 and idx.get('project') == PROJECT and idx.get('started_at') == manifest['started_at'],
            'INVENTARIO_STORAGE_NON_CORRISPONDE')
    buckets, objects = idx['buckets'], idx['objects']
    require(isinstance(buckets, list) and len(buckets) == manifest['buckets'] and len(buckets) < 100 and
            isinstance(objects, list) and len(objects) == manifest['objects'] <= MAX_OBJECTS, 'CONTEGGI_INVENTARIO')
    bucket_map, meta, names, sums, total = {}, [], set(), [], 0
    for b in buckets:
        bid = leaf(b['id'])
        require(bid not in bucket_map and b.get('type', 'STANDARD') == 'STANDARD'
                and type(b.get('public')) is bool, 'BUCKET_STORAGE_NON_VALIDO')
        bucket_map[bid] = b['public']
    for i, r in enumerate(objects, 1):
        bid, path, data_meta = r['bucket'], r['path'], r['object']
        parts = [leaf(part) for part in path.split('/')]
        require(bid in bucket_map and (bid, path) not in names and 1 <= len(parts) <= 33 and
                all(len(part.encode()) <= 255 for part in [bid, *parts]) and len(path.encode()) < 4096,
                'PERCORSO_STORAGE_NON_VALIDO')
        names.add((bid, path))
        name = f'object-{i:06d}.gpg'
        require(r['encrypted_file'] == name and type(r['bytes']) is int and 0 <= r['bytes'] <= MAX_OBJECT
                and isinstance(data_meta['id'], str) and data_meta['id'] and data_meta['name'] == parts[-1]
                and data_meta['metadata']['size'] == r['bytes'], 'METADATI_STORAGE_NON_VALIDI')
        total += r['bytes']
        require(total <= MAX_TOTAL, 'LIMITE_BYTE_STORAGE')
        data = decrypt(storage, name, MAX_OBJECT, home, phrase, 'STORAGE')
        h = hashlib.sha256(data).hexdigest()
        require(len(data) == r['bytes'] and h == r['sha256'], 'BYTE_STORAGE_DIVERSI_DALL_INVENTARIO')
        target = 'objects/' + bid + '/' + path
        tar_member(tar, target, data)
        sums.append(h + '  ' + target + '\n')
        info = data_meta['metadata']
        etag = info.get('eTag') or info.get('etag')
        meta.append(dict(bucket=bid, path=path, id=data_meta['id'], size=r['bytes'],
                         etag=etag.strip('"') if etag else None, updated=data_meta['updated_at']))
    require(total == manifest['plaintext_bytes'], 'TOTALE_BYTE_STORAGE_DIVERSO')
    tar_member(tar, 'object-hashes', ''.join(sums).encode())
    # JSON is data, never executable SQL or a shell argument. Bucket paths only come from checked leaves.
    tar_member(tar, 'storage-index.json', json.dumps({'buckets':bucket_map,'objects':meta}).encode())
    return len(objects), total


def pack(tar_stream, database, storage, db_phrase, st_phrase=None, *, ask_storage=None):
    require(database[1].get('client_major') == 17 and str(database[1].get('server_version','')).startswith('17.'),
            'VERSIONE_DATABASE_DIVERSA')
    with crypto_home() as home, tarfile.open(fileobj=tar_stream, mode='w') as tar:
        roles = decrypt(database, 'roles.sql.gpg', ROLES_LIMIT, home, db_phrase, 'DATABASE')
        # pg_dumpall creates the source bootstrap role. Preserve its OID-10 grantor and
        # every ALTER/GRANT. Skip precisely its CREATE, asserting the adjacent definition.
        pair = b'\nCREATE ROLE supabase_admin;\nALTER ROLE supabase_admin WITH '
        require(roles.count(pair) == 1 and re.search(rb'\nALTER ROLE supabase_admin WITH [^;\n]*\bSUPERUSER\b', roles),
                'DEFINIZIONE_RUOLO_BOOTSTRAP_NON_RICONOSCIUTA')
        tar_member(tar, 'roles.original', roles)
        tar_member(tar, 'roles.apply', roles.replace(pair, b'\nALTER ROLE supabase_admin WITH ', 1))
        tar_member(tar, 'db.dump', decrypt(database, 'database.dump.gpg', DB_LIMIT, home, db_phrase, 'DATABASE'))
        inventory = None
        if st_phrase is None:
            st_phrase = db_phrase
            try:
                inventory = decrypt(storage, 'inventory.json.gpg', INDEX_LIMIT, home, st_phrase, 'STORAGE')
            except DrillError as e:
                if str(e) != 'DECIFRATURA_FALLITA_STORAGE' or ask_storage is None:
                    raise
                st_phrase = ask_storage()
                require(bool(st_phrase), 'FRASE_STORAGE_NON_INSERITA')
        counts = add_storage(tar, storage, home, st_phrase, inventory)
    tar_stream.seek(0)
    return counts


def engine(config, interactive):
    args = ['/usr/bin/docker', '--config', str(config), '--host', SOCKET]
    for sudo in (False, True) if interactive else (False,):
        if sudo:
            require(subprocess.run(['/usr/bin/sudo','-v']).returncode == 0, 'PERMESSO_DOCKER_LOCALE')
        cmd = (['/usr/bin/sudo','-n'] if sudo else []) + args
        if subprocess.run(cmd + ['info','--format','{{.ServerVersion}}'], env=ENV, stdin=subprocess.DEVNULL,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15).returncode == 0:
            require(subprocess.run(cmd+['image','inspect',IMAGE], env=ENV, stdin=subprocess.DEVNULL,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15).returncode == 0,
                    'IMMAGINE_VERIFICATA_ASSENTE')
            return cmd
    raise DrillError('MOTORE_DOCKER_LOCALE_NON_DISPONIBILE')


def database_failure_code(fields):
    # The container processes SQL from a backup. Treat even its diagnostic channel
    # as untrusted. Never expose raw messages, SQLSTATEs chosen by callers, or names.
    if len(fields) != 8 or fields[0] != b'DR_DB':
        return None
    _, state, entry, kind, op, scope, owner, reason = fields
    allowed = (
        (state, b'UNKNOWN 42501 28000 28P01 42P01 42703 42704 42710 42883 42P07 42P16 42601 3F000 3D000 0A000 22023 23502 23503 23505 23514 25001 25006 2BP01 53100 53200 55000 55006 58P01 P0001 XX000'),
        (kind, b'OTHER EVENT_TRIGGER DEFAULT_ACL DATABASE_PROPERTIES TABLE_DATA FK_CONSTRAINT ROW_SECURITY SEQUENCE_SET MATERIALIZED_VIEW FOREIGN_TABLE SECURITY_LABEL ACL SCHEMA DATABASE FUNCTION PROCEDURE EXTENSION TABLE INDEX SEQUENCE TYPE POLICY CONSTRAINT PUBLICATION SUBSCRIPTION TRIGGER COMMENT VIEW CAST DOMAIN AGGREGATE FOREIGN BLOB'),
        (op, b'OTHER OWNER SESSION_AUTH CREATE ALTER DROP GRANT REVOKE COMMENT COPY SET SELECT REINDEX SECURITY'),
        (scope, b'OTHER PUBLIC AUTH STORAGE REALTIME VAULT EXTENSIONS PC_PRIVATE PG_CATALOG SUPABASE_MIGRATIONS SUPABASE_FUNCTIONS'),
        (owner, b'OTHER POSTGRES SUPABASE_ADMIN SUPABASE_AUTH_ADMIN SUPABASE_STORAGE_ADMIN SUPABASE_REALTIME_ADMIN AUTHENTICATOR SERVICE_ROLE PG_DATABASE_OWNER'),
        (reason, b'OTHER EVENT_OWNER PUBLICATION_OWNER SCHEMA_ACCESS PARAMETER_ACCESS ROLE_MEMBERSHIP OWNER_REQUIRED SUPERUSER_REQUIRED ACCESS_DENIED MISSING LOCALE'),
    )
    if not re.fullmatch(b'(?:0|[1-9][0-9]{0,7})', entry) or any(v not in choices.split() for v,choices in allowed):
        return None
    return b'_'.join([b'PROVA_DATABASE_PG'+state,b'TOC'+entry,kind,op,scope,owner,reason]).decode('ascii')


def isolated(cmd, tar_stream):
    token = uuid.uuid4().hex
    marker = TAG + '=' + token
    script = (HERE / 'restore_event_entries.sh').read_text() + '\n' + (HERE / 'restore_private_drill.sh').read_text()
    args = ['run','--rm','-i','--pull=never','--name','pc-private-drill-'+token,'--label',marker,
            '--network','none','--log-driver','none','--read-only','--no-healthcheck',
            '--cap-drop','ALL','--security-opt','no-new-privileges','--user','postgres',
            '--memory','1536m','--memory-swap','1536m','--pids-limit','96','--ulimit','core=0',
            '--shm-size','96m','--tmpfs','/tmp:rw,nosuid,nodev,noexec,mode=1777,size=1024m',
            '--entrypoint','/bin/busybox',IMAGE,'timeout','320','/bin/sh','-ceu',script,'pc-drill',
            (HERE / 'restore_database_error.awk').read_text()]
    try:
        r = subprocess.run(cmd + args, env=ENV, stdin=tar_stream, stdout=subprocess.PIPE,
                           stderr=subprocess.DEVNULL, timeout=360)
        result = r.stdout.strip()
        if r.returncode or result != b'DR_OK':
            # Never forward Docker/Postgres output, SQL, paths or values.
            stages = {b'INPUT', b'START', b'ROLES', b'DATABASE', b'EVENT_MEMBERSHIP', b'EVENT_PROFILE', b'EVENT_COMPARE', b'ROLE_COMPARE', b'DATA_COMPARE',
                      b'PRIVACY', b'STORAGE_FILES', b'STORAGE_CATALOG', b'STOP'}
            kinds = {b'ERROR', b'MISSING', b'PRIVILEGE', b'COLLATION', b'CONFIG', b'EXISTS', b'SPACE', b'FORMAT'}
            bits = result.split(b':')
            db_code = database_failure_code(bits)
            if db_code:
                raise DrillError(db_code)
            if len(bits) == 3 and bits[0] == b'DR_FAIL' and bits[1] in stages and bits[2] in kinds:
                raise DrillError('PROVA_' + bits[1].decode() + '_' + bits[2].decode())
            raise DrillError('PROCESSO_DOCKER_NON_COMPLETATO')
    finally:
        def remaining():
            p = subprocess.run(cmd+['ps','-aq','--no-trunc','--filter','label='+marker], env=ENV,
                               capture_output=True, stdin=subprocess.DEVNULL, timeout=15)
            require(p.returncode == 0, 'PULIZIA_CONTENITORE_DA_VERIFICARE')
            return p.stdout.split()
        for cid in remaining():
            require(re.fullmatch(b'[a-f0-9]{64}', cid), 'PULIZIA_CONTENITORE_DA_VERIFICARE')
            subprocess.run(cmd+['rm','-fv',cid.decode()], env=ENV, stdin=subprocess.DEVNULL,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
        require(not remaining(), 'PULIZIA_CONTENITORE_DA_VERIFICARE')


def main():
    require(os.geteuid() != 0 and sys.stdin.isatty() and len(sys.argv)==1 and
            'wsl2' in Path('/proc/sys/kernel/osrelease').read_text().lower(), 'USA_WSL2_SENZA_SUDO_O_ARGOMENTI')
    os.umask(0o077)
    resource.setrlimit(resource.RLIMIT_CORE, (0,0))
    warnings.simplefilter('error', getpass.GetPassWarning)
    root = Path.home() / 'PortaleCinofilo-backups'
    print('Prova locale sulle copie cifrate nel WSL. USB non necessaria; nessuna connessione a Supabase.')
    db, st = select_set(root,'Database'), select_set(root,'Storage')
    with tempfile.TemporaryDirectory(prefix='pc-dr-client-') as conf, memory_file() as bundle:
        cmd = engine(conf, True)
        dp = getpass.getpass('Frase salvata quando hai cifrato la copia DATABASE (non la password Supabase): ')
        def ask_storage():
            print('La frase del database non ha aperto l’inventario Storage. Usa la frase scelta per la copia dei file.')
            return getpass.getpass('Frase di cifratura della copia STORAGE: ')
        print('Controllo integrità e decifro in memoria…', flush=True)
        n, size = pack(bundle, db, st, dp, ask_storage=ask_storage)
        print('Database e Storage decifrati. Ripristino ruoli, database e file nel contenitore isolato…', flush=True)
        isolated(cmd, bundle)
    print('OK_RIPRISTINO_LOCALE_DATABASE_E_FILE')
    print(f'File Storage ricostruiti e confrontati: {n}; byte: {size}. Contenitore eliminato.')
    print('Non sono stati avviati i servizi online, Auth, SMTP, Edge o Storage HTTP.')


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('RIPRISTINO_NON_COMPLETATO: INTERROTTO', file=sys.stderr)
        sys.exit(130)
    except Exception as e:
        status = str(e) if isinstance(e,(DrillError,BackupError,CopyError)) and re.fullmatch('[A-Z0-9_]+',str(e)) else (
            'TIMEOUT' if isinstance(e,subprocess.TimeoutExpired) else 'INPUT_O_AMBIENTE_LOCALE')
        print('RIPRISTINO_NON_COMPLETATO: ' + status, file=sys.stderr)
        sys.exit(1)
