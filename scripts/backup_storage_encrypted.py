#!/usr/bin/env python3
"""Local, read-only Storage export. Credentials and object names never enter logs."""
import base64
import getpass
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import ssl
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, HTTPSHandler, ProxyHandler, Request, build_opener

from backup_database_encrypted import PROJECT, BackupError, crypto_home, sha256, start_gpg, stop

BASE_URL = 'https://' + PROJECT + '.supabase.co/storage/v1'
PAGE_SIZE = 100
MAX_OBJECT = 16 * 1024 * 1024
MAX_TOTAL = 100 * 1024 * 1024
MAX_OBJECTS = 1000
MAX_FOLDERS = 1000
MAX_BUCKETS = 100
MAX_JSON = 2 * 1024 * 1024
MAX_SECONDS = 600


def key_headers(key):
    if re.fullmatch(r'sb_secret_[A-Za-z0-9_-]{20,200}', key):
        return {'apikey': key}
    # This is only a local type/project check. Supabase verifies the signature.
    try:
        parts = key.split('.')
        if len(parts) != 3 or len(key) > 4096 or not re.fullmatch(r'[A-Za-z0-9_.-]+', key):
            raise ValueError()
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + '=' * (-len(parts[1]) % 4)))
        if payload.get('role') != 'service_role' or payload.get('ref') != PROJECT:
            raise ValueError()
    except (ValueError, TypeError, AttributeError):
        raise BackupError('USE_SECRET_API_KEY_OR_PROJECT_SERVICE_ROLE_NOT_PUBLISHABLE') from None
    return {'apikey': key, 'Authorization': 'Bearer ' + key}


def leaf(value):
    if not isinstance(value, str) or not value or len(value.encode('utf-8')) > 1024:
        raise BackupError('UNSUPPORTED_STORAGE_NAME')
    if value in ('.', '..') or any(c in value for c in '/\\') or any(ord(c) < 32 or ord(c) == 127 for c in value):
        raise BackupError('UNSUPPORTED_STORAGE_NAME')
    return value


def json_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode('utf-8')


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise BackupError('STORAGE_REDIRECT_REFUSED')


