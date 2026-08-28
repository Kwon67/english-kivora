import webpush from 'web-push'

type PushKeys = {
  p256dh: string
  auth: string
}

export type PushSubscriptionInput = {
  endpoint: string
  expirationTime?: number | null
  keys: PushKeys
}

export type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

let configured = false

function requireEnv(name: string, value: string | undefined) {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`Missing web push environment variable: ${name}`)
  return normalized
}

function getVapidPublicKey() {
  return requireEnv(
    'VAPID_PUBLIC_KEY',
    process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  )
}

function getVapidSubject() {
  const email = process.env.VAPID_EMAIL?.trim()
  if (email) return `mailto:${email}`

  return process.env.VAPID_SUBJECT?.trim() || 'mailto:kivora.dev@outlook.com'
}

function configureWebPush() {
  if (configured) return

  webpush.setVapidDetails(
    getVapidSubject(),
    getVapidPublicKey(),
    requireEnv('VAPID_PRIVATE_KEY', process.env.VAPID_PRIVATE_KEY)
  )

  configured = true
}

export function generateVAPIDKeys() {
  return webpush.generateVAPIDKeys()
}

export async function sendPushNotification(subscription: PushSubscriptionInput, payload: PushPayload) {
  configureWebPush()

  return webpush.sendNotification(
    subscription,
    JSON.stringify({
      icon: '/icon-192.png',
      badge: '/notification-badge-96.png',
      url: '/home',
      ...payload,
    })
  )
}
