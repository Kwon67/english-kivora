CREATE TABLE IF NOT EXISTS public.arena_speech_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duel_id UUID NOT NULL REFERENCES public.arena_duels(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  transcript TEXT NOT NULL DEFAULT '',
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  accepted BOOLEAN NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (duration_ms >= 0),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT arena_speech_attempts_one_per_card UNIQUE (duel_id, player_id, card_id)
);

CREATE INDEX IF NOT EXISTS arena_speech_attempts_duel_id_idx
ON public.arena_speech_attempts(duel_id);

CREATE INDEX IF NOT EXISTS arena_speech_attempts_player_id_idx
ON public.arena_speech_attempts(player_id);

ALTER TABLE public.arena_speech_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view their own arena speech attempts." ON public.arena_speech_attempts;
CREATE POLICY "Players can view their own arena speech attempts."
ON public.arena_speech_attempts FOR SELECT
USING (
  (select auth.uid()) = player_id
  OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (select auth.uid())
      AND profiles.role = 'admin'
  )
);

CREATE OR REPLACE FUNCTION public.apply_arena_speech_attempt_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.arena_duels
  SET
    player1_score = player1_score + CASE WHEN NEW.player_id = player1_id AND NEW.accepted THEN 1 ELSE 0 END,
    player1_wrong = player1_wrong + CASE WHEN NEW.player_id = player1_id AND NOT NEW.accepted THEN 1 ELSE 0 END,
    player2_score = player2_score + CASE WHEN NEW.player_id = player2_id AND NEW.accepted THEN 1 ELSE 0 END,
    player2_wrong = player2_wrong + CASE WHEN NEW.player_id = player2_id AND NOT NEW.accepted THEN 1 ELSE 0 END
  WHERE id = NEW.duel_id
    AND status = 'active'
    AND game_type = 'speaking'
    AND (NEW.player_id = player1_id OR NEW.player_id = player2_id)
    AND EXISTS (
      SELECT 1
      FROM public.cards
      WHERE cards.id = NEW.card_id
        AND cards.pack_id = arena_duels.pack_id
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid arena speech attempt';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS apply_arena_speech_attempt_score_trigger ON public.arena_speech_attempts;
CREATE TRIGGER apply_arena_speech_attempt_score_trigger
AFTER INSERT ON public.arena_speech_attempts
FOR EACH ROW
EXECUTE FUNCTION public.apply_arena_speech_attempt_score();

CREATE OR REPLACE FUNCTION public.prevent_direct_arena_speaking_score_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role TEXT;
BEGIN
  jwt_role := COALESCE(current_setting('request.jwt.claim.role', true), '');

  IF OLD.game_type = 'speaking'
    AND jwt_role <> 'service_role'
    AND (
      NEW.player1_score IS DISTINCT FROM OLD.player1_score
      OR NEW.player1_wrong IS DISTINCT FROM OLD.player1_wrong
      OR NEW.player2_score IS DISTINCT FROM OLD.player2_score
      OR NEW.player2_wrong IS DISTINCT FROM OLD.player2_wrong
    )
  THEN
    RAISE EXCEPTION 'Speaking arena scores are server-authoritative';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_direct_arena_speaking_score_update_trigger ON public.arena_duels;
CREATE TRIGGER prevent_direct_arena_speaking_score_update_trigger
BEFORE UPDATE ON public.arena_duels
FOR EACH ROW
EXECUTE FUNCTION public.prevent_direct_arena_speaking_score_update();
