'use server'

import { createClient } from '@/lib/supabase/server'
import { getPublicVapidKey, type StoredPushSubscription } from '@/lib/pushNotifications'

function serializeExpirationTime(value: number | null | undefined) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export async function getPushPermissionConfig() {
  return {
    vapidPublicKey: getPublicVapidKey(),
  }
}

export async function savePushSubscription(
  subscription: StoredPushSubscription,
  userAgent?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expiration_time: serializeExpirationTime(subscription.expirationTime),
        user_agent: userAgent || null,
        enabled: true,
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Não autenticado')
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
