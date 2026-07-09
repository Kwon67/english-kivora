/**
 * Stores hashed login identifiers for local MFA UI hints.
 * Never persists plaintext emails or usernames in localStorage.
 */

const MFA_KNOWN_KEY = 'mfa_known_ids_v1'
const LEGACY_MFA_EMAILS_KEY = 'mfa_known_emails'

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase()
}

export async function hashLoginIdentifier(identifier: string): Promise<string> {
  const normalized = normalizeIdentifier(identifier)
  if (!normalized || typeof crypto === 'undefined' || !crypto.subtle) {
    return ''
  }

  const data = new TextEncoder().encode(`kivora-mfa:${normalized}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function readKnownHashes(): string[] {
  if (typeof window === 'undefined') return []

  try {
    // Drop legacy plaintext list if present.
    if (window.localStorage.getItem(LEGACY_MFA_EMAILS_KEY)) {
      window.localStorage.removeItem(LEGACY_MFA_EMAILS_KEY)
    }

    const raw = window.localStorage.getItem(MFA_KNOWN_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed.filter((value): value is string => typeof value === 'string' && value.length === 64)
  } catch {
    return []
  }
}

function writeKnownHashes(hashes: string[]) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(MFA_KNOWN_KEY, JSON.stringify(hashes.slice(0, 40)))
  } catch {
    // Ignore quota / privacy mode errors.
  }
}

export async function isMfaKnownIdentifier(identifier: string): Promise<boolean> {
  const hash = await hashLoginIdentifier(identifier)
  if (!hash) return false
  return readKnownHashes().includes(hash)
}

export async function rememberMfaKnownIdentifier(identifier: string): Promise<void> {
  const hash = await hashLoginIdentifier(identifier)
  if (!hash) return

  const hashes = readKnownHashes()
  if (!hashes.includes(hash)) {
    writeKnownHashes([...hashes, hash])
  }
}
