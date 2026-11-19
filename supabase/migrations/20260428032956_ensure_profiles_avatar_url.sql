-- The leaderboard migration that follows reads this optional profile field.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
