import { NextResponse } from 'next/server'
import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { getReviewQueueSummaryForUser } from '@/lib/reviewQueue'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { configureWebPush } from '@/lib/pushNotifications'
import { createAdminClient } from '@/lib/supabase/server'
import { getAppDateString } from '@/lib/timezone'
import type { Tables } from '@/types/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type PushSubscriptionRow = Tables<'push_subscriptions'>

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

  const webpush = configureWebPush()
  const today = getAppDateString()

  const { data: subscriptions, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const groupedByUser = new Map<string, PushSubscriptionRow[]>()
  for (const row of (subscriptions || []) as PushSubscriptionRow[]) {
    const items = groupedByUser.get(row.user_id) || []
    items.push(row)
    groupedByUser.set(row.user_id, items)
  }

  let sent = 0
  let skipped = 0
  let removed = 0

  for (const [userId, userSubscriptions] of groupedByUser) {
    const summary = await getReviewQueueSummaryForUser(
      supabase as unknown as Parameters<typeof getReviewQueueSummaryForUser>[0],
      userId
    )

    const { data: assignments } = await supabase
      .from('assignments')
      .select('status,game_mode')
      .eq('user_id', userId)

    const pendingAssignments =
      (assignments || []).filter(
        (assignment) =>
          isPlayableAssignmentGameMode(assignment.game_mode) &&
          !isAssignmentCompleted(assignment.status)
      ).length

    if (summary.totalDue <= 0) {
      skipped += userSubscriptions.length
      continue
    }

    for (const row of userSubscriptions) {
      const alreadyNotifiedToday =
        row.last_notified_for_date === today &&
        row.last_notified_due_count >= summary.totalDue

      if (alreadyNotifiedToday) {
        skipped++
        continue
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            expirationTime: row.expiration_time ? new Date(row.expiration_time).getTime() : null,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          JSON.stringify({
            title: 'Kivora English',
            body:
              pendingAssignments > 0
                ? `Você tem ${summary.totalDue} ${summary.totalDue === 1 ? 'revisão vencida' : 'revisões vencidas'} e ${pendingAssignments} ${pendingAssignments === 1 ? 'lição pendente' : 'lições pendentes'}.`
                : summary.totalDue === 1
                  ? 'Você tem 1 revisão vencida esperando por você.'
                  : `Você tem ${summary.totalDue} revisões vencidas esperando por você.`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            url: '/review',
            tag: `due-review-${today}`,
          })
        )

        await supabase
          .from('push_subscriptions')
          .update({
            last_notified_at: new Date().toISOString(),
            last_notified_for_date: today,
            last_notified_due_count: summary.totalDue,
          })
          .eq('id', row.id)

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

        console.error('Erro ao enviar push notification', { userId, endpoint: row.endpoint, sendError })
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    skipped,
    removed,
    usersChecked: groupedByUser.size,
  })
}
