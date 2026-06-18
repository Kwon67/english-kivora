-- Members must be able to add packs to their routine and start a new session ("study again").
-- security_rls_hardening.sql removed the INSERT policy; restore it with self-assign guards.

DROP POLICY IF EXISTS "Users can create their own assignments for visible packs" ON public.assignments;

CREATE POLICY "Users can create their own assignments for visible packs"
ON public.assignments FOR INSERT
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

DROP POLICY IF EXISTS "Users can update their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON public.assignments;

CREATE POLICY "Users can update own assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can see their own assignments" ON public.assignments;
DROP POLICY IF EXISTS "Users can read own assignments" ON public.assignments;

CREATE POLICY "Users can read own assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  )
);