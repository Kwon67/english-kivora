-- Ordering metadata only: no learner records, card IDs or history are changed.
alter table public.cards
  add column if not exists curriculum_position integer
  check (curriculum_position is null or curriculum_position > 0);

create index if not exists cards_pack_curriculum_position_idx
  on public.cards (pack_id, curriculum_position, id);

comment on column public.cards.curriculum_position is
  'Pedagogical sequence inside a collection; null preserves legacy/new custom-card fallback ordering.';

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
  remaining integer;
  card_position integer := 0;
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

  -- Serialize concurrent automatic publication for the same member/day.
  PERFORM pg_advisory_xact_lock(hashtextextended(job.user_id::text || job.plan_date::text,0));
  SELECT greatest(0,least(3,greatest(2,coalesce((job.plan->>'dailyActivityLimit')::integer,3))) - count(*)::integer)
    INTO remaining FROM public.assignments WHERE user_id=job.user_id AND assigned_date=job.plan_date;
  IF remaining = 0 THEN
    UPDATE public.personal_learning_jobs SET status='deferred', lease_token=NULL,lease_until=NULL,
      plan=plan || '{"generationBlockedReason":"daily_plan_ready","shouldGenerate":false}'::jsonb,
      next_attempt_at=now()+interval '1 day', updated_at=now() WHERE id=job.id;
    RETURN NULL;
  END IF;
  -- Reuse the same new phrases across receptive and productive tasks. The SRS
  -- queue automatically sees the pack through its ordinary assignments.
  -- Every day includes scored recall, listening and speaking. From B1 onward
  -- alternate recall with writing, so all estimator prerequisites get practice.
  -- New plans carry a weighted, balanced daily selection. Old queued plans retain a safe fallback.
  IF jsonb_typeof(job.plan->'assignmentModes') = 'array' THEN
    SELECT array_agg(value ORDER BY ord) INTO modes
      FROM jsonb_array_elements_text(job.plan->'assignmentModes') WITH ORDINALITY AS m(value,ord)
      WHERE value IN ('multiple_choice','typing','listening','speaking','matching');
    IF coalesce(array_length(modes,1),0) NOT BETWEEN 1 AND 3 THEN
      RAISE EXCEPTION 'Invalid adaptive mode distribution';
    END IF;
  ELSE
    modes := ARRAY['multiple_choice','listening','speaking'];
  END IF;
  modes := modes[1:remaining];

  INSERT INTO public.packs(name,description,level,is_public,owner_id,category)
  VALUES (left('Seu inglês · ' || coalesce(job.plan->>'topic', 'Prática pessoal'), 120),
    left(job.plan->>'objective',600), job.plan->>'level',false,job.user_id,'personalized')
  RETURNING id INTO new_pack_id;
  FOR item IN SELECT * FROM jsonb_array_elements(job.cards) LOOP
    card_position := card_position + 1;
    INSERT INTO public.cards(id,pack_id,english_phrase,portuguese_translation,accepted_translations,audio_url,curriculum_position)
    VALUES ((item->>'id')::uuid,new_pack_id,item->>'en',item->>'pt',ARRAY[]::text[],item->>'audioUrl',card_position);
  END LOOP;
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
