ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS assigned_by text NOT NULL DEFAULT 'admin'
CHECK (assigned_by IN ('admin', 'self'));

UPDATE public.assignments
SET assigned_by = 'self'
WHERE assigned_by = 'admin'
  AND reward_badge_id IS NULL
  AND game_mode <> 'scheduled_review'
  AND (status = 'pending' OR status LIKE 'pending|%')
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = assignments.user_id
      AND profiles.role = 'admin'
  );

DROP POLICY IF EXISTS "Users can delete their own self assignments" ON public.assignments;

CREATE POLICY "Users can delete their own self assignments"
ON public.assignments FOR DELETE
USING (
  user_id = (SELECT auth.uid())
  AND assigned_by = 'self'
  AND status NOT LIKE 'completed%'
);