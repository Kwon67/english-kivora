-- Sensitive mutations must go through server routes/actions that validate auth,
-- roles and field-level intent before using the service-role client.

REVOKE INSERT, UPDATE, DELETE ON TABLE public.arena_duels FROM anon, authenticated;

DROP POLICY IF EXISTS "Admins can create duels." ON public.arena_duels;
DROP POLICY IF EXISTS "Players can create their own arena duels." ON public.arena_duels;
DROP POLICY IF EXISTS "Involved players or admins can update duels." ON public.arena_duels;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon, authenticated;

-- Keep profile discovery available, but do not expose email or allow browser-side
-- profile writes. Admin server pages use the service-role client when they need
-- privileged profile data.
REVOKE SELECT ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT (
  id,
  username,
  role,
  created_at,
  updated_at,
  last_seen_at,
  avatar_url,
  cover_url,
  bio,
  description
) ON TABLE public.profiles TO authenticated;

GRANT SELECT (
  id,
  username,
  avatar_url,
  cover_url,
  bio,
  description
) ON TABLE public.profiles TO anon;
