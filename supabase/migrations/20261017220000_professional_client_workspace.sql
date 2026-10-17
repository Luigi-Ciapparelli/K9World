-- Private client workspace. Existing notes and tags are preserved.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='90s';

CREATE OR REPLACE FUNCTION pc_private.get_professional_clients()
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
        SUM(eb.price) FILTER (WHERE eb.status = 'completed' AND eb.price >= 0 AND eb.price < 'Infinity'::numeric),
        0
      ) AS total_spend,
      MAX(eb.start_at) FILTER (WHERE eb.status = 'completed') AS last_visit
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
            AND d.owner_id = pr.id
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

-- Bound the browser response; notes are loaded only after opening a client.
CREATE FUNCTION pc_private.get_professional_client_page(p_query text DEFAULT '',p_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); answer jsonb; query text:=lower(btrim(coalesce(p_query,'')));
BEGIN
 IF actor IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.professionals pro JOIN public.profiles p ON p.id=pro.id
  JOIN auth.users u ON u.id=p.id WHERE pro.id=actor AND p.role='professional' AND u.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Professional account required' USING ERRCODE='42501'; END IF;
 IF length(query)>100 OR p_page IS NULL OR p_page<0 OR p_page>10000 THEN
  RAISE EXCEPTION 'Invalid client search' USING ERRCODE='22023'; END IF;
 WITH matching AS MATERIALIZED (
  SELECT c.* FROM pc_private.get_professional_clients() c
  WHERE query='' OR strpos(lower(c.full_name),query)>0
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(c.dogs) dog WHERE strpos(lower(dog->>'name'),query)>0)
   OR EXISTS(SELECT 1 FROM unnest(c.tags) tag WHERE strpos(lower(tag),query)>0)
 ), page AS (
  SELECT c.*, (SELECT count(*) FROM public.bookings b WHERE b.professional_id=actor
    AND b.owner_id=c.id AND b.status='completed' AND (b.price IS NULL OR b.price<0 OR b.price>='Infinity'::numeric)) AS missing_prices,
    (SELECT min(b.start_at) FROM public.bookings b WHERE b.professional_id=actor
    AND b.owner_id=c.id AND b.status='accepted' AND b.start_at>=statement_timestamp()) AS next_booking
  FROM matching c ORDER BY lower(c.full_name),c.id LIMIT 20 OFFSET p_page*20
 )
 SELECT jsonb_build_object('total',(SELECT count(*) FROM matching),'page',p_page,
  'rows',coalesce((SELECT jsonb_agg(to_jsonb(c)-'avatar_url' ORDER BY lower(c.full_name),c.id) FROM page c),'[]'::jsonb)) INTO answer;
 RETURN answer;
END $$;

-- A stable UUID makes retries safe, including after a lost HTTP response.
-- Existing RLS/direct write permissions are retained for deployment compatibility.
CREATE FUNCTION pc_private.save_professional_client_item(p_client_id uuid,p_request_id uuid,p_kind text,p_text text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); body text:=btrim(p_text); note public.client_notes; tag public.client_tags;
BEGIN
 IF actor IS NULL OR NOT EXISTS (
  SELECT 1 FROM public.professionals pro JOIN public.profiles p ON p.id=pro.id
  JOIN auth.users u ON u.id=p.id WHERE pro.id=actor AND p.role='professional' AND u.email_confirmed_at IS NOT NULL
 ) THEN RAISE EXCEPTION 'Professional account required' USING ERRCODE='42501'; END IF;
 IF p_request_id IS NULL OR p_client_id IS NULL OR p_kind IS NULL OR p_kind NOT IN ('note','tag')
  OR body IS NULL OR body='' OR length(body)>(CASE WHEN p_kind='note' THEN 5000 ELSE 60 END) THEN
  RAISE EXCEPTION 'Invalid private client item' USING ERRCODE='22023'; END IF;
 -- Retain one qualifying booking until commit, also against concurrent revocation.
 PERFORM b.id FROM public.bookings b WHERE b.professional_id=actor AND b.owner_id=p_client_id
  AND b.status IN ('accepted','completed') ORDER BY b.id LIMIT 1 FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Client unavailable' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(actor::text||':'||p_client_id::text,0));
 IF p_kind='note' THEN
  INSERT INTO public.client_notes(id,professional_id,client_id,content)
   VALUES(p_request_id,actor,p_client_id,body) ON CONFLICT(id) DO NOTHING;
  SELECT * INTO note FROM public.client_notes n WHERE n.id=p_request_id
   AND n.professional_id=actor AND n.client_id=p_client_id AND n.content=body;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request identifier already used' USING ERRCODE='22023'; END IF;
  RETURN jsonb_build_object('id',note.id,'content',note.content,'created_at',note.created_at);
 ELSE
  -- Retry IDs cannot be reused for other clients or texts.
  IF EXISTS(SELECT 1 FROM public.client_tags t WHERE t.id=p_request_id
    AND (t.professional_id<>actor OR t.client_id<>p_client_id OR lower(btrim(t.tag))<>lower(body))) THEN
   RAISE EXCEPTION 'Request identifier already used' USING ERRCODE='22023'; END IF;
  SELECT * INTO tag FROM public.client_tags t WHERE t.professional_id=actor AND t.client_id=p_client_id
    AND lower(btrim(t.tag))=lower(body) ORDER BY t.created_at,t.id LIMIT 1;
  IF NOT FOUND THEN
   INSERT INTO public.client_tags(id,professional_id,client_id,tag) VALUES(p_request_id,actor,p_client_id,body)
    ON CONFLICT(id) DO NOTHING;
   SELECT * INTO tag FROM public.client_tags t WHERE t.id=p_request_id AND t.professional_id=actor
    AND t.client_id=p_client_id AND lower(btrim(t.tag))=lower(body);
   IF NOT FOUND THEN RAISE EXCEPTION 'Request identifier already used' USING ERRCODE='22023'; END IF;
  END IF;
  RETURN jsonb_build_object('id',tag.id,'tag',tag.tag,'created_at',tag.created_at);
 END IF;
END $$;
CREATE FUNCTION public.get_professional_client_page(p_query text DEFAULT '',p_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.get_professional_client_page(p_query,p_page);
$$;
CREATE FUNCTION public.save_professional_client_item(p_client_id uuid,p_request_id uuid,p_kind text,p_text text)
RETURNS jsonb LANGUAGE sql VOLATILE SECURITY INVOKER SET search_path='' AS $$
 SELECT pc_private.save_professional_client_item(p_client_id,p_request_id,p_kind,p_text);
$$;
REVOKE ALL ON FUNCTION pc_private.get_professional_client_page(text,integer),public.get_professional_client_page(text,integer),
 pc_private.save_professional_client_item(uuid,uuid,text,text),public.save_professional_client_item(uuid,uuid,text,text)
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION pc_private.get_professional_client_page(text,integer),public.get_professional_client_page(text,integer),
 pc_private.save_professional_client_item(uuid,uuid,text,text),public.save_professional_client_item(uuid,uuid,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
