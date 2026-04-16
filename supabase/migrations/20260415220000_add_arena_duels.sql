-- Create arena_duels table
CREATE TABLE public.arena_duels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    pack_id UUID REFERENCES public.packs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished', 'cancelled')),
    winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    CONSTRAINT different_players CHECK (player1_id != player2_id)
);

-- RLS Settings
ALTER TABLE public.arena_duels ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own duels or admins can view all."
ON public.arena_duels FOR SELECT USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can create duels."
ON public.arena_duels FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Involved players or admins can update duels."
ON public.arena_duels FOR UPDATE USING (
    auth.uid() = player1_id OR 
    auth.uid() = player2_id OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_duels;
