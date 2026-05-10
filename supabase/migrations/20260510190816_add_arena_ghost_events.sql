-- Add ghost event columns for async multiplayer replays
ALTER TABLE public.arena_duels
ADD COLUMN player1_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN player2_events JSONB DEFAULT '[]'::jsonb;
