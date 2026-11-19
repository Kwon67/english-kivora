-- The following column grants require these production profile fields.
-- Set the presence default separately so existing profiles keep a NULL
-- last_seen_at when the field is first introduced.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.profiles ALTER COLUMN last_seen_at SET DEFAULT now();
