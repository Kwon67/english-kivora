import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
} from 'node:crypto'

export const SIGNUP_CODE_TTL_MINUTES = 15
export const SIGNUP_MAX_ATTEMPTS = 5
export const SIGNUP_CODE_LENGTH = 6

const PASSWORD_SCRYPT_SALT = 'kivora-signup-password-v1'

function getSignupSecret() {
  const configuredSecret = process.env.ADMIN_SECRET?.trim()
  if (configuredSecret) return configuredSecret

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (serviceRoleKey) return serviceRoleKey

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL: Neither ADMIN_SECRET nor SUPABASE_SERVICE_ROLE_KEY is configured in production.')
  }

  return 'kivora-admin-2026'
}

function hashValue(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export function normalizeSignupEmail(email: string) {
  return email.trim().toLowerCase()
}

export function normalizeSignupUsername(username: string) {
  return username.trim().toLowerCase()
}

export function hashSignupEmail(email: string) {
  return hashValue(`signup-email:${normalizeSignupEmail(email)}`)
}

export function generateSignupCode() {
  return String(randomInt(0, 10 ** SIGNUP_CODE_LENGTH)).padStart(SIGNUP_CODE_LENGTH, '0')
}

export function hashSignupCode(email: string, code: string) {
  const normalizedEmail = normalizeSignupEmail(email)
  const normalizedCode = code.replace(/\D/g, '').padStart(SIGNUP_CODE_LENGTH, '0')
  return hashValue(`signup-code:${normalizedEmail}:${normalizedCode}:${getSignupSecret()}`)
}

function getEncryptionKey() {
  return scryptSync(getSignupSecret(), PASSWORD_SCRYPT_SALT, 32)
}

export function encryptSignupPassword(password: string) {
  const iv = randomBytes(12)
  const key = getEncryptionKey()
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`
}

export function decryptSignupPassword(payload: string) {
  const [ivB64, tagB64, dataB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid signup password payload')
  }

  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const encrypted = Buffer.from(dataB64, 'base64')
  const key = getEncryptionKey()
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}

export function maskEmail(email: string) {
  const normalized = normalizeSignupEmail(email)
  const [localPart, domain] = normalized.split('@')
  if (!localPart || !domain) return normalized

  const visible = localPart.slice(0, Math.min(2, localPart.length))
  const maskedLocal = `${visible}${'*'.repeat(Math.max(localPart.length - visible.length, 2))}`
  return `${maskedLocal}@${domain}`
}

export function getSignupExpiryDate(now = new Date()) {
  return new Date(now.getTime() + SIGNUP_CODE_TTL_MINUTES * 60 * 1000)
}