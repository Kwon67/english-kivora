CREATE OR REPLACE FUNCTION public.update_card_reviews_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

DROP POLICY IF EXISTS "Users can view their own card reviews" ON public.card_reviews;
CREATE POLICY "Users can view their own card reviews" ON public.card_reviews FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own card reviews" ON public.card_reviews;
CREATE POLICY "Users can insert their own card reviews" ON public.card_reviews FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own card reviews" ON public.card_reviews;
CREATE POLICY "Users can update their own card reviews" ON public.card_reviews FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own card reviews" ON public.card_reviews;
CREATE POLICY "Users can delete their own card reviews" ON public.card_reviews FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Packs insertable by admins." ON public.packs;
CREATE POLICY "Packs insertable by admins." ON public.packs FOR ALL USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin' ));

DROP POLICY IF EXISTS "Cards insertable by admins." ON public.cards;
CREATE POLICY "Cards insertable by admins." ON public.cards FOR ALL USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin' ));

DROP POLICY IF EXISTS "Users can create their own sessions" ON public.game_sessions;
CREATE POLICY "Users can create their own sessions" ON public.game_sessions FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can see their own sessions" ON public.game_sessions;
CREATE POLICY "Users can see their own sessions" ON public.game_sessions FOR SELECT USING (user_id = (select auth.uid()) OR EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin' ));

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.assignments;
CREATE POLICY "Admins can manage assignments" ON public.assignments FOR ALL USING (EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin' ));

DROP POLICY IF EXISTS "Users can update their own assignments" ON public.assignments;
CREATE POLICY "Users can update their own assignments" ON public.assignments FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can see their own assignments" ON public.assignments;
CREATE POLICY "Users can see their own assignments" ON public.assignments FOR SELECT USING (user_id = (select auth.uid()) OR EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin' ));
;
