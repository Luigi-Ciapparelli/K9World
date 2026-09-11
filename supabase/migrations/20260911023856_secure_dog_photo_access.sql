-- Allow a professional to read private dog photos only when the dog is linked
-- to one of that professional's accepted/completed bookings.
-- Owner storage policies created previously remain unchanged.

BEGIN;

CREATE OR REPLACE FUNCTION public.can_professional_view_dog_photo(
  p_object_name text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.bookings AS b
      JOIN public.booking_dogs AS bd
        ON bd.booking_id = b.id
      JOIN public.dogs AS d
        ON d.id = bd.dog_id
      WHERE b.professional_id = auth.uid()
        AND b.status IN ('accepted', 'completed')
        AND d.id::text = split_part(p_object_name, '/', 2)
        AND d.owner_id::text = split_part(p_object_name, '/', 1)
    );
$$;

REVOKE ALL
ON FUNCTION public.can_professional_view_dog_photo(text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.can_professional_view_dog_photo(text)
FROM anon;

GRANT EXECUTE
ON FUNCTION public.can_professional_view_dog_photo(text)
TO authenticated;

DROP POLICY IF EXISTS "Professionals view booked dog photos"
ON storage.objects;

CREATE POLICY "Professionals view booked dog photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dog-photos'
  AND public.can_professional_view_dog_photo(name)
);

COMMIT;
