-- Table: friendships
CREATE TABLE public.friendships (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Table: badges
CREATE TABLE public.badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT NOT NULL,
    condition_type TEXT NOT NULL, -- e.g., 'streak_days', 'perfect_games', 'total_xp'
    target_value INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: user_badges
CREATE TABLE public.user_badges (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Table: user_quests
CREATE TABLE public.user_quests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quest_type TEXT NOT NULL, -- e.g., 'daily_games', 'weekly_accuracy'
    target INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Settings
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quests ENABLE ROW LEVEL SECURITY;

-- Friendships Policies
CREATE POLICY "Users can see their own friendships"
ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friendship requests"
ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their received friendship requests"
ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id OR auth.uid() = requester_id);

-- Badges Policies (Publicly viewable)
CREATE POLICY "Badges are viewable by everyone"
ON public.badges FOR SELECT USING (true);

-- User Badges Policies
CREATE POLICY "Users can see their own badges"
ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- User Quests Policies
CREATE POLICY "Users can see their own quests"
ON public.user_quests FOR SELECT USING (auth.uid() = user_id);

-- Initial Badges Seed
INSERT INTO public.badges (name, description, icon_name, condition_type, target_value) VALUES
('Primeiros Passos', 'Complete sua primeira lição.', 'Footprints', 'total_sessions', 1),
('Determinação', 'Mantenha uma ofensiva de 7 dias.', 'Flame', 'streak_days', 7),
('Perfeccionista', 'Consiga 100% de precisão em uma lição de pelo menos 10 cards.', 'Target', 'perfect_games', 1),
('Gladiador', 'Vença seu primeiro duelo na Arena.', 'Sword', 'arena_wins', 1),
('Poliglota em Ascensão', 'Aprenda 100 palavras novas.', 'BookOpen', 'total_cards', 100);

