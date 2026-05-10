-- Add marketplace columns to packs table
ALTER TABLE public.packs
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN cover_url TEXT;

-- Index for searching public packs
CREATE INDEX IF NOT EXISTS packs_is_public_idx ON public.packs(is_public);
