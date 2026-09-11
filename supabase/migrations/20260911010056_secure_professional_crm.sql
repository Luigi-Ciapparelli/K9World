-- Secure professional CRM surface.
-- Keeps private profile data closed while exposing only clients who have a real
-- accepted/completed booking relationship with the authenticated professional.
-- Existing notes/tags are preserved, but become inaccessible if no valid
-- professional-client relationship exists.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Controlled CRM read API.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_professional_clients()
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  booking_count integer,
  total_spend numeric,
  last_visit timestamptz,
  dogs jsonb,
  tags text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_professional_id uuid;
BEGIN
  v_professional_id := auth.uid();

  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.professionals AS pro
    WHERE pro.id = v_professional_id
  ) THEN
    RAISE EXCEPTION 'Professional account required';
  END IF;

  RETURN QUERY
  WITH eligible_bookings AS (
    SELECT
      b.id,
      b.owner_id,
      b.status,
      b.price,
      b.start_at
    FROM public.bookings AS b
    WHERE b.professional_id = v_professional_id
      AND b.status IN ('accepted', 'completed')
  ),
  client_stats AS (
    SELECT
      eb.owner_id,
      COUNT(*)::integer AS booking_count,
      COALESCE(
        SUM(eb.price) FILTER (WHERE eb.status = 'completed'),
        0
      ) AS total_spend,
      MAX(eb.start_at) AS last_visit
    FROM eligible_bookings AS eb
    GROUP BY eb.owner_id
  )
  SELECT
    pr.id,
    COALESCE(NULLIF(BTRIM(pr.full_name), ''), 'Cliente') AS full_name,
    pr.email,
    pr.phone,
    pr.avatar_url,
    cs.booking_count,
    cs.total_spend,
    cs.last_visit,
    COALESCE(
      (
        SELECT jsonb_agg(dog_row.dog_data ORDER BY dog_row.dog_name)
        FROM (
          SELECT DISTINCT ON (d.id)
            d.name AS dog_name,
            jsonb_build_object(
              'id', d.id,
              'name', d.name,
              'breed', d.breed,
              'breed_slug', d.breed_slug,
              'fci_group', d.fci_group,
              'birth_date', d.birth_date,
              'age', d.age,
              'weight', d.weight,
              'photo_url', d.photo_url,
              'vaccinated', d.vaccinated,
              'aggressive', d.aggressive
            ) AS dog_data
          FROM public.bookings AS b2
          JOIN public.booking_dogs AS bd
            ON bd.booking_id = b2.id
          JOIN public.dogs AS d
            ON d.id = bd.dog_id
          WHERE b2.professional_id = v_professional_id
            AND b2.owner_id = pr.id
            AND b2.status IN ('accepted', 'completed')
          ORDER BY d.id, d.name
        ) AS dog_row
      ),
      '[]'::jsonb
    ) AS dogs,
    ARRAY(
      SELECT DISTINCT ct.tag
      FROM public.client_tags AS ct
      WHERE ct.professional_id = v_professional_id
        AND ct.client_id = pr.id
        AND BTRIM(COALESCE(ct.tag, '')) <> ''
      ORDER BY ct.tag
    ) AS tags
  FROM client_stats AS cs
  JOIN public.profiles AS pr
    ON pr.id = cs.owner_id
  ORDER BY cs.total_spend DESC, cs.last_visit DESC NULLS LAST;
END;
$$;

REVOKE ALL
ON FUNCTION public.get_professional_clients()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.get_professional_clients()
FROM anon;

GRANT EXECUTE
ON FUNCTION public.get_professional_clients()
TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Harden client_notes.
-- A professional may access notes only for a client with at least one
-- accepted/completed booking relationship.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Pro view notes" ON public.client_notes;
DROP POLICY IF EXISTS "Pro insert notes" ON public.client_notes;
DROP POLICY IF EXISTS "Pro update notes" ON public.client_notes;
DROP POLICY IF EXISTS "Pro delete notes" ON public.client_notes;

CREATE POLICY "Pro view related client notes"
ON public.client_notes
FOR SELECT
TO authenticated
USING (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_notes.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Pro insert related client notes"
ON public.client_notes
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_notes.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Pro update related client notes"
ON public.client_notes
FOR UPDATE
TO authenticated
USING (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_notes.client_id
      AND b.status IN ('accepted', 'completed')
  )
)
WITH CHECK (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_notes.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Pro delete related client notes"
ON public.client_notes
FOR DELETE
TO authenticated
USING (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_notes.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

-- ---------------------------------------------------------------------------
-- 3. Harden client_tags with the same relationship rule.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Pro view tags" ON public.client_tags;
DROP POLICY IF EXISTS "Pro insert tags" ON public.client_tags;
DROP POLICY IF EXISTS "Pro delete tags" ON public.client_tags;

CREATE POLICY "Pro view related client tags"
ON public.client_tags
FOR SELECT
TO authenticated
USING (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_tags.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Pro insert related client tags"
ON public.client_tags
FOR INSERT
TO authenticated
WITH CHECK (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_tags.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

CREATE POLICY "Pro delete related client tags"
ON public.client_tags
FOR DELETE
TO authenticated
USING (
  professional_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.professional_id = auth.uid()
      AND b.owner_id = client_tags.client_id
      AND b.status IN ('accepted', 'completed')
  )
);

COMMIT;
