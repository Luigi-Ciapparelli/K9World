-- Keep local migration history aligned with the remote database.
-- This migration fixed public search visibility and base API permissions.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER TABLE public.professionals
ALTER COLUMN approved SET DEFAULT false;

DROP POLICY IF EXISTS "View approved pros" ON public.professionals;
DROP POLICY IF EXISTS "Public view approved pros" ON public.professionals;

CREATE POLICY "Public view approved pros"
ON public.professionals
FOR SELECT
TO anon, authenticated
USING (
  approved = true
  OR auth.uid() = id
);

DROP POLICY IF EXISTS "Public view professional profiles" ON public.profiles;

CREATE POLICY "Public view professional profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (role = 'professional');

DROP POLICY IF EXISTS "View services" ON public.services;
DROP POLICY IF EXISTS "Public view active services" ON public.services;

CREATE POLICY "Public view active services"
ON public.services
FOR SELECT
TO anon, authenticated
USING (
  (
    active = true
    AND EXISTS (
      SELECT 1
      FROM public.professionals p
      WHERE p.id = services.professional_id
      AND p.approved = true
    )
  )
  OR auth.uid() = professional_id
);

DROP POLICY IF EXISTS "View reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public view reviews" ON public.reviews;

CREATE POLICY "Public view reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (true);
