DROP POLICY IF EXISTS "Players can create their own arena duels." ON public.arena_duels;
CREATE POLICY "Players can create their own arena duels."
ON public.arena_duels FOR INSERT
WITH CHECK (
  (select auth.uid()) = player1_id
  AND player1_id <> player2_id
);
