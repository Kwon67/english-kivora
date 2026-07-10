-- Adds the renewal reminder and payment-grace lifecycle to existing Pro rows.
ALTER TABLE public.pro_entitlements
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_failure_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS downgraded_at TIMESTAMPTZ;

-- Keep the read-only helper consistent with the server-side authorization rule:
-- active users retain access for the configured three-day payment grace period.
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
          AND e.status IN ('active', 'trialing', 'past_due')
          AND e.revoked_at IS NULL
          AND (
            (e.current_period_end IS NOT NULL AND e.current_period_end > NOW())
            OR (e.grace_period_ends_at IS NOT NULL AND e.grace_period_ends_at > NOW())
          )
      )
    );
$$;

REVOKE ALL ON FUNCTION public.has_active_pro_entitlement() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_pro_entitlement() TO authenticated, service_role;

