#!/usr/bin/env python3
"""Offline API fixtures and native GPG. No real keys, object contents or network."""
import base64
import hashlib
import io
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import Request

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import backup_storage_encrypted as backup

OFFLINE = '--offline' in sys.argv
if OFFLINE:
    sys.argv.remove('--offline')
KEY = 'sb_secret_' + 'synthetic_no_real_key_0123456789'
PHRASE = 'synthetic local encryption phrase only'


def entry(name='photo.webp', size=3, identity='id-1'):
    return {'name': name, 'id': identity, 'updated_at': '2026-10-29T00:00:00Z',
            'last_accessed_at': '2026-10-29T00:00:00Z', 'metadata': {'size': size, 'mimetype': 'image/webp'}}


class Response(io.BytesIO):
    status = 200

    def __init__(self, data, headers=None):
        super().__init__(data)
        self.headers = headers or {}


class FakeOpener:
    def __init__(self, responder):
        self.responder, self.calls = responder, []

    def open(self, request, timeout):
        self.calls.append((request, timeout))
        return self.responder(request)


def client(responder):
    value = backup.StorageClient(KEY)
    value.opener = FakeOpener(responder)
    return value


def json_response(data):
    return Response(json.dumps(data).encode())


class ApiTests(unittest.TestCase):
    def test_secret_and_legacy_project_keys(self):
        self.assertEqual(backup.key_headers(KEY), {'apikey': KEY})
        claims = base64.urlsafe_b64encode(json.dumps({'role': 'service_role', 'ref': backup.PROJECT}).encode()).decode().rstrip('=')
        jwt = 'eyJheader.' + claims + '.signature'
        self.assertEqual(backup.key_headers(jwt)['Authorization'], 'Bearer ' + jwt)
        for role, project in [('anon', backup.PROJECT), ('service_role', 'another-project')]:
            payload = base64.urlsafe_b64encode(json.dumps({'role': role, 'ref': project}).encode()).decode().rstrip('=')
            with self.assertRaises(backup.BackupError):
                backup.key_headers('eyJ.' + payload + '.signature')
        for key in ['sb_publishable_abc', '', KEY + '\nInjected', 'bad']:
            with self.assertRaises(backup.BackupError):
                backup.key_headers(key)

    def test_all_pages_and_nested_folders_without_access_time_noise(self):
        def respond(request):
            if request.full_url.endswith('/bucket'):
                return json_response([{'id': 'private-bucket', 'public': False}])
            options = json.loads(request.data)
            if options['prefix'] == 'folder/':
                return json_response([entry('document.pdf', 3, 'id-102')])
            if options['offset'] == 0:
                return json_response([{'name': 'folder', 'id': None, 'metadata': None}] +
                                     [entry('f-' + str(i), 3, 'id-' + str(i)) for i in range(99)])
            return json_response([entry('last', 3, 'id-101')])
        value = client(respond)
        result = value.inventory()
        self.assertEqual(len(result['objects']), 101)
        self.assertIn('folder/document.pdf', [o['path'] for o in result['objects']])
        self.assertNotIn('last_accessed_at', result['objects'][0]['object'])
        self.assertEqual(len(value.opener.calls), 4)
        self.assertTrue(all(c[0].get_method() in ('GET', 'POST') for c in value.opener.calls))

    def test_repeated_page_rejected_not_infinite_loop(self):
        value = client(lambda r: json_response([{'id': 'private'}] if r.full_url.endswith('/bucket') else
                                               [entry('same-' + str(i)) for i in range(100)]))
        with self.assertRaisesRegex(backup.BackupError, 'DUPLICATE_PATH'):
            value.inventory()

    def test_malformed_ambiguous_and_large_objects_rejected(self):
        bad_entries = [entry(size=True), entry(size=-1), entry(size=backup.MAX_OBJECT + 1),
                       {**entry(), 'id': None}, {**entry(), 'updated_at': None},
                       {**entry(), 'name': '../secret'}, {**entry(), 'metadata': None}]
        for bad in bad_entries:
            with self.subTest(bad=bad), self.assertRaises(backup.BackupError):
                value = client(lambda r: json_response([{'id': 'b'}] if r.full_url.endswith('/bucket') else [bad]))
                value.inventory()

    def test_total_object_folder_and_bucket_limits(self):
        cases = [('MAX_TOTAL', 2, [entry()]), ('MAX_OBJECTS', 0, [entry()]),
                 ('MAX_FOLDERS', 0, []), ('MAX_BUCKETS', 1, [])]
        for setting, maximum, entries in cases:
            with self.subTest(setting=setting), patch.object(backup, setting, maximum), self.assertRaises(backup.BackupError):
                client(lambda r: json_response([{'id': 'b'}] if r.full_url.endswith('/bucket') else entries)).inventory()
        with self.assertRaises(backup.BackupError):
            client(lambda r: json_response([{'id': 'b', 'type': 'ANALYTICS'}])).inventory()

    def test_redirect_rejected_even_with_sensitive_original_headers(self):
        with self.assertRaisesRegex(backup.BackupError, 'REDIRECT_REFUSED'):
            backup.NoRedirect().redirect_request(Request(backup.BASE_URL + '/bucket', headers={'apikey': KEY}),
                                                  None, 302, 'redirect', {}, 'https://evil.invalid/')

    def test_http_errors_do_not_expose_response_or_key(self):
        for status in (401, 403, 404, 429, 500):
            def fail(_):
                raise HTTPError('https://private.invalid/' + KEY, status, KEY, {}, io.BytesIO(KEY.encode()))
            with self.subTest(status=status), self.assertRaises(backup.BackupError) as caught:
                client(fail).inventory()
            self.assertNotIn(KEY, str(caught.exception))

    def test_bounded_response_truncation_and_time_limit(self):
        cases = [(b'abc', {'Content-Length': '4'}), (b'abc', {'Content-Length': '99999999'}),
                 (b'abc', {'Content-Encoding': 'gzip'}), (b'abcde', {})]
        for raw, headers in cases:
            with self.subTest(headers=headers), self.assertRaises(backup.BackupError):
                client(lambda _: Response(raw, headers))._request('GET', '/bucket', limit=4)
        value = client(lambda _: Response(b'[]'))
        value.deadline = time.monotonic() - 1
        with self.assertRaisesRegex(backup.BackupError, 'TIME_LIMIT'):
            value.inventory()
        self.assertEqual(value.opener.calls, [])

    def test_only_read_operations_allowed(self):
        value = client(lambda _: Response(b'[]'))
        for method, route in [('DELETE', '/object/b/a'), ('PUT', '/object/b/a'),
                              ('POST', '/object/b/a'), ('GET', '//evil.invalid/b'), ('GET', '/bucket?evil')]:
            with self.assertRaisesRegex(backup.BackupError, 'NOT_ALLOWED'):
                value._request(method, route)
        self.assertEqual(value.opener.calls, [])

    def test_download_percent_encoding_and_exact_bytes(self):
        value = client(lambda _: Response(b'abc', {'ETag': '"tag-1"'}))
        item = entry('file #?.pdf')
        item['metadata']['eTag'] = 'tag-1'
        result = value.download({'bucket': 'private', 'path': 'folder/file #?.pdf', 'object': item})
        self.assertEqual(result, b'abc')
        request = value.opener.calls[0][0]
        self.assertEqual(request.full_url, backup.BASE_URL + '/object/private/folder/file%20%23%3F.pdf')
        self.assertEqual(request.get_header('Apikey'), KEY)
        self.assertIsNone(request.get_header('Authorization'))

    def test_download_changed_size_or_etag_fails(self):
        for raw, headers in [(b'ab', {}), (b'abc', {'ETag': 'changed'})]:
            item = entry()
            item['metadata']['eTag'] = 'expected'
            with self.assertRaises(backup.BackupError):
                client(lambda _: Response(raw, headers)).download({'bucket': 'b', 'path': 'file', 'object': item})

    def test_names_never_become_local_paths(self):
        for name in ['../file', '..', '.', 'a/b', 'a\\b', 'a\x00b', 'a\nb', '']:
            with self.assertRaises(backup.BackupError):
                backup.leaf(name)


