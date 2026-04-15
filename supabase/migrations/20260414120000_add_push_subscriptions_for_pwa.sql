CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  expiration_time TIMESTAMPTZ,
  user_agent TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  last_notified_for_date DATE,
  last_notified_due_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX push_subscriptions_user_id_idx
  ON public.push_subscriptions(user_id);

CREATE INDEX push_subscriptions_enabled_idx
  ON public.push_subscriptions(enabled)
  WHERE enabled = true;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own push subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own push subscriptions"
ON public.push_subscriptions
FOR UPDATE
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own push subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (user_id = (select auth.uid()));

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_card_reviews_updated_at();
