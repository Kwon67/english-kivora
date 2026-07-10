import { createElement } from 'react'
import { NextResponse } from 'next/server'
import SubscriptionReminder from '@/emails/SubscriptionReminder'
import { createAdminClient } from '@/lib/supabase/server'
import { sendResendEmail } from '@/lib/resendMail'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DAY_MS = 24 * 60 * 60 * 1000

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const header = request.headers.get('x-cron-secret')?.trim()
  return bearer === expected || header === expected
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Maceio',
  }).format(new Date(value))
}

function getGraceEnd(periodEnd: string, existingGraceEnd: string | null) {
  return existingGraceEnd || new Date(new Date(periodEnd).getTime() + 3 * DAY_MS).toISOString()
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.RESEND_API_KEY?.trim()) return NextResponse.json({ error: 'RESEND_API_KEY ausente' }, { status: 500 })

  const supabase = createAdminClient()
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente' }, { status: 500 })

  const now = new Date()
  const nowIso = now.toISOString()
  const { data: entitlements, error } = await supabase
    .from('pro_entitlements')
    .select('user_id,status,current_period_end,grace_period_ends_at,renewal_reminder_sent_at')
    .in('status', ['active', 'trialing', 'past_due'])

  if (error) {
    console.error('Subscription entitlement scan failed', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  let movedToGrace = 0
  let downgraded = 0
  let remindersSent = 0
  const reminderCandidates: typeof entitlements = []

  for (const entitlement of entitlements || []) {
    if (!entitlement.current_period_end) continue

    const periodEnd = new Date(entitlement.current_period_end)
    if (Number.isNaN(periodEnd.getTime())) continue

    if (['active', 'trialing'].includes(entitlement.status) && periodEnd.getTime() <= now.getTime()) {
      const graceEnd = getGraceEnd(entitlement.current_period_end, entitlement.grace_period_ends_at)
      if (new Date(graceEnd).getTime() > now.getTime()) {
        const { error: graceError } = await supabase
          .from('pro_entitlements')
          .update({ status: 'past_due', grace_period_ends_at: graceEnd, updated_at: nowIso })
          .eq('user_id', entitlement.user_id)
        if (!graceError) movedToGrace += 1
      } else {
        const { error: revokeError } = await supabase
          .from('pro_entitlements')
          .update({ status: 'revoked', revoked_at: nowIso, downgraded_at: nowIso, updated_at: nowIso })
          .eq('user_id', entitlement.user_id)
        if (!revokeError) downgraded += 1
      }
      continue
    }

    const daysUntilRenewal = periodEnd.getTime() - now.getTime()
    if (
      entitlement.status !== 'past_due' &&
      daysUntilRenewal > 0 &&
      daysUntilRenewal <= 7 * DAY_MS &&
      !entitlement.renewal_reminder_sent_at
    ) {
      reminderCandidates.push(entitlement)
    }
  }

  const userIds = reminderCandidates.map((item) => item.user_id)
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,email,username')
      .in('id', userIds)
    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile]))
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://english-kivora.vercel.app'

    for (const entitlement of reminderCandidates) {
      const profile = profileById.get(entitlement.user_id)
      if (!profile?.email || !entitlement.current_period_end) continue

      const graceDate = getGraceEnd(entitlement.current_period_end, entitlement.grace_period_ends_at)
      try {
        await sendResendEmail({
          to: profile.email,
          subject: 'Sua assinatura Pro está próxima da renovação',
          react: createElement(SubscriptionReminder, {
            username: profile.username,
            renewalDate: formatDate(entitlement.current_period_end),
            graceDate: formatDate(graceDate),
            appUrl,
          }),
        })
        await supabase
          .from('pro_entitlements')
          .update({ renewal_reminder_sent_at: nowIso, updated_at: nowIso })
          .eq('user_id', entitlement.user_id)
        remindersSent += 1
      } catch (sendError) {
        console.error('Subscription reminder failed', { userId: entitlement.user_id, sendError })
      }
    }
  }

  return NextResponse.json({ scanned: entitlements?.length || 0, remindersSent, movedToGrace, downgraded })
}

