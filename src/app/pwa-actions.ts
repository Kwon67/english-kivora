'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

type PwaActionResult = {
  success: boolean
  error?: string
}

const PushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  userAgent: z.string().max(512).optional(),
})

export async function syncPushSubscriptionAction(input: unknown): Promise<PwaActionResult> {
  const parsed = PushSubscriptionSchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: 'Inscrição de notificações inválida.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const subscription = parsed.data
  const expirationTime =
    typeof subscription.expirationTime === 'number'
      ? new Date(subscription.expirationTime).toISOString()
      : null

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      expiration_time: expirationTime,
      user_agent: subscription.userAgent ?? null,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' }
  )

  if (error) {
    console.error('Push subscription sync failed', { userId: user.id, error })
    return { success: false, error: 'Não foi possível salvar a inscrição de notificações.' }
  }

  return { success: true }
}

export async function disablePushSubscriptionAction(endpoint: string): Promise<PwaActionResult> {
  const parsed = z.string().url().safeParse(endpoint)

  if (!parsed.success) {
    return { success: false, error: 'Endpoint inválido.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado.' }
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .update({
      enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)
    .eq('endpoint', parsed.data)

  if (error) {
    console.error('Push subscription disable failed', { userId: user.id, error })
    return { success: false, error: 'Não foi possível desativar a inscrição de notificações.' }
  }

  return { success: true }
}