class StorageClient:
    def __init__(self, key):
        self.headers = key_headers(key)
        self.deadline = time.monotonic() + MAX_SECONDS
        # No inherited proxy, cookie jar or credentials; public HTTPS CA validation.
        self.opener = build_opener(ProxyHandler({}), HTTPSHandler(context=ssl.create_default_context()), NoRedirect())

    def _request(self, method, route, payload=None, limit=MAX_JSON):
        # The only allowed POST is Supabase's read-only object listing endpoint.
        if not ((method == 'GET' and route == '/bucket') or
                (method == 'POST' and re.fullmatch(r'/object/list/[^/?#]+', route)) or
                (method == 'GET' and re.fullmatch(r'/object/[^/?#]+/[^?#]+', route))):
            raise BackupError('STORAGE_OPERATION_NOT_ALLOWED')
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise BackupError('STORAGE_TIME_LIMIT')
        headers = {**self.headers, 'User-Agent': 'PortaleCinofilo-Local-Backup/1',
                   'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'}
        body = None
        if payload is not None:
            headers['Content-Type'] = 'application/json'
            body = json_bytes(payload)
        request = Request(BASE_URL + route, data=body, headers=headers, method=method)
        try:
            with self.opener.open(request, timeout=min(20, remaining)) as response:
                if response.status != 200:
                    raise BackupError('STORAGE_UNEXPECTED_HTTP_STATUS')
                length = response.headers.get('Content-Length')
                if length is not None and (not length.isdigit() or int(length) > limit):
                    raise BackupError('STORAGE_RESPONSE_SIZE_LIMIT')
                if response.headers.get('Content-Encoding', 'identity') != 'identity':
                    raise BackupError('STORAGE_UNEXPECTED_ENCODING')
                chunks, size = [], 0
                while True:
                    if time.monotonic() >= self.deadline:
                        raise BackupError('STORAGE_TIME_LIMIT')
                    chunk = response.read1(min(65536, limit + 1 - size))
                    if not chunk:
                        break
                    chunks.append(chunk)
                    size += len(chunk)
                    if size > limit:
                        raise BackupError('STORAGE_RESPONSE_SIZE_LIMIT')
                if length is not None and int(length) != size:
                    raise BackupError('STORAGE_RESPONSE_TRUNCATED')
                return b''.join(chunks), response.headers
        except HTTPError as error:
            code = error.code
            error.close()
            if code in (401, 403):
                raise BackupError('STORAGE_KEY_REJECTED_OR_ACCESS_DENIED') from None
            if code == 429:
                raise BackupError('STORAGE_RATE_LIMIT_NO_AUTOMATIC_RETRY') from None
            raise BackupError('STORAGE_HTTP_ERROR_' + str(code)) from None
        except (URLError, TimeoutError, OSError):
            raise BackupError('STORAGE_NETWORK_OR_TLS_ERROR') from None

    def _json(self, method, route, payload=None):
        raw, _ = self._request(method, route, payload)
        try:
            return json.loads(raw)
        except (ValueError, UnicodeError):
            raise BackupError('STORAGE_INVALID_JSON') from None

    def inventory(self):
        buckets = self._json('GET', '/bucket')
        if not isinstance(buckets, list) or len(buckets) >= MAX_BUCKETS:
            raise BackupError('STORAGE_BUCKET_LIST_INVALID_OR_LIMIT_REACHED')
        objects, seen_buckets, total, folders = [], set(), 0, 0
        for bucket in buckets:
            if not isinstance(bucket, dict):
                raise BackupError('STORAGE_INVALID_BUCKET')
            bucket_id = leaf(bucket.get('id'))
            if bucket_id in seen_buckets:
                raise BackupError('STORAGE_DUPLICATE_BUCKET')
            if bucket.get('type', 'STANDARD') != 'STANDARD':
                raise BackupError('NON_STANDARD_BUCKET_REQUIRES_SEPARATE_BACKUP')
            seen_buckets.add(bucket_id)
            queue, seen_paths = [('', 0)], set()
            while queue:
                prefix, depth = queue.pop()
                folders += 1
                if folders > MAX_FOLDERS or depth > 32:
                    raise BackupError('STORAGE_FOLDER_LIMIT')
                offset = 0
                while True:
                    page = self._json('POST', '/object/list/' + quote(bucket_id, safe=''), {
                        'prefix': prefix, 'limit': PAGE_SIZE, 'offset': offset,
                        'sortBy': {'column': 'name', 'order': 'asc'},
                    })
                    if not isinstance(page, list) or len(page) > PAGE_SIZE:
                        raise BackupError('STORAGE_INVALID_OBJECT_LIST')
                    for item in page:
                        if not isinstance(item, dict):
                            raise BackupError('STORAGE_INVALID_OBJECT')
                        path = prefix + leaf(item.get('name'))
                        if path in seen_paths:
                            raise BackupError('STORAGE_DUPLICATE_PATH_OR_MOVING_INVENTORY')
                        seen_paths.add(path)
                        if 'id' not in item:
                            raise BackupError('STORAGE_OBJECT_ID_MISSING')
                        if item['id'] is None:
                            if item.get('metadata') is not None:
                                raise BackupError('STORAGE_AMBIGUOUS_FOLDER')
                            queue.append((path + '/', depth + 1))
                            continue
                        if not isinstance(item['id'], str) or not item['id']:
                            raise BackupError('STORAGE_OBJECT_ID_INVALID')
                        metadata = item.get('metadata')
                        size = metadata.get('size') if isinstance(metadata, dict) else None
                        if type(size) is not int or not 0 <= size <= MAX_OBJECT:
                            raise BackupError('STORAGE_OBJECT_SIZE_INVALID_OR_LIMIT_REACHED')
                        if not item.get('updated_at'):
                            raise BackupError('STORAGE_OBJECT_VERSION_MISSING')
                        total += size
                        if total > MAX_TOTAL or len(objects) >= MAX_OBJECTS:
                            raise BackupError('STORAGE_EXPORT_LIMIT_REACHED')
                        # Reads may change access time; exclude only that field.
                        record = {k: v for k, v in item.items() if k != 'last_accessed_at'}
                        objects.append({'bucket': bucket_id, 'path': path, 'object': record})
                    if len(page) < PAGE_SIZE:
                        break
                    offset += len(page)
        return {'buckets': sorted(buckets, key=lambda b: b['id']),
                'objects': sorted(objects, key=lambda o: (o['bucket'], o['path']))}

    def download(self, record):
        route = '/object/' + quote(record['bucket'], safe='') + '/' + '/'.join(
            quote(leaf(part), safe='') for part in record['path'].split('/'))
        expected = record['object']['metadata']
        raw, headers = self._request('GET', route, limit=MAX_OBJECT)
        if len(raw) != expected['size']:
            raise BackupError('STORAGE_OBJECT_SIZE_CHANGED')
        etag = expected.get('eTag') or expected.get('etag')
        if etag and str(etag).strip('"') != headers.get('ETag', '').strip('"'):
            raise BackupError('STORAGE_OBJECT_VERSION_CHANGED')
        return raw


def encrypt_verified(raw, output, home, phrase):
    """Plaintext stays in bounded memory; both encryption and decryption are checked."""
    partial = output.with_name(output.name + '.partial')
    process = None
    if output.exists():
        raise BackupError('OUTPUT_ALREADY_EXISTS')
    try:
        with partial.open('xb') as target:
            partial.chmod(0o600)
            process = start_gpg(home, phrase, ['--cipher-algo', 'AES256', '--compress-algo', 'none', '--symmetric'],
                                subprocess.PIPE, target, subprocess.DEVNULL)
            process.communicate(input=raw, timeout=60)
            if process.returncode:
                raise BackupError('STORAGE_ENCRYPTION_FAILED')
            target.flush()
            os.fsync(target.fileno())
        process = start_gpg(home, phrase, ['--decrypt', str(partial)],
                            subprocess.DEVNULL, subprocess.PIPE, subprocess.DEVNULL)
        decoded, _ = process.communicate(timeout=60)
        if process.returncode or len(decoded) != len(raw) or hashlib.sha256(decoded).digest() != hashlib.sha256(raw).digest():
            raise BackupError('STORAGE_DECRYPTION_OR_HASH_FAILED')
        partial.rename(output)
        return {'file': output.name, 'bytes': output.stat().st_size, 'sha256': sha256(output)}
    finally:
        stop(process)
        partial.unlink(missing_ok=True)


