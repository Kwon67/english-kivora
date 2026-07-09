-- Harden profile SELECT (own row or admin) and expose Blitz leaderboard via SECURITY DEFINER RPC.
-- Prevents authenticated clients from enumerating all profiles via PostgREST.

-- ---------------------------------------------------------------------------
-- Helper: is_admin() (SECURITY DEFINER avoids recursive RLS on profiles)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profiles: replace permissive SELECT policies
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR public.is_admin()
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

-- No anonymous profile directory. Email remains excluded from column grants.
REVOKE SELECT ON TABLE public.profiles FROM anon;

REVOKE SELECT ON TABLE public.profiles FROM authenticated;
GRANT SELECT (
  id,
  username,
  role,
  created_at,
  updated_at,
  last_seen_at,
  avatar_url,
  cover_url,
  bio,
  description,
  weekly_report_enabled
) ON TABLE public.profiles TO authenticated;

-- Mutations stay server-side (service role) for privileged fields.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Blitz: own-row reads only; weekly leaderboard via RPC (includes usernames)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read blitz leaderboard" ON public.blitz_runs;

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
SET search_path = public
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
    ranked.user_id,
    ranked.username,
    ranked.score,
    ranked.max_combo
  FROM ranked
  ORDER BY ranked.rank
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 200));
$$;

REVOKE ALL ON FUNCTION public.get_weekly_blitz_leaderboard(timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_weekly_blitz_leaderboard(timestamptz, integer) TO authenticated, service_role;
