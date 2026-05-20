-- Ensure usernames are unique to prevent login issues and account ambiguity
ALTER TABLE public.profiles ADD CONSTRAINT unique_username UNIQUE (username);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);
