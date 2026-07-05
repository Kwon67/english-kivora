-- Engagement events for intelligent learning resource recommendations.

CREATE TABLE IF NOT EXISTS public.learning_resource_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL CHECK (char_length(resource_id) BETWEEN 3 AND 120),
  event_type TEXT NOT NULL CHECK (event_type IN ('open')),
  stage TEXT NOT NULL CHECK (stage IN ('diagnostic', 'vocabulary', 'srs-repair', 'listening', 'shadowing', 'reading', 'fluency')),
  level TEXT CHECK (level IS NULL OR level IN ('A1', 'A2', 'B1', 'B2')),
  resource_kind TEXT CHECK (resource_kind IS NULL OR resource_kind IN ('video', 'series', 'reading', 'shadowing', 'listening')),
  resource_title TEXT NOT NULL CHECK (char_length(resource_title) BETWEEN 1 AND 180),
  resource_url TEXT NOT NULL CHECK (char_length(resource_url) BETWEEN 1 AND 1000),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_resource_events_user_created
  ON public.learning_resource_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_resource_events_resource_created
  ON public.learning_resource_events (resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_resource_events_stage_created
  ON public.learning_resource_events (stage, created_at DESC);

ALTER TABLE public.learning_resource_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own learning resource events" ON public.learning_resource_events;
CREATE POLICY "Users can insert their own learning resource events"
  ON public.learning_resource_events FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their own learning resource events" ON public.learning_resource_events;
CREATE POLICY "Users can view their own learning resource events"
  ON public.learning_resource_events FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all learning resource events" ON public.learning_resource_events;
CREATE POLICY "Admins can view all learning resource events"
  ON public.learning_resource_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

GRANT SELECT, INSERT ON public.learning_resource_events TO authenticated;
