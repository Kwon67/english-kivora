-- Sub-day learning steps for the review scheduler.
--
-- SM-2 only schedules in whole days, so a missed card was pushed a full day away and the
-- learner never got the immediate second look that fixes a lapse. On a fresh card every grade
-- resolved to the same "1 day", making the four rating buttons indistinguishable.
--
-- `card_reviews.interval_days` is INTEGER and is read as whole days throughout the app, so the
-- sub-day position cannot be encoded there. This adds an explicit column instead.
--
-- Semantics (see src/features/review/lib/learningSteps.ts):
--   NULL -> the card has graduated and is on the day-based SM-2 schedule.
--   0..n -> index into the active ladder (learning [1min, 10min], relearning [10min]);
--           `next_review_date` then carries a within-day timestamp.
--
-- Existing rows are left NULL on purpose: they already hold day-based intervals, so treating
-- them as graduated preserves today's behaviour exactly and makes this migration a no-op for
-- current data. New cards start their ladder the first time they are answered after deploy.

ALTER TABLE public.card_reviews
  ADD COLUMN IF NOT EXISTS learning_step SMALLINT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'card_reviews_learning_step_range'
  ) THEN
    ALTER TABLE public.card_reviews
      ADD CONSTRAINT card_reviews_learning_step_range
      CHECK (learning_step IS NULL OR (learning_step >= 0 AND learning_step <= 10));
  END IF;
END $$;

COMMENT ON COLUMN public.card_reviews.learning_step IS
  'Index into the learning/relearning ladder; NULL once the card graduates to day intervals.';

-- The due-card query filters on (user_id, next_review_date) and will move from a calendar-date
-- comparison to a timestamp one. Cards still in a ladder are the hot, frequently-requeued rows,
-- so give them their own small partial index rather than widening the main one.
CREATE INDEX IF NOT EXISTS idx_card_reviews_learning_due
  ON public.card_reviews (user_id, next_review_date)
  WHERE learning_step IS NOT NULL;
