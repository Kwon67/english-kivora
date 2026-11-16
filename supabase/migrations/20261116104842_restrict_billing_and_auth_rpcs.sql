-- Supabase's direct grants to anon/authenticated are independent of the PUBLIC grant.
-- Keep billing mutations, entitlement lookups and security counters behind the server.
BEGIN;

ALTER FUNCTION public.apply_abacatepay_subscription_event(
  text, text, text, uuid, text, text, text, text, timestamptz, timestamptz, text, jsonb
) SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.apply_abacatepay_subscription_event(
  text, text, text, uuid, text, text, text, text, timestamptz, timestamptz, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_abacatepay_subscription_event(
  text, text, text, uuid, text, text, text, text, timestamptz, timestamptz, text, jsonb
) TO service_role;

REVOKE ALL ON FUNCTION public.has_active_pro_entitlement() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_pro_entitlement() TO service_role;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer),
  public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer),
  public.consume_rate_limit(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;

-- The old confirmation flow is no longer used. Remove expired password copies
-- while keeping the schema compatible with builds that are still draining.
DELETE FROM public.signup_verifications WHERE expires_at <= now();

COMMIT;
