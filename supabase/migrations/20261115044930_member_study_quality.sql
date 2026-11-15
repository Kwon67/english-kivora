-- Transient input consumed by the trigger, never reused by a later game/SRS update.
ALTER TABLE public.card_reviews ADD COLUMN study_evidence jsonb;
CREATE TABLE public.study_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id uuid REFERENCES public.cards(id) ON DELETE SET NULL,
  review_number integer NOT NULL CHECK (review_number > 0),
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  quality integer NOT NULL CHECK (quality BETWEEN 0 AND 5),
  mode text CHECK (mode IN ('multiple_choice','typing','matching','listening','speaking','reading','writing')),
  outcome text CHECK (outcome IN ('correct','partial','wrong')),
  UNIQUE(user_id,card_id,review_number)
);
CREATE INDEX study_review_events_member_date ON public.study_review_events(user_id,reviewed_at);
CREATE INDEX study_review_events_card ON public.study_review_events(card_id);
CREATE INDEX IF NOT EXISTS game_sessions_member_date ON public.game_sessions(user_id,completed_at);
ALTER TABLE public.study_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.study_review_events FROM anon,authenticated;
GRANT SELECT ON public.study_review_events TO authenticated;
GRANT ALL ON public.study_review_events TO service_role;
CREATE POLICY study_review_events_read ON public.study_review_events FOR SELECT TO authenticated
  USING (user_id=(SELECT auth.uid()) OR (SELECT public.is_admin()));
CREATE FUNCTION public.capture_study_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.study_evidence->>'kind' = 'review' AND
    (TG_OP='INSERT' OR NEW.total_reviews > OLD.total_reviews) THEN
    INSERT INTO public.study_review_events(user_id,card_id,review_number,quality,mode,outcome)
    VALUES (NEW.user_id,NEW.card_id,NEW.total_reviews,NEW.quality,
      NEW.study_evidence->>'mode',NEW.study_evidence->>'outcome')
    ON CONFLICT (user_id,card_id,review_number) DO NOTHING;
  END IF;
  NEW.study_evidence := NULL;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.capture_study_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER capture_study_review BEFORE INSERT OR UPDATE ON public.card_reviews
FOR EACH ROW EXECUTE FUNCTION public.capture_study_review();
COMMENT ON TABLE public.study_review_events IS 'Review history from deployment onward. Game SRS synchronization is excluded to avoid counting a game twice. No fabricated historical backfill.';
CREATE OR REPLACE FUNCTION public.publish_personal_learning_job(p_job_id uuid, p_lease_token uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  job public.personal_learning_jobs%ROWTYPE;
  new_pack_id uuid;
  item jsonb;
  practice_mode text;
  modes text[];
BEGIN
  SELECT * INTO job FROM public.personal_learning_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown learning job'; END IF;
  IF job.status = 'ready' THEN RETURN job.pack_id; END IF;
  IF job.lease_token IS DISTINCT FROM p_lease_token OR job.lease_until <= now() OR job.status <> 'audio' THEN
    RAISE EXCEPTION 'Learning lease expired';
  END IF;
  IF job.plan IS NULL OR coalesce(job.plan->>'level','') NOT IN ('A1','A2','B1','B2','C1','C2')
    OR jsonb_array_length(job.cards) NOT BETWEEN 4 AND 12 THEN
    RAISE EXCEPTION 'Incomplete learning content';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(job.cards) c
    WHERE coalesce(length(trim(c->>'en')),0) NOT BETWEEN 2 AND 450
      OR coalesce(length(trim(c->>'pt')),0) NOT BETWEEN 2 AND 600
      OR coalesce(c->>'audioUrl','') NOT LIKE 'https://%'
      OR c->>'id' IS NULL) THEN
    RAISE EXCEPTION 'Every card must have validated text and audio';
  END IF;
  IF (SELECT count(DISTINCT lower(trim(c->>'en'))) FROM jsonb_array_elements(job.cards) c)
    <> jsonb_array_length(job.cards) THEN RAISE EXCEPTION 'Duplicate learning phrases'; END IF;

  INSERT INTO public.packs(name,description,level,is_public,owner_id,category)
  VALUES (left('Seu inglês · ' || coalesce(job.plan->>'topic', 'Prática pessoal'), 120),
    left(job.plan->>'objective',600), job.plan->>'level',false,job.user_id,'personalized')
  RETURNING id INTO new_pack_id;
  FOR item IN SELECT * FROM jsonb_array_elements(job.cards) LOOP
    INSERT INTO public.cards(id,pack_id,english_phrase,portuguese_translation,accepted_translations,audio_url)
    VALUES ((item->>'id')::uuid,new_pack_id,item->>'en',item->>'pt',ARRAY[]::text[],item->>'audioUrl');
  END LOOP;
  -- Reuse the same new phrases across receptive and productive tasks. The SRS
  -- queue automatically sees the pack through its ordinary assignments.
  -- Every day includes scored recall, listening and speaking. From B1 onward
  -- alternate recall with writing, so all estimator prerequisites get practice.
  -- New plans carry a weighted, balanced daily selection. Old queued plans retain a safe fallback.
  IF jsonb_typeof(job.plan->'assignmentModes') = 'array' THEN
    SELECT array_agg(value ORDER BY ord) INTO modes
      FROM jsonb_array_elements_text(job.plan->'assignmentModes') WITH ORDINALITY AS m(value,ord)
      WHERE value IN ('multiple_choice','typing','listening','speaking','matching');
    IF coalesce(array_length(modes,1),0) NOT BETWEEN 2 AND 3 THEN
      RAISE EXCEPTION 'Invalid adaptive mode distribution';
    END IF;
  ELSE
    modes := ARRAY['multiple_choice','listening','speaking'];
  END IF;
  FOREACH practice_mode IN ARRAY modes LOOP
    INSERT INTO public.assignments(user_id,pack_id,assigned_date,assigned_by,game_mode,status)
    VALUES (job.user_id,new_pack_id,job.plan_date,'auto',practice_mode,'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;
  UPDATE public.personal_learning_jobs SET status='ready',pack_id=new_pack_id,
    lease_token=NULL,lease_until=NULL,error_code=NULL,updated_at=now() WHERE id=job.id;
  RETURN new_pack_id;
END;
$function$
