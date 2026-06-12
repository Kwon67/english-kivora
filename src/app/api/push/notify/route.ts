import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendPushNotification } from '@/lib/webpush'
import { createAdminClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PushSubscriptionRow = Tables<'push_subscriptions'>

const NotifySchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(240),
  url: z.string().default('/home'),
  tag: z.string().max(120).optional(),
})

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const header = request.headers.get('x-cron-secret')?.trim()

  return bearer === expected || header === expected
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = NotifySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid notification payload' }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente' }, { status: 500 })
  }

  let query = supabase.from('push_subscriptions').select('*').eq('enabled', true)
  if (parsed.data.userId) {
    query = query.eq('user_id', parsed.data.userId)
  }

  const { data, error } = await query
  if (error) {
    console.error('Erro ao buscar push subscriptions', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  let sent = 0
  let removed = 0

  for (const row of (data || []) as PushSubscriptionRow[]) {
    try {
      await sendPushNotification(
        {
          endpoint: row.endpoint,
          expirationTime: row.expiration_time ? new Date(row.expiration_time).getTime() : null,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        {
          title: parsed.data.title,
          body: parsed.data.body,
          url: parsed.data.url,
          tag: parsed.data.tag,
        }
      )
      sent++
    } catch (sendError) {
      const statusCode =
        typeof sendError === 'object' &&
        sendError &&
        'statusCode' in sendError &&
        typeof (sendError as { statusCode?: unknown }).statusCode === 'number'
          ? (sendError as { statusCode: number }).statusCode
          : null

      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('id', row.id)
        removed++
        continue
      }

      console.error('Erro ao enviar push notification', { userId: row.user_id, endpoint: row.endpoint, sendError })
    }
  }

  return NextResponse.json({ success: true, sent, removed })
}
