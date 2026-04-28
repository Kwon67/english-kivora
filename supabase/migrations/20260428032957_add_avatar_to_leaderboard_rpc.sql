DROP FUNCTION IF EXISTS public.get_weekly_leaderboard(timestamptz);

CREATE OR REPLACE FUNCTION public.get_weekly_leaderboard(window_start timestamptz DEFAULT NULL)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  username text,
  avatar_url text,
  score integer,
  accuracy integer,
  sessions integer,
  best_streak integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH leaderboard_base AS (
    SELECT
      p.id AS user_id,
      COALESCE(p.username, 'Membro') AS username,
      p.avatar_url AS avatar_url,
      COALESCE(
        SUM(
          gs.correct_answers * 2 +
          GREATEST(0, 4 - gs.wrong_answers) +
          LEAST(gs.max_streak, 12)
        ),
        0
      )::integer AS score,
      CASE
        WHEN COALESCE(SUM(gs.correct_answers + gs.wrong_answers), 0) > 0
          THEN ROUND(
            (SUM(gs.correct_answers)::numeric / SUM(gs.correct_answers + gs.wrong_answers)::numeric) * 100
          )::integer
        ELSE 0
      END AS accuracy,
      COUNT(gs.id)::integer AS sessions,
      COALESCE(MAX(gs.max_streak), 0)::integer AS best_streak
    FROM public.profiles p
    LEFT JOIN public.game_sessions gs
      ON gs.user_id = p.id
     AND gs.completed_at >= COALESCE(window_start, NOW() - interval '7 days')
    GROUP BY p.id, p.username, p.avatar_url
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY score DESC, accuracy DESC, sessions DESC, username ASC)::bigint AS rank,
    user_id,
    username,
    avatar_url,
    score,
    accuracy,
    sessions,
    best_streak
  FROM leaderboard_base
  ORDER BY rank;
$$;
