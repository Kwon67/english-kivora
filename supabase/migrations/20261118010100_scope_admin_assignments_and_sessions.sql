BEGIN;

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
REVOKE ALL ON public.assignments, public.game_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE, UPDATE (status) ON public.assignments TO authenticated;
GRANT INSERT (id, user_id, pack_id, game_mode, status, assigned_date, assigned_by, reward_badge_id)
  ON public.assignments TO authenticated;
GRANT SELECT, INSERT ON public.game_sessions TO authenticated;

DROP POLICY IF EXISTS "Users can see their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can read own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert own game sessions" ON public.game_sessions;

CREATE POLICY "Users can read own game sessions" ON public.game_sessions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Users can insert own game sessions" ON public.game_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;
