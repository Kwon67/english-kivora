-- Preserve access for accounts that existed before the onboarding rollout and
-- expand the adaptive placement log to the app's full learner scope (A1-B2).

INSERT INTO public.user_onboarding (
  user_id,
  onboarding_completed_at
)
SELECT
  profiles.id,
  TIMESTAMPTZ '2026-07-01 12:00:00+00'
FROM public.profiles AS profiles
WHERE
  profiles.created_at < TIMESTAMPTZ '2026-07-01 12:00:00+00'
  OR profiles.role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.placement_responses
  DROP CONSTRAINT IF EXISTS placement_responses_pack_level_check;

ALTER TABLE public.placement_responses
  ADD CONSTRAINT placement_responses_pack_level_check
  CHECK (pack_level IN ('A1', 'A2', 'B1', 'B2'));
