ALTER TABLE public.cards
ADD COLUMN IF NOT EXISTS accepted_translations TEXT[] NOT NULL DEFAULT '{}'::TEXT[];
