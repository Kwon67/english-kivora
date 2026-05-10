-- Add category column to packs table
ALTER TABLE public.packs
ADD COLUMN category TEXT DEFAULT 'Geral';

-- Update existing packs with some sample categories to make the radar more interesting
UPDATE public.packs SET category = 'Negócios' WHERE name ILIKE '%business%' OR name ILIKE '%emprego%' OR name ILIKE '%trabalho%';
UPDATE public.packs SET category = 'Viagem' WHERE name ILIKE '%viagem%' OR name ILIKE '%airport%' OR name ILIKE '%travel%' OR name ILIKE '%hotel%';
UPDATE public.packs SET category = 'Gramática' WHERE name ILIKE '%gramática%' OR name ILIKE '%grammar%' OR name ILIKE '%verbs%' OR name ILIKE '%phrasal%';
UPDATE public.packs SET category = 'Conversação' WHERE name ILIKE '%conversação%' OR name ILIKE '%casual%' OR name ILIKE '%social%';
