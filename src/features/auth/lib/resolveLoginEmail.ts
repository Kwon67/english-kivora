const LEGACY_USERNAME_MAP: Record<string, string> = {
  armando: 'armando@kivora.com',
  daniel: 'daniel@kivora.com',
}

export function normalizeLoginIdentifier(identifier: string) {
  return identifier.trim()
}

export function resolveLoginEmailFromIdentifier(
  identifier: string,
  profileEmail?: string | null
) {
  const trimmed = normalizeLoginIdentifier(identifier)
  if (!trimmed) return null

  if (trimmed.includes('@')) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase()

  if (LEGACY_USERNAME_MAP[normalized]) {
    return LEGACY_USERNAME_MAP[normalized]
  }

  if (profileEmail) {
    return profileEmail
  }

  return `${normalized}@kivora.com`
}

export async function resolveLoginEmail(identifier: string) {
  const trimmed = normalizeLoginIdentifier(identifier)
  if (!trimmed) return null

  if (trimmed.includes('@')) {
    return trimmed
  }

  const normalized = trimmed.toLowerCase()

  if (LEGACY_USERNAME_MAP[normalized]) {
    return LEGACY_USERNAME_MAP[normalized]
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = createAdminClient()
  if (adminSupabase) {
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('username', normalized)
      .maybeSingle()

    if (profile?.email) {
      return profile.email
    }
  }

  return `${normalized}@kivora.com`
}