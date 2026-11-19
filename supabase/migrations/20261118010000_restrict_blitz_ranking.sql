BEGIN;

CREATE OR REPLACE FUNCTION public.get_weekly_blitz_leaderboard(
  p_window_start timestamptz,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  score integer,
  max_combo integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH best AS (
    SELECT DISTINCT ON (br.user_id)
      br.user_id,
      br.score,
      br.max_combo
    FROM public.blitz_runs br
    WHERE br.created_at >= p_window_start
    ORDER BY br.user_id, br.score DESC, br.max_combo DESC
  ),
  ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY b.score DESC, b.max_combo DESC)::bigint AS rank,
      b.user_id,
      COALESCE(p.username, 'Membro')::text AS username,
      b.score,
      b.max_combo
    FROM best b
    LEFT JOIN public.profiles p ON p.id = b.user_id
  )
  SELECT
    ranked.rank,
    CASE WHEN ranked.user_id = (SELECT auth.uid()) THEN ranked.user_id END,
    ranked.username,
    ranked.score,
    ranked.max_combo
  FROM ranked
  ORDER BY ranked.rank
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$$;

-- Supabase grants functions directly to API roles as well as through PUBLIC.
REVOKE EXECUTE ON FUNCTION public.get_weekly_blitz_leaderboard(timestamptz, integer)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_blitz_leaderboard(timestamptz, integer)
  TO authenticated;

COMMIT;
