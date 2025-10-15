CREATE OR REPLACE FUNCTION public.fn_validate_rpc_health()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists bool := false;
  v_executable bool := false;
  v_grants jsonb := '[]'::jsonb;
  v_sample jsonb;
  v_has_keys bool := false;
BEGIN
  -- Check if fn_get_questions_v3 exists
  SELECT EXISTS(
    SELECT 1
    FROM pg_proc
    WHERE proname = 'fn_get_questions_v3'
  ) INTO v_exists;

  -- Check grants
  SELECT jsonb_agg(grantee) INTO v_grants
  FROM information_schema.role_routine_grants
  WHERE routine_name = 'fn_get_questions_v3';

  -- Check if executable by anon or service_role
  IF v_grants ?| array['anon','service_role'] THEN
    v_executable := true;
  END IF;

  -- Try to execute a sample query (safe)
  BEGIN
    SELECT public.fn_get_questions_v3('ata27', 'a320', null, null, 1)
    INTO v_sample;
  EXCEPTION
    WHEN others THEN
      v_sample := jsonb_build_object('error', SQLERRM);
  END;

  -- Check if response contains expected keys
  IF v_sample ? 'success' AND v_sample ? 'questions' THEN
    v_has_keys := true;
  END IF;

  RETURN jsonb_build_object(
    'rpc_exists', v_exists,
    'rpc_executable', v_executable,
    'grants', v_grants,
    'returns_expected_keys', v_has_keys,
    'timestamp', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_validate_rpc_health() TO anon, authenticated, service_role;
