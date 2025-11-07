CREATE OR REPLACE FUNCTION public.fn_get_questions_v3(
  p_category_slug text,
  p_parent_slug text default null,
  p_mode text default null,
  p_tier text default null,
  p_limit int default 20,
  p_user_tier text default 'free',
  p_difficulty text default null,
  p_requires_aircraft boolean default null
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_limit int := LEAST(COALESCE(p_limit, 20), 50);
  v_questions jsonb := '[]'::jsonb;
  v_count int := 0;
  v_results jsonb;
BEGIN
  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question', q.question_text,
          'choices', q.choices,
          'answer_key', q.answer_key,
          'explanations', q.explanations,
          'access_tier', COALESCE(q.access_tier, 'free'),
          'exam_pool', COALESCE(q.exam_pool, false),
          'difficulty', q.difficulty,
          'source', q.source
        )
        ORDER BY q.id ASC
      ),
      '[]'::jsonb
    ),
    COUNT(*)
  INTO v_questions, v_count
  FROM public.questions q
  WHERE
    q.is_active = true
    AND q.status = 'published'
    AND q.category_slugs @> jsonb_build_array(p_category_slug)
    AND (p_mode IS NULL OR lower(p_mode) <> 'exam' OR q.exam_pool = true)
    AND (
      (lower(p_user_tier) = 'free' AND COALESCE(q.access_tier, 'free') = 'free')
      OR (lower(p_user_tier) <> 'free' AND COALESCE(q.access_tier, 'free') IN ('free', 'pro'))
    )
    AND (p_tier IS NULL OR lower(p_tier) <> 'pro' OR q.access_tier = 'pro')
    AND (p_difficulty IS NULL OR lower(q.difficulty) = lower(p_difficulty))
    AND (
      p_requires_aircraft IS DISTINCT FROM TRUE
      OR EXISTS (
        SELECT 1
        FROM public.categories c
        JOIN LATERAL jsonb_array_elements_text(COALESCE(q.category_slugs, '[]'::jsonb)) AS qs(slug)
          ON qs.slug = c.slug
        WHERE c.requires_aircraft IS TRUE
          AND (p_category_slug IS NULL OR qs.slug = p_category_slug)
      )
    )
  ORDER BY q.id ASC
  LIMIT v_limit;

  v_results := jsonb_build_object(
    'success', true,
    'parent_slug', p_parent_slug,
    'category_slug', p_category_slug,
    'mode', p_mode,
    'tier', p_tier,
    'difficulty', p_difficulty,
    'requires_aircraft', p_requires_aircraft,
    'user_tier', p_user_tier,
    'limit', v_limit,
    'count', v_count,
    'questions', v_questions
  );

  RETURN v_results;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_questions_v3(text, text, text, text, int, text, text, boolean)
TO anon, authenticated, service_role;
