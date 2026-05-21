-- Durable audit trail for sensitive security events.
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (char_length(event_type) BETWEEN 3 AND 80),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  identifier_hash TEXT,
  ip_address TEXT,
  user_agent TEXT,
  route TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service_role can manage security events" ON public.security_events;
CREATE POLICY "Only service_role can manage security events"
ON public.security_events FOR ALL USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON public.security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created_at ON public.security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_identifier_created_at ON public.security_events (identifier_hash, created_at DESC);

-- Atomic rate-limit consumption used by the server/service role.
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_key TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_count INTEGER;
  v_expires_at TIMESTAMPTZ;
  v_retry_after INTEGER;
BEGIN
  IF p_key IS NULL OR char_length(p_key) < 3 OR p_limit < 1 OR p_window_seconds < 1 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'requestCount', 0,
      'retryAfterSeconds', p_window_seconds
    );
  END IF;

  DELETE FROM public.rate_limits
  WHERE expires_at < v_now
    AND random() < 0.02;

  INSERT INTO public.rate_limits (key, request_count, last_request, expires_at)
  VALUES (p_key, 1, v_now, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
  SET
    request_count = CASE
      WHEN public.rate_limits.expires_at <= v_now THEN 1
      ELSE public.rate_limits.request_count + 1
    END,
    last_request = v_now,
    expires_at = CASE
      WHEN public.rate_limits.expires_at <= v_now THEN v_now + (p_window_seconds || ' seconds')::INTERVAL
      ELSE public.rate_limits.expires_at
    END
  RETURNING request_count, expires_at
  INTO v_count, v_expires_at;

  v_retry_after := GREATEST(0, CEIL(EXTRACT(EPOCH FROM (v_expires_at - v_now)))::INTEGER);

  RETURN jsonb_build_object(
    'allowed', v_count <= p_limit,
    'requestCount', v_count,
    'retryAfterSeconds', CASE WHEN v_count <= p_limit THEN 0 ELSE v_retry_after END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
