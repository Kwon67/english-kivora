-- Member-added packs completed before assigned_by backfill stayed as admin.
UPDATE public.assignments
SET assigned_by = 'self'
WHERE assigned_by = 'admin'
  AND reward_badge_id IS NULL
  AND game_mode <> 'scheduled_review'
  AND status LIKE 'completed%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = assignments.user_id
      AND profiles.role = 'admin'
  );