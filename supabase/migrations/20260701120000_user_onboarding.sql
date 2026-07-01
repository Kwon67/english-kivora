-- User onboarding wizard state (level, goals, interests, starter pack)

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  onboarding_completed_at TIMESTAMPTZ,
  level_source TEXT CHECK (level_source IS NULL OR level_source IN ('manual', 'placement', 'skipped')),
  placement_confidence INTEGER CHECK (placement_confidence IS NULL OR (placement_confidence >= 0 AND placement_confidence <= 100)),
  daily_goal_minutes INTEGER CHECK (daily_goal_minutes IS NULL OR daily_goal_minutes IN (5, 10, 15)),
  interests TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  starter_pack_id UUID REFERENCES public.packs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_incomplete
  ON public.user_onboarding (user_id)
  WHERE onboarding_completed_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_user_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_onboarding_updated_at ON public.user_onboarding;

CREATE TRIGGER trigger_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_onboarding_updated_at();

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can view their own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can insert their own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can update their own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;