export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2'

type AuthClaims = {
  aal?: unknown
  amr?: unknown
}

type AMRClaimEntry = {
  method?: unknown
}

function isAMRClaimEntry(value: unknown): value is AMRClaimEntry {
  return Boolean(value && typeof value === 'object' && 'method' in value)
}

function isMFAMethod(method: unknown) {
  return (
    typeof method === 'string' &&
    (method === 'mfa' || method === 'totp' || method.startsWith('mfa/'))
  )
}

export function resolveAuthenticatorAssuranceLevel(
  claims: AuthClaims | null | undefined
): AuthenticatorAssuranceLevel {
  if (claims?.aal === 'aal2') {
    return 'aal2'
  }

  const amr = claims?.amr

  if (!Array.isArray(amr)) {
    return 'aal1'
  }

  return amr.some((method) => {
    if (isAMRClaimEntry(method)) {
      return isMFAMethod(method.method)
    }

    return isMFAMethod(method)
  }) ? 'aal2' : 'aal1'
}
