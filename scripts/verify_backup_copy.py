#!/usr/bin/env python3
"""Compare encrypted backup copies to their local originals. No writes/network/decryption."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys

PROJECT = 'tyuptbiqqhkhfsikdaeq'
MAX_MANIFEST = 2 * 1024 * 1024
MAX_FILE = 16 * 1024 ** 3
FILE_NAME = re.compile(r'(database\.dump|roles\.sql|inventory\.json|object-[0-9]{6})\.gpg')


class CopyError(Exception):
    pass


def regular(path, maximum):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > maximum:
        raise CopyError('INVALID_OR_OVERSIZED_FILE')
    return info


def digest(path):
    before = regular(path, MAX_FILE)
    with path.open('rb') as stream:
        value = hashlib.file_digest(stream, 'sha256').hexdigest()
    after = path.lstat()
    if (before.st_size, before.st_mtime_ns, before.st_ino) != (after.st_size, after.st_mtime_ns, after.st_ino):
        raise CopyError('FILE_CHANGED_DURING_CHECK')
    return {'bytes': before.st_size, 'sha256': value}


def decode_manifest(raw):
    if len(raw) > MAX_MANIFEST:
        raise CopyError('MANIFEST_TOO_LARGE')
    try:
        result = json.loads(raw)
        if not isinstance(result, dict) or result.get('project') != PROJECT:
            raise ValueError()
        return result
    except (ValueError, UnicodeError):
        raise CopyError('INVALID_MANIFEST_OR_PROJECT') from None


def expected_files(manifest, kind):
    if kind == 'Database':
        if manifest.get('state') != 'database_export_verified_restore_pending':
            raise CopyError('DATABASE_EXPORT_NOT_VERIFIED')
        files = manifest.get('files')
        names = {'database.dump.gpg', 'roles.sql.gpg'}
    else:
        if manifest.get('status') != 'storage_export_verified_restore_pending':
            raise CopyError('STORAGE_EXPORT_NOT_VERIFIED')
        count = manifest.get('objects')
        rows = manifest.get('files')
        if type(count) is not int or not 0 <= count <= 1000 or not isinstance(rows, list):
            raise CopyError('INVALID_STORAGE_INVENTORY')
        files = {}
        for row in rows:
            if not isinstance(row, dict) or not isinstance(row.get('file'), str) or row['file'] in files:
                raise CopyError('INVALID_OR_DUPLICATE_STORAGE_FILE')
            files[row['file']] = {k: row.get(k) for k in ('bytes', 'sha256')}
        names = {'inventory.json.gpg'} | {'object-' + str(i).zfill(6) + '.gpg' for i in range(1, count + 1)}
    if not isinstance(files, dict) or set(files) != names:
        raise CopyError('MANIFEST_FILE_SET_MISMATCH')
    for name, item in files.items():
        if not FILE_NAME.fullmatch(name) or not isinstance(item, dict):
            raise CopyError('INVALID_FILE_METADATA')
        if type(item.get('bytes')) is not int or not 0 < item['bytes'] <= MAX_FILE:
            raise CopyError('INVALID_FILE_SIZE')
        if not isinstance(item.get('sha256'), str) or not re.fullmatch('[0-9a-f]{64}', item['sha256']):
            raise CopyError('INVALID_FILE_HASH')
    return {name: {k: item[k] for k in ('bytes', 'sha256')} for name, item in files.items()}


def local_report(root):
    report = {}
    for kind in ('Database', 'Storage'):
        folder = root / kind
        if folder.is_symlink() or not folder.is_dir() or (folder / 'INCOMPLETE.txt').exists():
            raise CopyError('COPY_FOLDER_MISSING_OR_INCOMPLETE')
        path = folder / 'manifest.json'
        regular(path, MAX_MANIFEST)
        raw = path.read_bytes()
        files = expected_files(decode_manifest(raw), kind)
        report[kind] = {'manifest': base64.b64encode(raw).decode(),
                        'files': {name: digest(folder / name) for name in files}}
    return report


def windows_report(destination):
    executable = shutil.which('powershell.exe')
    if not executable:
        raise CopyError('WINDOWS_POWERSHELL_NOT_FOUND')
    payload = base64.b64encode(destination.encode('utf-8')).decode()
    script = (Path(__file__).with_name('verify_backup_copy_windows.ps1')).read_text()
    # Destination is data, never executable PowerShell text.
    source = "$pcDestination = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('" + payload + "'))\n" + script
    encoded = base64.b64encode(source.encode('utf-16-le')).decode()
    result = subprocess.run([executable, '-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
                            capture_output=True, timeout=120)
    try:
        parsed = json.loads(result.stdout.decode('utf-8-sig'))
    except (ValueError, UnicodeError):
        raise CopyError('WINDOWS_CHECK_FAILED') from None
    if result.returncode or not isinstance(parsed, dict) or parsed.get('error'):
        raise CopyError('CHECK_USB_CONNECTED_AND_DATABASE_STORAGE_FOLDERS')
    return parsed


def find_original(root, raw, kind):
    if root.is_symlink() or not root.is_dir():
        raise CopyError('ORIGINAL_BACKUPS_FOLDER_MISSING')
    # Match the exact copied manifest, not a guessed latest backup.
    for folder in sorted(root.iterdir()):
        pattern = r'storage-\d{8}T\d{6}Z-[A-Za-z0-9_-]+' if kind == 'Storage' else r'\d{8}T\d{6}Z-[A-Za-z0-9_-]+'
        if not re.fullmatch(pattern, folder.name) or folder.is_symlink() or not folder.is_dir():
            continue
        path = folder / 'manifest.json'
        if (folder / 'INCOMPLETE.txt').exists() or not path.exists():
            continue
        regular(path, MAX_MANIFEST)
        if path.read_bytes() == raw:
            return folder
    raise CopyError('MATCHING_ORIGINAL_MANIFEST_NOT_FOUND_' + kind.upper())


def verify_report(report, originals):
    if not isinstance(report, dict) or set(report) != {'Database', 'Storage'}:
        raise CopyError('INCOMPLETE_COPY_REPORT')
    counts = {}
    for kind in ('Database', 'Storage'):
        copied = report[kind]
        if not isinstance(copied, dict):
            raise CopyError('INVALID_COPY_REPORT')
        try:
            raw = base64.b64decode(copied['manifest'], validate=True)
        except (ValueError, TypeError, KeyError):
            raise CopyError('INVALID_COPY_MANIFEST') from None
        files = expected_files(decode_manifest(raw), kind)
        original = find_original(originals, raw, kind)
        if copied.get('files') != files:
            raise CopyError('COPY_HASH_OR_SIZE_MISMATCH_' + kind.upper())
        for name, expected in files.items():
            if digest(original / name) != expected:
                raise CopyError('ORIGINAL_HASH_OR_SIZE_MISMATCH_' + kind.upper())
        counts[kind] = len(files)
    return counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--destination', default='F:\\PortaleCinofilo-backup')
    args = parser.parse_args()
    print('Controllo in sola lettura: nessuna password, decifratura o connessione online.', flush=True)
    originals = Path.home() / 'PortaleCinofilo-backups'
    if re.match(r'^[A-Za-z]:[\\/]', args.destination):
        report = windows_report(args.destination)
    else:
        target = Path(args.destination).expanduser().resolve()
        if target == originals.resolve() or originals.resolve() in target.parents:
            raise CopyError('DESTINATION_MUST_BE_OUTSIDE_ORIGINAL_BACKUPS')
        report = local_report(target)
    counts = verify_report(report, originals)
    print('OK: manifest e file Database corrispondono agli originali (' + str(counts['Database']) + ' file cifrati).')
    print('OK: manifest e file Storage corrispondono agli originali (' + str(counts['Storage']) + ' file cifrati).')
    print('OK_BACKUP_COPY_HASHES_VERIFIED')
    print('Verificata integrità della copia. Ripristino reale ancora da provare.')
    print('Se F: è la USB scelta, espellila in sicurezza da Windows e conservala separata dal PC.')


if __name__ == '__main__':
    try:
        main()
    except CopyError as error:
        print('COPIA_NON_VERIFICATA: ' + str(error), file=sys.stderr)
        sys.exit(1)
    except (OSError, ValueError, subprocess.SubprocessError):
        print('COPIA_NON_VERIFICATA: FILE_OR_DEVICE_NOT_READABLE', file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print('COPIA_NON_VERIFICATA: INTERRUPTED', file=sys.stderr)
        sys.exit(130)
