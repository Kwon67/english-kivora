-- Provider-neutral billing ledger plus an atomic AbacatePay event applicator.
CREATE TABLE IF NOT EXISTS public.billing_provider_links (
  provider TEXT NOT NULL CHECK (provider IN ('abacatepay')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_customer_id TEXT,
  provider_checkout_id TEXT,
  provider_subscription_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_links_checkout
  ON public.billing_provider_links (provider, provider_checkout_id)
  WHERE provider_checkout_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_links_subscription
  ON public.billing_provider_links (provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.billing_checkout_sessions (
  provider TEXT NOT NULL CHECK (provider IN ('abacatepay')),
  provider_checkout_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, provider_checkout_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_checkout_sessions_user
  ON public.billing_checkout_sessions (provider, user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.billing_events (
  provider TEXT NOT NULL CHECK (provider IN ('abacatepay')),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL CHECK (char_length(payload_hash) = 64),
  processing_status TEXT NOT NULL CHECK (processing_status IN ('processed', 'ignored')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider_subscription_id TEXT,
  provider_checkout_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);

ALTER TABLE public.billing_provider_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.billing_provider_links, public.billing_checkout_sessions, public.billing_events FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.billing_provider_links, public.billing_checkout_sessions, public.billing_events TO service_role;

CREATE INDEX IF NOT EXISTS idx_billing_events_received
  ON public.billing_events (received_at DESC);

CREATE OR REPLACE FUNCTION public.apply_abacatepay_subscription_event(
  p_event_id TEXT,
  p_event_type TEXT,
  p_payload_hash TEXT,
  p_user_id UUID,
  p_provider_customer_id TEXT,
  p_provider_checkout_id TEXT,
  p_provider_subscription_id TEXT,
  p_entitlement_status TEXT,
  p_current_period_end TIMESTAMPTZ,
  p_grace_period_ends_at TIMESTAMPTZ,
  p_source_reference_hash TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := p_user_id;
  v_inserted INTEGER := 0;
  v_processing_status TEXT := 'processed';
  v_existing_payload_hash TEXT;
BEGIN
  IF p_event_id IS NULL OR char_length(p_event_id) < 3
     OR p_event_type IS NULL OR char_length(p_event_type) < 3
     OR p_payload_hash IS NULL OR char_length(p_payload_hash) <> 64 THEN
    RAISE EXCEPTION 'invalid billing event envelope';
  END IF;

  IF v_user_id IS NULL AND p_provider_subscription_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.billing_provider_links
    WHERE provider = 'abacatepay'
      AND provider_subscription_id = p_provider_subscription_id;
  END IF;

  IF v_user_id IS NULL AND p_provider_checkout_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.billing_checkout_sessions
    WHERE provider = 'abacatepay'
      AND provider_checkout_id = p_provider_checkout_id;
  END IF;

  IF v_user_id IS NULL AND p_provider_checkout_id IS NOT NULL THEN
    SELECT user_id INTO v_user_id
    FROM public.billing_provider_links
    WHERE provider = 'abacatepay'
      AND provider_checkout_id = p_provider_checkout_id;
  END IF;

  INSERT INTO public.billing_events (
    provider, event_id, event_type, payload_hash, processing_status,
    user_id, provider_subscription_id, provider_checkout_id, metadata
  ) VALUES (
    'abacatepay', p_event_id, p_event_type, p_payload_hash, 'processed',
    v_user_id, p_provider_subscription_id, p_provider_checkout_id, COALESCE(p_metadata, '{}'::jsonb)
  ) ON CONFLICT (provider, event_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    SELECT payload_hash INTO v_existing_payload_hash
    FROM public.billing_events
    WHERE provider = 'abacatepay' AND event_id = p_event_id;
    IF v_existing_payload_hash IS DISTINCT FROM p_payload_hash THEN
      RAISE EXCEPTION 'billing event id reused with different payload';
    END IF;
    RETURN jsonb_build_object('applied', false, 'duplicate', true);
  END IF;

  IF v_user_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    UPDATE public.billing_events
    SET processing_status = 'ignored'
    WHERE provider = 'abacatepay' AND event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'duplicate', false, 'reason', 'user_not_resolved');
  END IF;

  INSERT INTO public.billing_provider_links (
    provider, user_id, provider_customer_id, provider_checkout_id,
    provider_subscription_id, metadata, updated_at
  ) VALUES (
    'abacatepay', v_user_id, p_provider_customer_id, p_provider_checkout_id,
    p_provider_subscription_id, COALESCE(p_metadata, '{}'::jsonb), NOW()
  ) ON CONFLICT (provider, user_id) DO UPDATE SET
    provider_customer_id = COALESCE(EXCLUDED.provider_customer_id, billing_provider_links.provider_customer_id),
    provider_checkout_id = COALESCE(EXCLUDED.provider_checkout_id, billing_provider_links.provider_checkout_id),
    provider_subscription_id = COALESCE(EXCLUDED.provider_subscription_id, billing_provider_links.provider_subscription_id),
    metadata = billing_provider_links.metadata || EXCLUDED.metadata,
    updated_at = NOW();

  IF p_provider_checkout_id IS NOT NULL THEN
    INSERT INTO public.billing_checkout_sessions (
      provider, provider_checkout_id, user_id, status, metadata, updated_at
    ) VALUES (
      'abacatepay', p_provider_checkout_id, v_user_id,
      CASE WHEN p_entitlement_status IN ('active', 'trialing') THEN 'completed' ELSE 'pending' END,
      COALESCE(p_metadata, '{}'::jsonb), NOW()
    ) ON CONFLICT (provider, provider_checkout_id) DO UPDATE SET
      status = CASE
        WHEN p_entitlement_status IN ('active', 'trialing') THEN 'completed'
        WHEN p_entitlement_status IN ('canceled', 'revoked') THEN 'cancelled'
        ELSE billing_checkout_sessions.status
      END,
      metadata = billing_checkout_sessions.metadata || EXCLUDED.metadata,
      updated_at = NOW();
  END IF;

  IF p_entitlement_status IN ('active', 'trialing') THEN
    IF p_source_reference_hash IS NULL OR char_length(p_source_reference_hash) <> 64 THEN
      RAISE EXCEPTION 'invalid entitlement source reference';
    END IF;

    INSERT INTO public.pro_entitlements (
      user_id, status, source, source_reference_hash, current_period_end,
      grace_period_ends_at, renewal_reminder_sent_at, payment_failure_notified_at,
      revoked_at, downgraded_at, metadata, updated_at
    ) VALUES (
      v_user_id, p_entitlement_status, 'abacatepay', p_source_reference_hash, p_current_period_end,
      NULL, NULL, NULL, NULL, NULL, COALESCE(p_metadata, '{}'::jsonb), NOW()
    ) ON CONFLICT (user_id) DO UPDATE SET
      status = EXCLUDED.status,
      source = 'abacatepay',
      source_reference_hash = EXCLUDED.source_reference_hash,
      current_period_end = EXCLUDED.current_period_end,
      grace_period_ends_at = NULL,
      renewal_reminder_sent_at = NULL,
      payment_failure_notified_at = NULL,
      revoked_at = NULL,
      downgraded_at = NULL,
      metadata = pro_entitlements.metadata || EXCLUDED.metadata,
      updated_at = NOW();
  ELSIF p_entitlement_status = 'past_due' THEN
    UPDATE public.pro_entitlements SET
      status = 'past_due',
      grace_period_ends_at = COALESCE(p_grace_period_ends_at, NOW() + INTERVAL '3 days'),
      payment_failure_notified_at = NULL,
      metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
      updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSIF p_entitlement_status IN ('canceled', 'revoked') THEN
    UPDATE public.pro_entitlements SET
      status = p_entitlement_status,
      revoked_at = NOW(),
      downgraded_at = NOW(),
      grace_period_ends_at = NULL,
      metadata = metadata || COALESCE(p_metadata, '{}'::jsonb),
      updated_at = NOW()
    WHERE user_id = v_user_id;
  ELSE
    v_processing_status := 'ignored';
    UPDATE public.billing_events
    SET processing_status = v_processing_status
    WHERE provider = 'abacatepay' AND event_id = p_event_id;
    RETURN jsonb_build_object('applied', false, 'duplicate', false, 'reason', 'event_not_actionable');
  END IF;

  RETURN jsonb_build_object('applied', true, 'duplicate', false, 'userId', v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_abacatepay_subscription_event(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ,
  TIMESTAMPTZ, TEXT, JSONB
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_abacatepay_subscription_event(
  TEXT, TEXT, TEXT, UUID, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ,
  TIMESTAMPTZ, TEXT, JSONB
) TO service_role;
