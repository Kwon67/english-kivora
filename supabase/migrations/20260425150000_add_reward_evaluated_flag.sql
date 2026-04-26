-- Add reward_evaluated to track if a competitive mission has been processed
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS reward_evaluated BOOLEAN NOT NULL DEFAULT false;

-- Add index to help cron job performance
CREATE INDEX IF NOT EXISTS assignments_reward_evaluation_idx ON public.assignments (assigned_date, reward_badge_id, reward_evaluated) WHERE reward_badge_id IS NOT NULL AND reward_evaluated = false;
