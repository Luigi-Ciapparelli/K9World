-- Minimal authenticated booking projection. Does not open profiles or CRM.
BEGIN;

CREATE FUNCTION public.get_professional_bookings()
RETURNS TABLE (
  id uuid,
  start_at timestamptz,
  status text,
  price numeric,
  notes text,
  client_name text,
  request_priority integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_professional_id uuid := auth.uid();
BEGIN
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.professionals AS pro WHERE pro.id = v_professional_id
  ) THEN
    RAISE EXCEPTION 'Professional account required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT b.id, b.start_at::timestamptz, b.status::text, b.price::numeric,
    b.notes::text,
    COALESCE(NULLIF(BTRIM(pr.full_name), ''), 'Nome non indicato')::text,
    CASE b.status WHEN 'pending' THEN 0 WHEN 'accepted' THEN 1 ELSE 2 END
  FROM public.bookings AS b
  LEFT JOIN public.profiles AS pr ON pr.id = b.owner_id
  WHERE b.professional_id = v_professional_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_professional_bookings() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_professional_bookings() TO authenticated;
COMMENT ON FUNCTION public.get_professional_bookings() IS
  'Own professional bookings only, including pending requester name and booking notes; no contact details or general profile access.';
COMMIT;
