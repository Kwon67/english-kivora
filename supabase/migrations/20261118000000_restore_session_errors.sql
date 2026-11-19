BEGIN;

CREATE TABLE IF NOT EXISTS public.session_errors (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_errors ENABLE ROW LEVEL SECURITY;
-- Default table grants can include TRUNCATE, which is not filtered by RLS.
REVOKE ALL ON public.session_errors FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.session_errors TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.session_errors TO service_role;

DROP POLICY IF EXISTS "Users can view their own session errors" ON public.session_errors;
CREATE POLICY "Users can view their own session errors" ON public.session_errors
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all session errors" ON public.session_errors;
CREATE POLICY "Admins can view all session errors" ON public.session_errors
  FOR SELECT TO authenticated USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can insert their own session errors" ON public.session_errors;
CREATE POLICY "Users can insert their own session errors" ON public.session_errors
  FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT auth.uid()) AND EXISTS (
      SELECT 1 FROM public.game_sessions AS session
      WHERE session.id = session_errors.session_id AND session.user_id = (SELECT auth.uid())
    ) AND EXISTS (
      SELECT 1 FROM public.cards WHERE cards.id = session_errors.card_id
    )
  );

COMMIT;
