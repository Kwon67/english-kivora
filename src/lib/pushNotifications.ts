import webpush from 'web-push'

let configured = false

export type StoredPushSubscription = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
  expirationTime?: number | null
}

function requireEnv(name: string, value: string | undefined) {
  const normalized = value?.trim()

  if (!normalized) {
    throw new Error(`Missing push notification environment variable: ${name}`)
  }

  return normalized
}

export function getPublicVapidKey() {
  return requireEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
}

export function configureWebPush() {
  if (configured) return webpush

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || 'mailto:hello@kivora.com',
    getPublicVapidKey(),
    requireEnv('VAPID_PRIVATE_KEY', process.env.VAPID_PRIVATE_KEY)
  )

  configured = true
  return webpush
}
