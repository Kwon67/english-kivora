-- Kivora English RLS hardening (legacy manual script).
-- Prefer the versioned migration:
--   supabase/migrations/20260709120000_profiles_rls_and_blitz_leaderboard_rpc.sql
-- which hardens profiles SELECT and adds get_weekly_blitz_leaderboard().
-- Server-side admin flows should use the service_role client, which bypasses RLS by design.

-- 1. Profiles: strict self-access for authenticated users.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

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

-- 2. Assignments / progress: users only read or update their own rows.
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can create their own assignments for visible packs" ON public.assignments;
DROP POLICY IF EXISTS "Users can read own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;

CREATE POLICY "Users can read own assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own assignments"
ON public.assignments
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create their own assignments for visible packs"
ON public.assignments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND assigned_by = 'self'
  AND reward_badge_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.packs
    WHERE packs.id = assignments.pack_id
      AND (
        COALESCE(packs.is_public, true)
        OR packs.owner_id = (SELECT auth.uid())
      )
  )
);

-- 3. Game sessions: user-owned progress only.
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can read own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert own game sessions" ON public.game_sessions;

CREATE POLICY "Users can read own game sessions"
ON public.game_sessions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own game sessions"
ON public.game_sessions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- 4. Card reviews: user-owned spaced repetition data only.
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own card reviews" ON public.card_reviews;
DROP POLICY IF EXISTS "Users can insert their own card reviews" ON public.card_reviews;
DROP POLICY IF EXISTS "Users can update their own card reviews" ON public.card_reviews;
DROP POLICY IF EXISTS "Users can delete their own card reviews" ON public.card_reviews;

CREATE POLICY "Users can view their own card reviews"
ON public.card_reviews
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own card reviews"
ON public.card_reviews
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own card reviews"
ON public.card_reviews
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own card reviews"
ON public.card_reviews
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 5. Arena duels: only participants can read. Mutations should stay server-side.
ALTER TABLE public.arena_duels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view completed arena results." ON public.arena_duels;
DROP POLICY IF EXISTS "Players can view their duels" ON public.arena_duels;

CREATE POLICY "Players can view their duels"
ON public.arena_duels
FOR SELECT
TO authenticated
USING (
  player1_id = (SELECT auth.uid())
  OR player2_id = (SELECT auth.uid())
);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.arena_duels FROM anon, authenticated;

-- 6. Push subscriptions: private endpoint keys must be user-owned.
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view own push subscriptions"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own push subscriptions"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own push subscriptions"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 7. Badges: users can read only their own earned badges.
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;

CREATE POLICY "Users can view their own badges"
ON public.user_badges
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 8. Security events: no direct client access.
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service_role can manage security events" ON public.security_events;
CREATE POLICY "Only service_role can manage security events"
ON public.security_events
FOR ALL
USING (false)
WITH CHECK (false);
