-- Transition-safe hardening for reviews.
-- This migration adds DB invariants, a secure submit RPC, automatic aggregates,
-- and a privacy-safe public projection.
-- The legacy public SELECT and owner INSERT paths remain temporarily available
-- so the currently deployed frontend keeps working during the cutover.

BEGIN;

-- Existing data must satisfy the invariants before constraints are added.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reviews
    WHERE rating IS NULL
       OR rating < 1
       OR rating > 5
  ) THEN
    RAISE EXCEPTION 'Cannot harden reviews: invalid rating values exist';
  END IF;

  IF EXISTS (
    SELECT booking_id
    FROM public.reviews
    GROUP BY booking_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot harden reviews: duplicate reviews exist for a booking';
  END IF;
END;
$$;

ALTER TABLE public.reviews
  ALTER COLUMN rating DROP DEFAULT,
  ALTER COLUMN rating SET NOT NULL;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_check
  CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_unique
  UNIQUE (booking_id);

-- Keep review identity tied to the booking at the database layer.
CREATE OR REPLACE FUNCTION public.enforce_review_booking_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_id uuid;
  v_professional_id uuid;
  v_status text;
BEGIN
  SELECT
    b.owner_id,
    b.professional_id,
    b.status::text
  INTO
    v_owner_id,
    v_professional_id,
    v_status
  FROM public.bookings AS b
  WHERE b.id = NEW.booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_status <> 'completed' THEN
    RAISE EXCEPTION 'A review can only be created for a completed booking';
  END IF;

  NEW.owner_id := v_owner_id;
  NEW.professional_id := v_professional_id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_review_booking_consistency() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_review_booking_consistency
ON public.reviews;

CREATE TRIGGER trg_enforce_review_booking_consistency
BEFORE INSERT OR UPDATE
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_review_booking_consistency();

-- Aggregate ratings are derived data and must never be maintained by the browser.
CREATE OR REPLACE FUNCTION public.refresh_professional_review_stats(
  p_professional_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.professionals AS p
  SET
    rating = COALESCE(
      (
        SELECT AVG(r.rating)
        FROM public.reviews AS r
        WHERE r.professional_id = p_professional_id
      ),
      0
    ),
    review_count = (
      SELECT COUNT(*)::integer
      FROM public.reviews AS r
      WHERE r.professional_id = p_professional_id
    )
  WHERE p.id = p_professional_id;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_professional_review_stats(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.sync_professional_review_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_professional_review_stats(OLD.professional_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    PERFORM public.refresh_professional_review_stats(OLD.professional_id);

    IF NEW.professional_id IS DISTINCT FROM OLD.professional_id THEN
      PERFORM public.refresh_professional_review_stats(NEW.professional_id);
    END IF;

    RETURN NEW;
  END IF;

  PERFORM public.refresh_professional_review_stats(NEW.professional_id);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_professional_review_stats() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_sync_professional_review_stats
ON public.reviews;

CREATE TRIGGER trg_sync_professional_review_stats
AFTER INSERT OR UPDATE OR DELETE
ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.sync_professional_review_stats();

-- Reset legacy aggregate values from the actual reviews table.
UPDATE public.professionals
SET
  rating = 0,
  review_count = 0;

UPDATE public.professionals AS p
SET
  rating = s.avg_rating,
  review_count = s.review_count
FROM (
  SELECT
    r.professional_id,
    AVG(r.rating) AS avg_rating,
    COUNT(*)::integer AS review_count
  FROM public.reviews AS r
  GROUP BY r.professional_id
) AS s
WHERE p.id = s.professional_id;

-- Single supported review submission API for the new frontend.
CREATE OR REPLACE FUNCTION public.submit_review(
  p_booking_id uuid,
  p_rating integer,
  p_comment text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_owner_id uuid;
  v_review_id uuid;
  v_comment text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;

  v_comment := COALESCE(BTRIM(p_comment), '');

  IF CHAR_LENGTH(v_comment) > 2000 THEN
    RAISE EXCEPTION 'Review comment is too long';
  END IF;

  SELECT b.owner_id
  INTO v_owner_id
  FROM public.bookings AS b
  WHERE b.id = p_booking_id
    AND b.status::text = 'completed';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or not completed';
  END IF;

  IF v_owner_id <> v_user_id THEN
    RAISE EXCEPTION 'You can only review your own booking';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reviews AS r
    WHERE r.booking_id = p_booking_id
  ) THEN
    RAISE EXCEPTION 'A review already exists for this booking';
  END IF;

  INSERT INTO public.reviews (
    booking_id,
    rating,
    comment
  )
  VALUES (
    p_booking_id,
    p_rating,
    v_comment
  )
  RETURNING id INTO v_review_id;

  RETURN v_review_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review(uuid, integer, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_review(uuid, integer, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.submit_review(uuid, integer, text) TO authenticated;

-- Privacy-safe projection for public review rendering.
-- Only the reviewer's first name is exposed; owner_id and booking_id stay private.
CREATE OR REPLACE VIEW public.public_reviews
WITH (security_barrier = true)
AS
SELECT
  r.id,
  r.professional_id,
  r.rating,
  r.comment,
  COALESCE(
    NULLIF(SPLIT_PART(BTRIM(pr.full_name), ' ', 1), ''),
    'Cliente'
  ) AS reviewer_name,
  r.created_at
FROM public.reviews AS r
JOIN public.professionals AS p
  ON p.id = r.professional_id
LEFT JOIN public.profiles AS pr
  ON pr.id = r.owner_id
WHERE p.approved = true
  AND p.approval_status = 'approved';

REVOKE ALL ON TABLE public.public_reviews FROM PUBLIC;
REVOKE ALL ON TABLE public.public_reviews FROM anon;
REVOKE ALL ON TABLE public.public_reviews FROM authenticated;
GRANT SELECT ON TABLE public.public_reviews TO anon, authenticated;

-- Remove mutation paths that the current frontend does not use.
DROP POLICY IF EXISTS "Owner update review" ON public.reviews;
DROP POLICY IF EXISTS "Owner delete review" ON public.reviews;

REVOKE UPDATE, DELETE ON TABLE public.reviews FROM authenticated;

-- Tighten the temporary legacy INSERT policy so old production code remains
-- functional while still obeying the new completed-booking invariant.
DROP POLICY IF EXISTS "Owner create review" ON public.reviews;

CREATE POLICY "Owner create review"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = owner_id
  AND EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.id = booking_id
      AND b.owner_id = auth.uid()
      AND b.professional_id = professional_id
      AND b.status::text = 'completed'
  )
);

-- Intentionally keep the existing "Public view reviews" policy and direct
-- SELECT/INSERT grants until ProfessionalProfile, LocalExcellence, and
-- OwnerBookings have been migrated to public_reviews / submit_review.
-- A follow-up lockdown migration will remove those legacy paths.

COMMIT;
