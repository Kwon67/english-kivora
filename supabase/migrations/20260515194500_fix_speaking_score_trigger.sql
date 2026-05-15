-- Fix speaking score trigger to support both old and new PostgREST JWT claim formats
-- The old format uses request.jwt.claim.role, the new format uses request.jwt.claims (JSON)
CREATE OR REPLACE FUNCTION public.prevent_direct_arena_speaking_score_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role TEXT;
BEGIN
  -- Check both old and new PostgREST JWT claim formats
  jwt_role := COALESCE(
    current_setting('request.jwt.claim.role', true),
    (current_setting('request.jwt.claims', true)::json->>'role')
  );

  IF OLD.game_type = 'speaking'
    AND COALESCE(jwt_role, '') <> 'service_role'
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
$function$;
