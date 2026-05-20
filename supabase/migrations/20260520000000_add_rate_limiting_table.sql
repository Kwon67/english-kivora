-- Table to track rate limits for sensitive operations
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL, -- Format: action:identifier (e.g., login:192.168.1.1)
    request_count INTEGER DEFAULT 1,
    last_request TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(key)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage rate limits
CREATE POLICY "Only service_role can manage rate limits" 
ON public.rate_limits FOR ALL USING (false) WITH CHECK (false);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at);

-- Function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key TEXT,
    p_limit INTEGER,
    p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_count INTEGER;
    v_expires TIMESTAMPTZ;
BEGIN
    -- Cleanup expired entries
    DELETE FROM public.rate_limits WHERE expires_at < NOW();

    -- Get current state
    SELECT request_count, expires_at INTO v_count, v_expires
    FROM public.rate_limits
    WHERE key = p_key;

    IF NOT FOUND THEN
        -- First request in the window
        INSERT INTO public.rate_limits (key, request_count, expires_at)
        VALUES (p_key, 1, NOW() + (p_window_seconds || ' seconds')::INTERVAL);
        RETURN TRUE;
    ELSIF v_count < p_limit THEN
        -- Within limit
        UPDATE public.rate_limits
        SET request_count = request_count + 1,
            last_request = NOW()
        WHERE key = p_key;
        RETURN TRUE;
    ELSE
        -- Limit exceeded
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
