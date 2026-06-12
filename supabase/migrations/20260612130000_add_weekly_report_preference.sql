ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT true;
