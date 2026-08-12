import { NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/webpush'
import { createAdminClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import type { Tables } from '@/types/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PushSubscriptionRow = Tables<'push_subscriptions'>
type UserStreakRow = Tables<'user_streaks'>

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const header = request.headers.get('x-cron-secret')?.trim()

  return bearer === expected || header === expected
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente' }, { status: 500 })
  }

  const today = getAppDateString()
  const yesterday = shiftAppDate(today, -1)

  const { data: streaks, error: streakError } = await supabase
    .from('user_streaks')
    .select('*')
    .gt('current_streak', 0)
    .eq('last_activity_date', yesterday)

  if (streakError) {
    console.error('Erro ao buscar streaks em risco', streakError)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const riskStreaks = (streaks || []) as UserStreakRow[]
  const userIds = riskStreaks.map((row) => row.user_id)

  if (userIds.length === 0) {
    return NextResponse.json({ success: true, sent: 0, skipped: 0, removed: 0, usersChecked: 0 })
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true)
    .in('user_id', userIds)

  if (subscriptionError) {
    console.error('Erro ao buscar inscrições de push para streak', subscriptionError)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>()
  for (const row of (subscriptions || []) as PushSubscriptionRow[]) {
    const items = subscriptionsByUser.get(row.user_id) || []
    items.push(row)
    subscriptionsByUser.set(row.user_id, items)
  }

  let sent = 0
  let skipped = 0
  let removed = 0

  for (const streak of riskStreaks) {
    const userSubscriptions = subscriptionsByUser.get(streak.user_id) || []
    if (userSubscriptions.length === 0) {
      skipped++
      continue
    }

    const currentStreak = streak.current_streak ?? 0
    const isProtected = !!streak.streak_frozen_until && streak.streak_frozen_until >= yesterday
    const title = isProtected ? '❄️ Sua proteção de sequência está ativa' : '🔥 Sua streak está em risco!'
    const body = isProtected
      ? `Sua sequência de ${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'} está protegida hoje, mas continue estudando para não perder o ritmo!`
      : `Você tem streak de ${currentStreak} ${currentStreak === 1 ? 'dia' : 'dias'}. Estude pelo menos 1 card para não perder!`

    for (const row of userSubscriptions) {
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
            title,
            body,
            url: '/review',
            tag: `streak-risk-${today}`,
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

        console.error('Erro ao enviar lembrete de streak', { userId: row.user_id, endpoint: row.endpoint, sendError })
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped,
    removed,
    usersChecked: riskStreaks.length,
  })
}
