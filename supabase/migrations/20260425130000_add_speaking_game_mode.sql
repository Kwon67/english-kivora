-- Add 'speaking' to all game_mode / game_type CHECK constraints

-- 1. assignments.game_mode
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_game_mode_check;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_game_mode_check
  CHECK (game_mode IN ('multiple_choice', 'typing', 'flashcard', 'matching', 'listening', 'speaking', 'scheduled_review'));

-- 2. assignment_templates.game_mode
ALTER TABLE public.assignment_templates DROP CONSTRAINT IF EXISTS assignment_templates_game_mode_check;
ALTER TABLE public.assignment_templates ADD CONSTRAINT assignment_templates_game_mode_check
  CHECK (game_mode IN ('multiple_choice', 'typing', 'flashcard', 'matching', 'listening', 'speaking'));

-- 3. arena_duels.game_type
ALTER TABLE public.arena_duels DROP CONSTRAINT IF EXISTS arena_duels_game_type_check;
ALTER TABLE public.arena_duels ADD CONSTRAINT arena_duels_game_type_check
  CHECK (game_type IN ('multiple_choice', 'matching', 'typing', 'flashcard', 'listening', 'speaking'));
