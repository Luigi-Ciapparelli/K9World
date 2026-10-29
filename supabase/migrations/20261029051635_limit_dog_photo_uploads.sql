-- Match the existing browser output: static WebP, maximum 160 KiB.
-- Bucket restrictions apply to future uploads/replacements, not existing objects.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '15s';

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='dog-photos' AND public=false) THEN
  RAISE EXCEPTION 'Expected private dog-photos bucket is missing or has changed';
 END IF;
 UPDATE storage.buckets
 SET file_size_limit=163840, allowed_mime_types=ARRAY['image/webp']::text[]
 WHERE id='dog-photos';
END $$;

-- Do not alter object bytes, paths, owners, signed URLs, grants or RLS policies.
-- A MIME allowlist is not content inspection or antivirus protection.
COMMIT;
