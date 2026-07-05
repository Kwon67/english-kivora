-- Daily intelligent plan snapshots and lightweight outcome tracking.

CREATE TABLE IF NOT EXISTS public.learning_plan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('diagnostic', 'vocabulary', 'srs-repair', 'listening', 'shadowing', 'reading', 'fluency')),
  level TEXT CHECK (level IS NULL OR level IN ('A1', 'A2', 'B1', 'B2')),
  headline TEXT NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 220),
  primary_action_id TEXT NOT NULL CHECK (char_length(primary_action_id) BETWEEN 1 AND 120),
  primary_action_href TEXT NOT NULL CHECK (char_length(primary_action_href) BETWEEN 1 AND 1000),
  resource_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  signals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  outcome_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (outcome_status IN ('pending', 'engaged', 'improved', 'stalled')),
  outcome_notes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, plan_date)
);

CREATE INDEX IF NOT EXISTS idx_learning_plan_history_user_date
  ON public.learning_plan_history (user_id, plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_learning_plan_history_stage_date
  ON public.learning_plan_history (stage, plan_date DESC);

ALTER TABLE public.learning_plan_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own learning plan history" ON public.learning_plan_history;
CREATE POLICY "Users can insert their own learning plan history"
  ON public.learning_plan_history FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own learning plan history" ON public.learning_plan_history;
CREATE POLICY "Users can update their own learning plan history"
  ON public.learning_plan_history FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own learning plan history" ON public.learning_plan_history;
CREATE POLICY "Users can view their own learning plan history"
  ON public.learning_plan_history FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all learning plan history" ON public.learning_plan_history;
CREATE POLICY "Admins can view all learning plan history"
  ON public.learning_plan_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.learning_plan_history TO authenticated;
