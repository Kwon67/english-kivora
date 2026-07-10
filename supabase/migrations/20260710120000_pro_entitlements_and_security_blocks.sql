-- Server-authoritative Pro entitlements and durable security blocks.
-- Nothing in this migration trusts browser-editable user metadata for access.

-- ---------------------------------------------------------------------------
-- New accounts are always members. raw_user_meta_data is user-controlled and
-- must never be allowed to grant an authorization role.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'username'), ''), split_part(NEW.email, '@', 1)),
    'member'
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Entitlements are written only by trusted server-side billing/webhook code.
-- A client cannot grant, extend, reactivate, or even enumerate them.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pro_entitlements (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'revoked')),
  source TEXT NOT NULL CHECK (char_length(source) BETWEEN 2 AND 40),
  source_reference_hash TEXT NOT NULL CHECK (char_length(source_reference_hash) BETWEEN 32 AND 128),
  current_period_end TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  renewal_reminder_sent_at TIMESTAMPTZ,
  payment_failure_notified_at TIMESTAMPTZ,
  downgraded_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pro_entitlements
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failure_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ;

ALTER TABLE public.pro_entitlements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.pro_entitlements FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pro_entitlements TO service_role;

CREATE INDEX IF NOT EXISTS idx_pro_entitlements_active
  ON public.pro_entitlements (status, current_period_end)
  WHERE revoked_at IS NULL;

-- A user may read only the yes/no result for their own current access. The
-- underlying payment identifiers remain server-only.
CREATE OR REPLACE FUNCTION public.has_active_pro_entitlement()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    (SELECT auth.uid()) IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = (SELECT auth.uid())
          AND p.role = 'admin'
      )
      OR EXISTS (
        SELECT 1
        FROM public.pro_entitlements e
        WHERE e.user_id = (SELECT auth.uid())
          AND e.status IN ('active', 'trialing')
          AND e.revoked_at IS NULL
          AND (e.current_period_end IS NULL OR e.current_period_end > NOW())
      )
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_pro_entitlement() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_pro_entitlement() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Durable, expiring blocks. Identifiers are one-way hashes; raw IPs and user
-- IDs are not required to enforce the block.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_blocks (
  kind TEXT NOT NULL CHECK (kind IN ('ip', 'user')),
  identifier_hash TEXT NOT NULL CHECK (char_length(identifier_hash) = 64),
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 120),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (kind, identifier_hash)
);

ALTER TABLE public.security_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.security_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.security_blocks TO service_role;

CREATE INDEX IF NOT EXISTS idx_security_blocks_expiry
  ON public.security_blocks (expires_at);

-- Ensure browser roles cannot mutate authorization-bearing profile fields even
-- if a future migration accidentally adds a permissive policy.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon, authenticated;
