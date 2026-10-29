-- Runs only in the isolated fixture, after the receipt assertions define pg_temp.ok.
SELECT pg_temp.ok((SELECT NOT public AND file_size_limit=163840
 AND allowed_mime_types=ARRAY['image/webp']::text[]
 FROM storage.buckets WHERE id='dog-photos'),'Private dog photos capped at 160 KiB WebP');
SELECT pg_temp.ok(NOT EXISTS(
 (SELECT * FROM buckets_before WHERE id<>'dog-photos'
  EXCEPT SELECT * FROM storage.buckets WHERE id<>'dog-photos')
 UNION ALL
 (SELECT * FROM storage.buckets WHERE id<>'dog-photos'
  EXCEPT SELECT * FROM buckets_before WHERE id<>'dog-photos')),
 'Other bucket settings unchanged');
SELECT pg_temp.ok((SELECT to_jsonb(b)-'file_size_limit'-'allowed_mime_types'
 FROM storage.buckets b WHERE id='dog-photos') IS NOT DISTINCT FROM
 (SELECT to_jsonb(b)-'file_size_limit'-'allowed_mime_types'
 FROM buckets_before b WHERE id='dog-photos'),'No other dog bucket setting changed');
SELECT pg_temp.ok(NOT EXISTS(
 (SELECT * FROM objects_before EXCEPT SELECT * FROM storage.objects)
 UNION ALL (SELECT * FROM storage.objects EXCEPT SELECT * FROM objects_before)),
 'Existing objects unchanged');
SELECT pg_temp.ok(NOT EXISTS(
 (SELECT * FROM storage_policies_before EXCEPT SELECT * FROM pg_policies WHERE schemaname='storage')
 UNION ALL
 (SELECT * FROM pg_policies WHERE schemaname='storage' EXCEPT SELECT * FROM storage_policies_before)),
 'Storage access policies unchanged');
