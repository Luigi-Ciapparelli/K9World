"""Tests use only synthetic ciphertext created in an empty temporary directory."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import restore_encrypted_backups as dr
from backup_storage_encrypted import encrypt_verified, export_storage

STAMP = '20261109T000000Z'
DB_PHRASE = 'Synthetic database passphrase only'
STORE_PHRASE = 'Synthetic separate storage passphrase'
RECORD = {'bucket':'private-photo','path':'gruppo/spazio e città.webp',
          'object':{'id':'00000000-0000-4000-a000-000000000001','name':'spazio e città.webp',
                    'updated_at':'2026-10-29T10:12:30.123Z','metadata':{'size':3,'eTag':'synthetic-tag'}}}


class Storage:
    def __init__(self, record=None):
        self.record = record or RECORD

    def inventory(self):
        return {'buckets':[{'id':'private-photo','public':False},{'id':'empty-public','public':True}],
                'objects':[self.record]}

    def download(self, record):
        return b'\xff\x00\x01'


def source(root, live):
    roles, archive = b'\nCREATE ROLE supabase_admin;\nALTER ROLE supabase_admin WITH SUPERUSER LOGIN;\n', b'fake archive'
    if live:
        p = subprocess.run(['/usr/bin/docker','--host',dr.SOCKET,'run','--rm','-i','--pull=never','--network','none',
                            '--read-only','--no-healthcheck','--cap-drop','ALL','--security-opt','no-new-privileges',
                            '--user','postgres','--tmpfs','/tmp:rw,nosuid,nodev,noexec,mode=1777,size=384m',
                            '--entrypoint','/bin/sh',dr.IMAGE,'-seu'],
                           input=Path(__file__).with_name('real_restore_fixture.sh').read_bytes(),
                           stdout=subprocess.PIPE,timeout=120,check=True)
        with tarfile.open(fileobj=io.BytesIO(p.stdout)) as tar:
            roles, archive = [tar.extractfile(n).read() for n in ('roles','db')]
    db_path, st_path = root/(STAMP+'-synthetic'), root/('storage-'+STAMP+'-synthetic')
    db_path.mkdir(mode=0o700)
    st_path.mkdir(mode=0o700)
    with dr.crypto_home() as home:
        files = {}
        for n,data in [('roles.sql.gpg',roles),('database.dump.gpg',archive)]:
            row = encrypt_verified(data, db_path/n, home, DB_PHRASE)
            files[n] = {k:row[k] for k in ('bytes','sha256')}
        (db_path/'manifest.json').write_text(json.dumps(dict(project=dr.PROJECT,files=files,server_version='17.6',
            client_major=17,state='database_export_verified_restore_pending')))
        export_storage(Storage(),st_path,home,STORE_PHRASE)
    return dr.select_set(root,'Database'), dr.select_set(root,'Storage')


class Inputs(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        cls.root=Path(cls.tmp.name)
        cls.db, cls.st = source(cls.root, False)

    @classmethod
    def tearDownClass(cls): cls.tmp.cleanup()

    def test_wrong_password_has_no_private_output(self):
        with dr.memory_file() as stream,self.assertRaisesRegex(dr.DrillError,'^DECIFRATURA_FALLITA_DATABASE$'):
            dr.pack(stream,self.db,self.st,'Wrong synthetic passphrase',STORE_PHRASE)

    def test_valid_hash_required_before_decryption(self):
        folder, manifest, files = self.db
        changed = dict(files)
        changed['roles.sql.gpg'] = {**files['roles.sql.gpg'],'sha256':'0'*64}
        with dr.memory_file() as stream,self.assertRaisesRegex(dr.DrillError,'^HASH_CIFRATO_DIVERSO_DATABASE$'):
            dr.pack(stream,(folder,manifest,changed),self.st,DB_PHRASE,STORE_PHRASE)

    def test_two_passphrases_and_safe_extraction(self):
        with dr.memory_file() as stream:
            self.assertEqual(dr.pack(stream,self.db,self.st,DB_PHRASE,STORE_PHRASE),(1,3))
            with tarfile.open(fileobj=stream) as tar:
                self.assertEqual(tar.extractfile('objects/private-photo/'+RECORD['path']).read(),b'\xff\x00\x01')
                self.assertNotIn(b'CREATE ROLE supabase_admin;',tar.extractfile('roles.apply').read())

    def test_path_traversal_is_not_packed(self):
        with tempfile.TemporaryDirectory() as tmp,dr.crypto_home() as home,dr.memory_file() as stream:
            root=Path(tmp); st=root/('storage-'+STAMP+'-synthetic');st.mkdir(mode=0o700)
            export_storage(Storage({**RECORD,'path':'../danger'}),st,home,STORE_PHRASE)
            with tarfile.open(fileobj=stream,mode='w') as tar,self.assertRaises((dr.DrillError,dr.BackupError)):
                dr.add_storage(tar,dr.select_set(root,'Storage'),home,STORE_PHRASE)


@unittest.skipUnless('--container' in sys.argv,'requires the pinned local image')
class Container(unittest.TestCase):
    def test_restore_real_format_and_reject_snapshot_skew(self):
        with tempfile.TemporaryDirectory() as tmp, dr.memory_file() as stream:
            root=Path(tmp)
            db, st=source(root,True)
            conf=root/'docker'; conf.mkdir(mode=0o700)
            cmd=dr.engine(conf,False)
            dr.pack(stream,db,st,DB_PHRASE,STORE_PHRASE)
            dr.isolated(cmd,stream)
            # Both exports are individually valid; only their logical keys differ.
            other=root/'unrelated';other.mkdir(mode=0o700)
            f=other/('storage-'+STAMP+'-synthetic');f.mkdir(mode=0o700)
            with dr.crypto_home() as home:
                export_storage(Storage({**RECORD,'path':'altro/spazio e città.webp'}),f,home,STORE_PHRASE)
            with dr.memory_file() as negative:
                dr.pack(negative,db,dr.select_set(other,'Storage'),DB_PHRASE,STORE_PHRASE)
                with self.assertRaisesRegex(dr.DrillError,'^PROVA_STORAGE_CATALOG_ERROR$'):
                    dr.isolated(cmd,negative)


if __name__=='__main__':
    os.umask(0o077)
    unittest.main(argv=[sys.argv[0]],verbosity=2)
