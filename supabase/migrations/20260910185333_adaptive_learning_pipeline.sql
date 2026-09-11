-- Durable, private generation: one pack per member/day, bounded retries and
-- fenced worker leases. Publication of pack + cards + activities is atomic.
CREATE TABLE public.personal_learning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_date date NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','generating','audio','ready','deferred','failed')),
  plan jsonb,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(cards) = 'array' AND jsonb_array_length(cards) <= 12),
  pack_id uuid REFERENCES public.packs(id) ON DELETE SET NULL,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  lease_token uuid,
  lease_until timestamptz,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_date)
);
CREATE INDEX personal_learning_jobs_work_idx ON public.personal_learning_jobs(next_attempt_at)
  WHERE status IN ('queued','generating','audio','failed');
CREATE INDEX personal_learning_jobs_pack_idx ON public.personal_learning_jobs(pack_id) WHERE pack_id IS NOT NULL;
ALTER TABLE public.personal_learning_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.personal_learning_jobs FROM anon, authenticated;
GRANT ALL ON public.personal_learning_jobs TO service_role;
-- Drafts, internal errors and fencing tokens remain server-only.
GRANT SELECT (id,user_id,plan_date,status,plan,pack_id,created_at,updated_at)
  ON public.personal_learning_jobs TO authenticated;
CREATE POLICY "Members can read their personal learning status"
  ON public.personal_learning_jobs FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE FUNCTION public.claim_personal_learning_job(p_job_id uuid)
RETURNS SETOF public.personal_learning_jobs
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  UPDATE public.personal_learning_jobs
  SET status = CASE WHEN jsonb_array_length(cards) > 0 THEN 'audio' ELSE 'generating' END,
      attempts = attempts + 1, lease_token = gen_random_uuid(),
      lease_until = now() + interval '4 minutes', updated_at = now()
  WHERE id = p_job_id AND status IN ('queued','failed','generating','audio','deferred')
    AND attempts < 3 AND next_attempt_at <= now()
    AND (lease_until IS NULL OR lease_until < now())
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.claim_personal_learning_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_personal_learning_job(uuid) TO service_role;

CREATE FUNCTION public.publish_personal_learning_job(p_job_id uuid, p_lease_token uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
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
  modes := ARRAY[
    CASE WHEN job.plan->>'level' IN ('B1','B2','C1','C2')
      AND (extract(doy from job.plan_date)::integer % 2 = 0 OR job.plan->>'focus' = 'writing')
      THEN 'typing' ELSE 'multiple_choice' END,
    'listening','speaking'
  ];
  FOREACH practice_mode IN ARRAY modes LOOP
    INSERT INTO public.assignments(user_id,pack_id,assigned_date,assigned_by,game_mode,status)
    VALUES (job.user_id,new_pack_id,job.plan_date,'auto',practice_mode,'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;
  UPDATE public.personal_learning_jobs SET status='ready',pack_id=new_pack_id,
    lease_token=NULL,lease_until=NULL,error_code=NULL,updated_at=now() WHERE id=job.id;
  RETURN new_pack_id;
END;
$$;
REVOKE ALL ON FUNCTION public.publish_personal_learning_job(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_personal_learning_job(uuid,uuid) TO service_role;

-- These levels were already valid for packs; learner estimates and plan memory
-- must retain them rather than collapsing advanced material into B2.
ALTER TABLE public.user_cefr_assessments DROP CONSTRAINT IF EXISTS user_cefr_assessments_estimated_level_check;
ALTER TABLE public.user_cefr_assessments ADD CONSTRAINT user_cefr_assessments_estimated_level_check
  CHECK (estimated_level IS NULL OR estimated_level IN ('A1','A2','B1','B2','C1','C2'));
ALTER TABLE public.learning_plan_history DROP CONSTRAINT IF EXISTS learning_plan_history_level_check;
ALTER TABLE public.learning_plan_history ADD CONSTRAINT learning_plan_history_level_check
  CHECK (level IS NULL OR level IN ('A1','A2','B1','B2','C1','C2'));
ALTER TABLE public.learning_resource_events DROP CONSTRAINT IF EXISTS learning_resource_events_level_check;
ALTER TABLE public.learning_resource_events ADD CONSTRAINT learning_resource_events_level_check
  CHECK (level IS NULL OR level IN ('A1','A2','B1','B2','C1','C2'));
