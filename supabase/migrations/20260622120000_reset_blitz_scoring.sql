-- Rebalance Blitz scoring scale and reset historical runs.

TRUNCATE public.blitz_runs;

DELETE FROM public.user_badges
WHERE badge_id IN (
  SELECT id FROM public.badges WHERE condition_type = 'blitz_score'
);

UPDATE public.badges
SET
  description = 'Alcance 100 pontos em uma partida de Blitz.',
  target_value = 100
WHERE condition_type = 'blitz_score';