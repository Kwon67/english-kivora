import { NextResponse } from 'next/server'
import { getCefrLevelLabel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { configureWebPush } from '@/features/notifications/lib/pushNotifications'
import { ensureDailyPlan } from '@/features/study/lib/ensureDailyPlan'
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

/**
 * A notificação fala o nível do aluno, não o nome do pack.
 *
 * "Seu treino de A1 chegou" diz a ele que o site sabe onde ele está; o nome de
 * um pack que ele nunca escolheu não diz nada. É a mesma razão de o plano
 * existir: a decisão saiu das mãos dele, então a mensagem precisa mostrar o
 * critério por trás dela.
 */
function buildPlanMessage(level: LearnerCefrLevel, count: number): string {
  const label = getCefrLevelLabel(level).toLowerCase()
  const activities = count === 1 ? '1 atividade' : `${count} atividades`

  return `Seu plano de hoje tem ${activities} no nível ${level} (${label}).`
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

  const { data: profiles, error } = await supabase.from('profiles').select('id')

  if (error) {
    console.error('Erro ao listar perfis para o plano do dia', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('enabled', true)

  const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>()
  for (const row of (subscriptions || []) as PushSubscriptionRow[]) {
    const items = subscriptionsByUser.get(row.user_id) || []
    items.push(row)
    subscriptionsByUser.set(row.user_id, items)
  }

  const webpush = configureWebPush()

  let planned = 0
  let skipped = 0
  let notified = 0

  for (const profile of profiles || []) {
    const userId = profile.id as string

    const result = await ensureDailyPlan(supabase as unknown as Parameters<typeof ensureDailyPlan>[0], userId)

    if (!result.created) {
      skipped++
      continue
    }

    planned++

    for (const row of subscriptionsByUser.get(userId) || []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            expirationTime: row.expiration_time ? new Date(row.expiration_time).getTime() : null,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          JSON.stringify({
            title: 'Kivora Inglês',
            body: buildPlanMessage(result.level, result.activities.length),
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            url: '/home',
            tag: `daily-plan-${today}`,
          })
        )
        notified++
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
          continue
        }

        console.error('Erro ao notificar plano do dia', { userId, sendError })
      }
    }
  }

  return NextResponse.json({ success: true, planned, skipped, notified, date: today })
}
