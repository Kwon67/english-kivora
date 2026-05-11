-- Table to store the best performances as ghosts
CREATE TABLE IF NOT EXISTS public.arena_ghost_recordings (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE NOT NULL,
    game_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    events JSONB NOT NULL, -- Array of { timeMs, correct }
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, pack_id, game_type)
);

-- RLS Settings
ALTER TABLE public.arena_ghost_recordings ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Ghost recordings are viewable by everyone') THEN
        CREATE POLICY "Ghost recordings are viewable by everyone" ON public.arena_ghost_recordings FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own ghost recordings') THEN
        CREATE POLICY "Users can manage their own ghost recordings" ON public.arena_ghost_recordings FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_ghost_user_pack ON public.arena_ghost_recordings(user_id, pack_id, game_type);

-- Add flag to duels to identify ghost matches
ALTER TABLE public.arena_duels
ADD COLUMN IF NOT EXISTS is_ghost BOOLEAN NOT NULL DEFAULT false;
