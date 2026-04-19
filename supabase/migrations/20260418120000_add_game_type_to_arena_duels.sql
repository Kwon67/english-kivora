-- Add game_type column to arena_duels
ALTER TABLE public.arena_duels ADD COLUMN game_type TEXT NOT NULL DEFAULT 'multiple_choice';

-- Add CHECK constraint for valid game types
ALTER TABLE public.arena_duels DROP CONSTRAINT IF EXISTS arena_duels_game_type_check;
ALTER TABLE public.arena_duels ADD CONSTRAINT arena_duels_game_type_check CHECK (game_type IN ('multiple_choice', 'matching', 'typing', 'flashcard'));