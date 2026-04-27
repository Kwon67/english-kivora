ALTER TABLE public.arena_duels
  ADD COLUMN IF NOT EXISTS player1_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player1_wrong INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS player2_wrong INTEGER NOT NULL DEFAULT 0;

DROP POLICY IF EXISTS "Authenticated users can view completed arena results." ON public.arena_duels;
CREATE POLICY "Authenticated users can view completed arena results."
ON public.arena_duels FOR SELECT
USING (
  (select auth.uid()) IS NOT NULL
  AND status IN ('finished', 'cancelled')
);
