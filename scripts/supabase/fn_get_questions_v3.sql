CREATE OR REPLACE FUNCTION public.fn_get_questions_v3(
  p_category_slug        text,
  p_include_descendants  boolean DEFAULT true,
  p_difficulty           text DEFAULT 'all',
  p_requires_aircraft    boolean DEFAULT false,
  p_user_tier            text DEFAULT 'free',
  p_limit                int DEFAULT 20
)
RETURNS SETOF public.questions_v3
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 20), 50);
BEGIN
  RETURN QUERY
  SELECT q.*
  FROM public.questions_v3 q
  WHERE q.is_active IS TRUE
    AND q.status = 'published'
    AND (
      (p_include_descendants IS TRUE AND q.category_slugs @> jsonb_build_array(p_category_slug))
      OR (q.category_slugs ? p_category_slug)
    )
    AND (
      p_difficulty = 'all'
      OR lower(q.difficulty) = lower(p_difficulty)
    )
    AND (
      p_requires_aircraft IS NOT TRUE
      OR q.requires_aircraft IS TRUE
    )
    AND (
      lower(p_user_tier) = 'free'
        AND COALESCE(q.access_tier, 'free') = 'free'
      OR lower(p_user_tier) <> 'free'
        AND COALESCE(q.access_tier, 'free') IN ('free', 'pro')
    )
  ORDER BY q.created_at DESC
  LIMIT v_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_questions_v3(text, boolean, text, boolean, text, int)
TO anon, authenticated, service_role;
