-- Add joined_at columns to arena_duels if they don't exist (they may have been added manually)
ALTER TABLE public.arena_duels
ADD COLUMN IF NOT EXISTS player1_joined_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS player2_joined_at TIMESTAMPTZ;

-- Add left_at columns to track when a player intentionally leaves
ALTER TABLE public.arena_duels
ADD COLUMN IF NOT EXISTS player1_left_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS player2_left_at TIMESTAMPTZ;
