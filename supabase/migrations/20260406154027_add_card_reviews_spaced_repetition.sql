-- Create table for card reviews with spaced repetition
CREATE TABLE IF NOT EXISTS card_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  
  -- Review tracking
  review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  next_review_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- SM-2 Algorithm fields
  interval_days INTEGER NOT NULL DEFAULT 0,
  ease_factor DECIMAL(4,2) NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  
  -- Review quality (0-5 scale like Anki)
  quality INTEGER NOT NULL DEFAULT 3,
  
  -- Stats
  total_reviews INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, card_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_next_review 
  ON card_reviews(user_id, next_review_date);

CREATE INDEX IF NOT EXISTS idx_card_reviews_pack 
  ON card_reviews(pack_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_card_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_card_reviews_updated_at ON card_reviews;

CREATE TRIGGER trigger_card_reviews_updated_at
  BEFORE UPDATE ON card_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_card_reviews_updated_at();

-- Enable RLS
ALTER TABLE card_reviews ENABLE ROW LEVEL SECURITY;

-- Policies for card_reviews
CREATE POLICY "Users can view their own card reviews"
  ON card_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own card reviews"
  ON card_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own card reviews"
  ON card_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own card reviews"
  ON card_reviews FOR DELETE
  USING (user_id = auth.uid());;
