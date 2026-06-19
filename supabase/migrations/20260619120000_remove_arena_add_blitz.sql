-- Remove arena tables and add blitz runs

DROP TABLE IF EXISTS public.arena_speech_attempts;
DROP TABLE IF EXISTS public.arena_ghost_recordings;
DROP TABLE IF EXISTS public.arena_duels;

DELETE FROM public.badges WHERE condition_type = 'arena_wins';

INSERT INTO public.badges (name, description, icon_name, condition_type, target_value)
SELECT
  'Relâmpago',
  'Alcance 1000 pontos em uma partida de Blitz.',
  'Zap',
  'blitz_score',
  1000
WHERE NOT EXISTS (
  SELECT 1 FROM public.badges WHERE condition_type = 'blitz_score'
);

CREATE TABLE public.blitz_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  max_combo integer NOT NULL DEFAULT 0 CHECK (max_combo >= 0),
  cards_answered integer NOT NULL DEFAULT 0 CHECK (cards_answered >= 0),
  duration_ms integer NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blitz_runs_user_created_idx ON public.blitz_runs (user_id, created_at DESC);
CREATE INDEX blitz_runs_created_score_idx ON public.blitz_runs (created_at DESC, score DESC);

ALTER TABLE public.blitz_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own blitz runs"
ON public.blitz_runs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own blitz runs"
ON public.blitz_runs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read blitz leaderboard"
ON public.blitz_runs FOR SELECT
TO authenticated
USING (true);

GRANT SELECT, INSERT ON public.blitz_runs TO authenticated;