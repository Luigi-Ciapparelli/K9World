#!/usr/bin/env python3
"""Only synthetic local files. The Windows job also runs the real PowerShell bridge."""
import copy
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import verify_backup_copy as check


def fingerprint(raw):
    return {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}


class CopyTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.originals = root / 'originals'
        self.destination = root / "USB prova [1] ' café"
        self.originals.mkdir()
        self.destination.mkdir()
        self.database = self.originals / '20261029T192547Z-synthetic'
        self.storage = self.originals / 'storage-20261030T010000Z-synthetic'
        database_bytes = {'database.dump.gpg': b'synthetic database ciphertext', 'roles.sql.gpg': b'synthetic roles ciphertext'}
        storage_bytes = {'object-000001.gpg': b'synthetic photo ciphertext', 'inventory.json.gpg': b'synthetic inventory ciphertext'}
        database = {'project': check.PROJECT, 'state': 'database_export_verified_restore_pending',
                    'files': {k: fingerprint(v) for k, v in database_bytes.items()}}
        storage = {'project': check.PROJECT, 'status': 'storage_export_verified_restore_pending', 'objects': 1,
                   'files': [{'file': k, **fingerprint(v)} for k, v in storage_bytes.items()]}
        for kind, folder, data, manifest in [('Database', self.database, database_bytes, database),
                                              ('Storage', self.storage, storage_bytes, storage)]:
            folder.mkdir()
            for name, raw in data.items():
                (folder / name).write_bytes(raw)
            (folder / 'manifest.json').write_text(json.dumps(manifest), encoding='utf-8')
            shutil.copytree(folder, self.destination / kind)

    def test_valid_copy_and_sources_are_unchanged(self):
        root = Path(self.tmp.name)
        before = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
        self.assertEqual(check.verify_report(check.local_report(self.destination), self.originals), {'Database': 2, 'Storage': 2})
        after = {p.relative_to(root): p.read_bytes() for p in root.rglob('*') if p.is_file()}
        self.assertEqual(before, after)

    def test_same_size_corruption_on_usb_fails(self):
        path = self.destination / 'Storage' / 'object-000001.gpg'
        path.write_bytes(b'x' * path.stat().st_size)
        with self.assertRaisesRegex(check.CopyError, 'COPY_HASH_OR_SIZE_MISMATCH_STORAGE'):
            check.verify_report(check.local_report(self.destination), self.originals)

    def test_source_corruption_fails_even_if_copy_is_good(self):
        (self.database / 'database.dump.gpg').write_bytes(b'altered source')
        with self.assertRaisesRegex(check.CopyError, 'ORIGINAL_HASH_OR_SIZE_MISMATCH_DATABASE'):
            check.verify_report(check.local_report(self.destination), self.originals)

    def test_missing_file_and_incomplete_marker_fail(self):
        (self.destination / 'Database' / 'roles.sql.gpg').unlink()
        with self.assertRaises(OSError):
            check.local_report(self.destination)
        (self.destination / 'Database' / 'INCOMPLETE.txt').write_text('incomplete')
        with self.assertRaisesRegex(check.CopyError, 'INCOMPLETE'):
            check.local_report(self.destination)

    def test_manifest_must_match_an_original_exactly(self):
        path = self.destination / 'Database' / 'manifest.json'
        path.write_text(path.read_text() + '\n')
        with self.assertRaisesRegex(check.CopyError, 'MATCHING_ORIGINAL_MANIFEST_NOT_FOUND_DATABASE'):
            check.verify_report(check.local_report(self.destination), self.originals)

    def test_newer_original_does_not_override_matching_snapshot(self):
        later = self.originals / '20261031T192547Z-later'
        later.mkdir()
        (later / 'manifest.json').write_text('{}')
        result = check.verify_report(check.local_report(self.destination), self.originals)
        self.assertEqual(result['Database'], 2)

    def test_failed_original_not_accepted(self):
        (self.database / 'INCOMPLETE.txt').write_text('failed')
        with self.assertRaisesRegex(check.CopyError, 'MATCHING_ORIGINAL_MANIFEST_NOT_FOUND_DATABASE'):
            check.verify_report(check.local_report(self.destination), self.originals)

    def test_wrong_project_and_export_state_rejected(self):
        value = json.loads((self.database / 'manifest.json').read_text())
        value['project'] = 'wrong'
        with self.assertRaisesRegex(check.CopyError, 'PROJECT'):
            check.decode_manifest(json.dumps(value).encode())
        value['project'] = check.PROJECT
        value['state'] = 'pending'
        with self.assertRaisesRegex(check.CopyError, 'NOT_VERIFIED'):
            check.expected_files(value, 'Database')

    def test_storage_path_traversal_and_duplicate_names_rejected(self):
        value = json.loads((self.storage / 'manifest.json').read_text())
        duplicated = copy.deepcopy(value)
        duplicated['files'].append(duplicated['files'][0])
        with self.assertRaisesRegex(check.CopyError, 'DUPLICATE'):
            check.expected_files(duplicated, 'Storage')
        value['files'][0]['file'] = '../private.txt'
        with self.assertRaisesRegex(check.CopyError, 'FILE_SET_MISMATCH'):
            check.expected_files(value, 'Storage')

    def test_missing_inventory_count_or_invalid_hash_rejected(self):
        value = json.loads((self.storage / 'manifest.json').read_text())
        for key, bad in [('bytes', True), ('bytes', -1), ('sha256', 'invalid')]:
            changed = copy.deepcopy(value)
            changed['files'][0][key] = bad
            with self.assertRaises(check.CopyError):
                check.expected_files(changed, 'Storage')
        value['objects'] = 2
        with self.assertRaisesRegex(check.CopyError, 'FILE_SET_MISMATCH'):
            check.expected_files(value, 'Storage')

    def test_report_missing_group_fails(self):
        report = check.local_report(self.destination)
        del report['Storage']
        with self.assertRaisesRegex(check.CopyError, 'INCOMPLETE_COPY_REPORT'):
            check.verify_report(report, self.originals)

    @unittest.skipIf(os.name == 'nt', 'Symlink privileges vary on Windows')
    def test_symlink_not_followed(self):
        path = self.destination / 'Storage' / 'inventory.json.gpg'
        path.unlink()
        path.symlink_to(self.storage / path.name)
        with self.assertRaises(check.CopyError):
            check.local_report(self.destination)

    @unittest.skipUnless(os.name == 'nt', 'Real PowerShell bridge runs on Windows CI')
    def test_windows_bridge_and_literal_path(self):
        report = check.windows_report(str(self.destination))
        self.assertEqual(check.verify_report(report, self.originals), {'Database': 2, 'Storage': 2})

    @unittest.skipUnless(os.name == 'nt', 'Real PowerShell bridge runs on Windows CI')
    def test_windows_missing_usb_reports_generic_error(self):
        with self.assertRaisesRegex(check.CopyError, 'CHECK_USB_CONNECTED'):
            check.windows_report(str(self.destination / 'missing'))

    @unittest.skipUnless(os.name == 'nt', 'Real PowerShell bridge runs on Windows CI')
    def test_windows_corrupted_copy_rejected(self):
        (self.destination / 'Database' / 'roles.sql.gpg').write_bytes(b'corrupt')
        with self.assertRaisesRegex(check.CopyError, 'COPY_HASH_OR_SIZE_MISMATCH_DATABASE'):
            check.verify_report(check.windows_report(str(self.destination)), self.originals)


if __name__ == '__main__':
    unittest.main()
