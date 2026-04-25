-- Add reward_badge_id to assignments and assignment_templates
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS reward_badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL;
ALTER TABLE public.assignment_templates ADD COLUMN IF NOT EXISTS reward_badge_id UUID REFERENCES public.badges(id) ON DELETE SET NULL;

-- Insert Manual Badges (Beautiful Medals)
INSERT INTO public.badges (name, description, icon_name, condition_type, target_value) VALUES
('Medalha de Bronze', 'Você completou uma missão desafiadora de nível Bronze!', 'Medal', 'manual_assignment', 1),
('Medalha de Prata', 'Excelente! Você completou uma missão de nível Prata.', 'Medal', 'manual_assignment', 2),
('Medalha de Ouro', 'Incrível! Você conquistou a glória em uma missão Ouro.', 'Medal', 'manual_assignment', 3),
('Diamante', 'Lendário! Você dominou uma missão de dificuldade Diamante.', 'Gem', 'manual_assignment', 4),
('Mestre Supremo', 'Você superou o impossível e se tornou Mestre.', 'Crown', 'manual_assignment', 5);