def export_storage(client, directory, home, phrase):
    marker = directory / 'INCOMPLETE.txt'
    marker.write_text('Storage export incomplete; do not treat as a usable backup.\n')
    started = datetime.now(timezone.utc).isoformat()
    before = client.inventory()
    files, records, total = [], [], 0
    for index, record in enumerate(before['objects'], 1):
        raw = client.download(record)
        name = 'object-' + str(index).zfill(6) + '.gpg'
        files.append(encrypt_verified(raw, directory / name, home, phrase))
        records.append({**record, 'encrypted_file': name, 'bytes': len(raw),
                        'sha256': hashlib.sha256(raw).hexdigest()})
        total += len(raw)
        print('File verificati: ' + str(index) + '/' + str(len(before['objects'])), flush=True)
    if json_bytes(client.inventory()) != json_bytes(before):
        raise BackupError('STORAGE_CHANGED_DURING_EXPORT_RETRY_WHEN_IDLE')
    inventory = {'format': 1, 'project': PROJECT, 'started_at': started,
                 'buckets': before['buckets'], 'objects': records}
    files.append(encrypt_verified(json_bytes(inventory), directory / 'inventory.json.gpg', home, phrase))
    manifest = {'format': 1, 'project': PROJECT, 'started_at': started,
                'completed_at': datetime.now(timezone.utc).isoformat(),
                'status': 'storage_export_verified_restore_pending', 'restore_status': 'not_tested',
                'database_snapshot_relation': 'separate_non_atomic_export',
                'buckets': len(before['buckets']), 'objects': len(records), 'plaintext_bytes': total,
                'files': files}
    # Atomic success marker is last; a failed export has no manifest.
    partial = directory / 'manifest.json.partial'
    with partial.open('xb') as target:
        target.write(json_bytes(manifest) + b'\n')
        target.flush()
        os.fsync(target.fileno())
    partial.rename(directory / 'manifest.json')
    marker.unlink()
    return manifest


def main():
    if os.geteuid() == 0 or not sys.stdin.isatty() or len(sys.argv) != 1:
        raise BackupError('RUN_IN_WSL_WITHOUT_SUDO_OR_ARGUMENTS')
    for name in ('gpg', 'gpgconf'):
        if not shutil.which(name):
            raise BackupError('GNUPG_REQUIRED')
    os.umask(0o077)
    print('Backup Storage PortaleCinofilo: download in sola lettura, cifratura locale.')
    print('Supabase > Settings > API Keys: Secret key (sb_secret_...) oppure service_role legacy.')
    print('Inseriscila solo qui. Nessuna chiave in chat, file, cronologia o variabili ambiente.')
    key = getpass.getpass('Secret API key del progetto (nascosta): ').strip()
    client = StorageClient(key)
    phrase = getpass.getpass('Frase di cifratura dal gestore password (almeno 16 caratteri): ')
    if len(phrase) < 16 or phrase == key:
        raise BackupError('USE_A_DISTINCT_ENCRYPTION_PHRASE_OF_AT_LEAST_16_CHARACTERS')
    if phrase != getpass.getpass('Ripeti la frase di cifratura: '):
        raise BackupError('ENCRYPTION_PHRASES_DO_NOT_MATCH')
    root = Path.home() / 'PortaleCinofilo-backups'
    if root.is_symlink():
        raise BackupError('BACKUP_ROOT_MUST_NOT_BE_SYMLINK')
    root.mkdir(mode=0o700, exist_ok=True)
    root.chmod(0o700)
    directory = Path(tempfile.mkdtemp(prefix='storage-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ-'), dir=root))
    print('Directory privata: ' + str(directory), flush=True)
    with crypto_home() as home:
        result = export_storage(client, directory, home, phrase)
    print('OK_STORAGE_EXPORT_VERIFIED')
    print('Oggetti: ' + str(result['objects']) + '. Byte: ' + str(result['plaintext_bytes']))
    print('Conserva tutti i file di questa directory insieme. Frase nel gestore password.')
    print('Restano seconda copia indipendente e ripristino isolato. In chat solo la riga OK.')


if __name__ == '__main__':
    try:
        main()
    except BackupError as error:
        print('BACKUP_STORAGE_NON_COMPLETATO: ' + str(error), file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print('BACKUP_STORAGE_NON_COMPLETATO: INTERRUPTED', file=sys.stderr)
        sys.exit(1)
    except Exception:
        # Never print URLs, keys, object paths, network bodies or raw tracebacks.
        print('BACKUP_STORAGE_NON_COMPLETATO: LOCAL_OR_PROCESS_ERROR', file=sys.stderr)
        sys.exit(1)
