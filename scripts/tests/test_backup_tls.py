#!/usr/bin/env python3
"""Offline trust-anchor and private-error checks; no production connection."""
from pathlib import Path
import ssl
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backup_database_encrypted import BackupError, connection_error_code, verified_ca_bytes


class BackupTLSChecks(unittest.TestCase):
    def test_reviewed_certificate_is_a_ca(self):
        certificate = verified_ca_bytes()
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
        context.load_verify_locations(cadata=certificate.decode('ascii'))
        self.assertIn(ssl.PEM_cert_to_DER_cert(certificate.decode('ascii')),
                      context.get_ca_certs(binary_form=True))
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)

    def test_missing_certificate_fails_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(BackupError, '^SUPABASE_CA_FILE_MISSING_OR_UNREADABLE$'):
                verified_ca_bytes(Path(directory) / 'absent.crt')

    def test_invalid_or_changed_certificate_is_rejected(self):
        certificate = verified_ca_bytes()
        changed = certificate.replace(b'MII', b'NII', 1)
        self.assertNotEqual(changed, certificate)
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'ca.crt'
            for data in (b'<html>error</html>', b'x' * 16385, certificate * 2,
                         b'-----BEGIN PRIVATE KEY-----\nsecret\n-----END PRIVATE KEY-----'):
                path.write_bytes(data)
                with self.assertRaises(BackupError):
                    verified_ca_bytes(path)
            path.write_bytes(changed)
            with self.assertRaisesRegex(BackupError, '^SUPABASE_CA_FINGERPRINT_MISMATCH$'):
                verified_ca_bytes(path)

    def test_fixed_categories_do_not_disclose_private_text(self):
        cases = (
            ('SSL error: certificate verify failed', 'DATABASE_TLS_CA_VERIFICATION_FAILED'),
            ('server certificate does not match host name', 'DATABASE_TLS_HOSTNAME_MISMATCH'),
            ('could not load private key file', 'DATABASE_TLS_CLIENT_CERTIFICATE_ERROR'),
            ('server does not support SSL', 'DATABASE_TLS_NOT_SUPPORTED'),
            ('unsupported startup parameter: options', 'DATABASE_STARTUP_OPTIONS_REJECTED'),
            ('password authentication failed', 'DATABASE_PASSWORD_REJECTED'),
            ('permission denied for schema vault', 'DATABASE_PREFLIGHT_PERMISSION_DENIED'),
            ('unrecognized failure', 'DATABASE_CONNECTION_FAILED_UNCLASSIFIED'),
        )
        for message, expected in cases:
            raw = (message + '\npostgres://secret-user:secret-password@private-host/db\nprivate-sql').encode()
            self.assertEqual(connection_error_code(raw), expected)


if __name__ == '__main__':
    unittest.main()
