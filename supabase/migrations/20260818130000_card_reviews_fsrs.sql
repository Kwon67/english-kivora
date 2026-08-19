-- FSRS scheduling state on card_reviews.
--
-- SM-2 describes a card with a single `ease_factor`. FSRS describes it with two independent
-- quantities — stability (how long the memory survives) and difficulty (how hard this item is
-- for this learner) — plus a lifecycle state and a lapse count. None of those fit in the
-- existing columns, so they are added alongside rather than replacing anything.
--
-- The SM-2 columns (interval_days, ease_factor, repetitions) are deliberately KEPT:
--   * they are the seed for FSRS on rows reviewed before this migration
--     (see seedFromSm2 in src/features/review/lib/fsrsScheduler.ts), and
--   * keeping them means this migration is reversible — drop these columns and the old
--     scheduler still has everything it needs.
-- Do not drop them until FSRS has been running long enough to trust.
--
-- All columns are NULL by default: a NULL stability is the signal "this card has no FSRS
-- history yet, seed it from SM-2 on next review". Existing rows are untouched, so applying this
-- changes nothing until the scheduler is wired.

ALTER TABLE public.card_reviews
  ADD COLUMN IF NOT EXISTS fsrs_stability   DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS fsrs_difficulty  DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS fsrs_state       SMALLINT NULL,
  ADD COLUMN IF NOT EXISTS fsrs_reps        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_lapses      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fsrs_last_review TIMESTAMPTZ NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_reviews_fsrs_state_range') THEN
    ALTER TABLE public.card_reviews
      ADD CONSTRAINT card_reviews_fsrs_state_range
      -- 0 New, 1 Learning, 2 Review, 3 Relearning
      CHECK (fsrs_state IS NULL OR fsrs_state BETWEEN 0 AND 3);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'card_reviews_fsrs_ranges') THEN
    ALTER TABLE public.card_reviews
      ADD CONSTRAINT card_reviews_fsrs_ranges
      CHECK (
        (fsrs_stability  IS NULL OR fsrs_stability > 0)
        AND (fsrs_difficulty IS NULL OR fsrs_difficulty BETWEEN 1 AND 10)
        AND fsrs_reps   >= 0
        AND fsrs_lapses >= 0
      );
  END IF;
END $$;

COMMENT ON COLUMN public.card_reviews.fsrs_stability IS
  'FSRS stability in days. NULL means no FSRS history yet — seed from the SM-2 columns.';
COMMENT ON COLUMN public.card_reviews.fsrs_difficulty IS
  'FSRS difficulty, 1 (easiest) to 10 (hardest).';
COMMENT ON COLUMN public.card_reviews.fsrs_state IS
  '0 New, 1 Learning, 2 Review, 3 Relearning.';

-- "Which cards has this learner not yet migrated to FSRS" is the one query this adds, and it is
-- run per user, so it gets a partial index rather than widening the existing due-date index.
CREATE INDEX IF NOT EXISTS idx_card_reviews_pending_fsrs_seed
  ON public.card_reviews (user_id)
  WHERE fsrs_stability IS NULL;