class FakeStorage:
    def __init__(self, change=False):
        self.calls, self.change = 0, change

    def inventory(self):
        self.calls += 1
        obj = entry()
        if self.change and self.calls > 1:
            obj['updated_at'] = '2026-10-30T00:00:00Z'
        return {'buckets': [{'id': 'private'}],
                'objects': [{'bucket': 'private', 'path': 'person/photo.webp', 'object': obj}]}

    def download(self, _):
        return b'abc'


class FailureTests(unittest.TestCase):
    def test_changed_inventory_no_success_manifest(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(backup, 'encrypt_verified', return_value={'file': 'fake.gpg'}):
            directory = Path(tmp)
            with self.assertRaisesRegex(backup.BackupError, 'CHANGED_DURING_EXPORT'):
                backup.export_storage(FakeStorage(change=True), directory, None, PHRASE)
            self.assertFalse((directory / 'manifest.json').exists())
            self.assertTrue((directory / 'INCOMPLETE.txt').exists())

    def test_encryption_failure_no_success_manifest(self):
        with tempfile.TemporaryDirectory() as tmp, patch.object(backup, 'encrypt_verified', side_effect=backup.BackupError('ENCRYPTION_FAILED')):
            directory = Path(tmp)
            with self.assertRaises(backup.BackupError):
                backup.export_storage(FakeStorage(), directory, None, PHRASE)
            self.assertFalse((directory / 'manifest.json').exists())
            self.assertTrue((directory / 'INCOMPLETE.txt').exists())


@unittest.skipIf(OFFLINE, 'Native GPG exercised separately in GitHub Actions')
class CryptoTests(unittest.TestCase):
    def test_complete_encrypted_export_and_manifest(self):
        with tempfile.TemporaryDirectory() as tmp, backup.crypto_home() as home:
            directory = Path(tmp)
            manifest = backup.export_storage(FakeStorage(), directory, home, PHRASE)
            self.assertEqual(manifest['objects'], 1)
            self.assertEqual(manifest['plaintext_bytes'], 3)
            self.assertEqual(manifest['restore_status'], 'not_tested')
            self.assertFalse((directory / 'INCOMPLETE.txt').exists())
            self.assertNotIn('person', (directory / 'manifest.json').read_text())
            for item in manifest['files']:
                path = directory / item['file']
                self.assertEqual(backup.sha256(path), item['sha256'])
                self.assertEqual(path.stat().st_mode & 0o777, 0o600)
                proc = backup.start_gpg(home, PHRASE, ['--decrypt', str(path)],
                                        subprocess.DEVNULL, subprocess.PIPE, subprocess.DEVNULL)
                raw, _ = proc.communicate(timeout=20)
                self.assertEqual(proc.returncode, 0)
                if item['file'] == 'inventory.json.gpg':
                    inventory = json.loads(raw)
                    self.assertEqual(inventory['objects'][0]['path'], 'person/photo.webp')
                    self.assertEqual(inventory['objects'][0]['sha256'], hashlib.sha256(b'abc').hexdigest())
                else:
                    self.assertEqual(raw, b'abc')
            self.assertEqual({p.name for p in directory.iterdir()}, {'object-000001.gpg', 'inventory.json.gpg', 'manifest.json'})

    def test_failed_gpg_and_existing_file_are_not_success(self):
        with tempfile.TemporaryDirectory() as tmp, backup.crypto_home() as home:
            target = Path(tmp) / 'object.gpg'
            with patch.object(backup, 'start_gpg', return_value=subprocess.Popen(['/bin/false'], stdin=subprocess.PIPE)):
                with self.assertRaisesRegex(backup.BackupError, 'ENCRYPTION_FAILED'):
                    backup.encrypt_verified(b'abc', target, home, PHRASE)
            self.assertFalse(target.exists())
            self.assertFalse(target.with_name('object.gpg.partial').exists())
            target.write_bytes(b'preserve')
            with self.assertRaisesRegex(backup.BackupError, 'ALREADY_EXISTS'):
                backup.encrypt_verified(b'abc', target, home, PHRASE)
            self.assertEqual(target.read_bytes(), b'preserve')

    def test_empty_file_is_backed_up_and_verified(self):
        with tempfile.TemporaryDirectory() as tmp, backup.crypto_home() as home:
            target = Path(tmp) / 'empty.gpg'
            info = backup.encrypt_verified(b'', target, home, PHRASE)
            self.assertEqual(info['sha256'], backup.sha256(target))
            self.assertGreater(info['bytes'], 0)


if __name__ == '__main__':
    unittest.main()
