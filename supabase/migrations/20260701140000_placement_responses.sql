-- CAT placement response log + optional study context on onboarding

CREATE TABLE IF NOT EXISTS public.placement_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  pack_level TEXT NOT NULL CHECK (pack_level IN ('A1', 'A2', 'B1')),
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
  question_index INTEGER NOT NULL CHECK (question_index >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_placement_responses_user_created
  ON public.placement_responses (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_placement_responses_card
  ON public.placement_responses (card_id);

ALTER TABLE public.placement_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own placement responses" ON public.placement_responses;
CREATE POLICY "Users can view their own placement responses"
  ON public.placement_responses FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own placement responses" ON public.placement_responses;
CREATE POLICY "Users can insert their own placement responses"
  ON public.placement_responses FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all placement responses" ON public.placement_responses;
CREATE POLICY "Admins can view all placement responses"
  ON public.placement_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.placement_responses TO authenticated;

ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS study_experience TEXT
  CHECK (study_experience IS NULL OR study_experience IN ('less_than_1_year', '1_3_years', 'more_than_3_years'));