-- Final lockdown of legacy public table access.
-- Public consumers must use:
--   public.public_professional_profiles
--   public.search_public_professionals(...)
--   public.public_reviews
-- Review creation must use:
--   public.submit_review(...)

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Remove legacy public RLS policies from private/base tables.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public view professional profiles"
ON public.profiles;

DROP POLICY IF EXISTS "Public view approved pros"
ON public.professionals;

DROP POLICY IF EXISTS "Public view reviews"
ON public.reviews;

-- Direct review creation is now replaced by submit_review().
DROP POLICY IF EXISTS "Owner create review"
ON public.reviews;

-- ---------------------------------------------------------------------------
-- 2. Remove direct base-table access from public/anonymous clients.
--
-- Authenticated SELECT on profiles/professionals is intentionally retained:
-- RLS still limits it to legitimate self/admin/professional workflows.
-- ---------------------------------------------------------------------------

REVOKE SELECT ON TABLE public.profiles FROM anon;
REVOKE SELECT ON TABLE public.professionals FROM anon;

REVOKE SELECT, INSERT, UPDATE, DELETE
ON TABLE public.reviews
FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Make professional rating/review_count truly derived from reviews.
--
-- Historical table-wide UPDATE privileges plus "pro updates own record" RLS
-- could otherwise let a professional write arbitrary aggregate values.
-- This trigger overwrites any attempted rating/review_count update with the
-- current values derived from public.reviews.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_professional_review_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rating numeric;
  v_review_count integer;
BEGIN
  SELECT
    COALESCE(AVG(r.rating), 0),
    COUNT(*)::integer
  INTO
    v_rating,
    v_review_count
  FROM public.reviews AS r
  WHERE r.professional_id = NEW.id;

  NEW.rating := v_rating;
  NEW.review_count := v_review_count;

  RETURN NEW;
END;
$$;

REVOKE ALL
ON FUNCTION public.enforce_professional_review_aggregates()
FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_enforce_professional_review_aggregates
ON public.professionals;

CREATE TRIGGER trg_enforce_professional_review_aggregates
BEFORE UPDATE OF rating, review_count
ON public.professionals
FOR EACH ROW
EXECUTE FUNCTION public.enforce_professional_review_aggregates();

COMMIT;
