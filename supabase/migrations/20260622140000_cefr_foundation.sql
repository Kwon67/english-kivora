-- Phase 2: CEFR foundation — unified pack levels + adaptive learner assessment

-- Cards: ensure audio_url exists for listening mode
ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Packs: migrate legacy difficulty labels to CEFR
ALTER TABLE public.packs DROP CONSTRAINT IF EXISTS packs_level_check;

UPDATE public.packs
SET level = CASE
  WHEN level IS NULL THEN NULL
  WHEN lower(level) IN ('beginner', 'easy', 'a1') THEN 'A1'
  WHEN lower(level) IN ('a2', 'elementary') THEN 'A2'
  WHEN lower(level) IN ('intermediate', 'medium', 'b1') THEN 'B1'
  WHEN lower(level) IN ('advanced', 'hard', 'b2') THEN 'B2'
  WHEN lower(level) IN ('c1') THEN 'C1'
  WHEN lower(level) IN ('c2') THEN 'C2'
  WHEN level ~* 'A1' THEN 'A1'
  WHEN level ~* 'A2' THEN 'A2'
  WHEN level ~* 'B1' THEN 'B1'
  WHEN level ~* 'B2' THEN 'B2'
  WHEN level ~* 'C1' THEN 'C1'
  WHEN level ~* 'C2' THEN 'C2'
  ELSE NULL
END;

ALTER TABLE public.packs
  ADD CONSTRAINT packs_level_check
  CHECK (level IS NULL OR level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));

-- Adaptive CEFR assessment (A1–B2 product scope; C1/C2 reserved)
CREATE TABLE IF NOT EXISTS public.user_cefr_assessments (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  estimated_level TEXT CHECK (estimated_level IS NULL OR estimated_level IN ('A1', 'A2', 'B1', 'B2')),
  confidence INTEGER NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 100),
  total_interactions INTEGER NOT NULL DEFAULT 0,
  level_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  level_source TEXT NOT NULL DEFAULT 'auto' CHECK (level_source IN ('auto', 'manual')),
  assessed_at TIMESTAMPTZ,
  previous_level TEXT,
  level_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_cefr_assessments_level
  ON public.user_cefr_assessments (estimated_level)
  WHERE estimated_level IS NOT NULL;

CREATE OR REPLACE FUNCTION public.update_user_cefr_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_cefr_assessments_updated_at ON public.user_cefr_assessments;

CREATE TRIGGER trigger_user_cefr_assessments_updated_at
  BEFORE UPDATE ON public.user_cefr_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_cefr_assessments_updated_at();

ALTER TABLE public.user_cefr_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own CEFR assessment" ON public.user_cefr_assessments;
CREATE POLICY "Users can view their own CEFR assessment"
  ON public.user_cefr_assessments FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own CEFR assessment" ON public.user_cefr_assessments;
CREATE POLICY "Users can insert their own CEFR assessment"
  ON public.user_cefr_assessments FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own CEFR assessment" ON public.user_cefr_assessments;
CREATE POLICY "Users can update their own CEFR assessment"
  ON public.user_cefr_assessments FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all CEFR assessments" ON public.user_cefr_assessments;
CREATE POLICY "Admins can view all CEFR assessments"
  ON public.user_cefr_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage all CEFR assessments" ON public.user_cefr_assessments;
CREATE POLICY "Admins can manage all CEFR assessments"
  ON public.user_cefr_assessments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );