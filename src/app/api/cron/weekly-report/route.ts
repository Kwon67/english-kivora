import { NextResponse } from 'next/server'
import { createElement } from 'react'
import WeeklyReport from '@/emails/WeeklyReport'
import { sendResendEmail } from '@/lib/resendMail'
import { createAdminClient } from '@/lib/supabase/server'
import { formatAppDate, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import type { Tables } from '@/types/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ProfileRow = Pick<Tables<'profiles'>, 'id' | 'email' | 'username' | 'weekly_report_enabled'>
type ReviewRow = Pick<Tables<'card_reviews'>, 'quality' | 'review_date'>
type StreakRow = Pick<Tables<'user_streaks'>, 'current_streak'>

const BATCH_SIZE = 50
const MINUTES_PER_CARD = 2

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  const header = request.headers.get('x-cron-secret')?.trim()

  return bearer === expected || header === expected
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://english-kivora.vercel.app'
}

function getPeriod() {
  const today = getAppDateString()
  const startDate = shiftAppDate(today, -6)
  const endExclusive = shiftAppDate(today, 1)

  return {
    startDate,
    endDate: today,
    startIso: getAppDayStartUtcIso(startDate),
    endExclusiveIso: getAppDayStartUtcIso(endExclusive),
    label: `${formatAppDate(`${startDate}T12:00:00-03:00`, { day: 'numeric', month: 'long' })} a ${formatAppDate(`${today}T12:00:00-03:00`, { day: 'numeric', month: 'long', year: 'numeric' })}`,
  }
}

function calculateAccuracy(reviews: ReviewRow[]) {
  if (reviews.length === 0) return 0

  const correct = reviews.filter((review) => review.quality >= 3).length
  return Math.round((correct / reviews.length) * 100)
}

function calculateLevelProgress(cardsStudied: number, accuracy: number) {
  if (cardsStudied <= 0) return 8

  return Math.min(96, Math.max(12, Math.round((cardsStudied / 70) * 55 + accuracy * 0.35)))
}

async function sendReportForProfile(
  profile: ProfileRow,
  period: ReturnType<typeof getPeriod>,
  appUrl: string
) {
  const supabase = createAdminClient()
  if (!supabase) throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')

  const [{ data: reviews, error: reviewsError }, { data: streak, error: streakError }] = await Promise.all([
    supabase
      .from('card_reviews')
      .select('quality,review_date')
      .eq('user_id', profile.id)
      .gte('review_date', period.startIso)
      .lt('review_date', period.endExclusiveIso),
    supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', profile.id)
      .maybeSingle(),
  ])

  if (reviewsError) throw new Error(reviewsError.message)
  if (streakError) throw new Error(streakError.message)

  const weeklyReviews = (reviews || []) as ReviewRow[]
  const currentStreak = ((streak as StreakRow | null)?.current_streak ?? 0) || 0
  const cardsStudied = weeklyReviews.length
  const accuracy = calculateAccuracy(weeklyReviews)
  const estimatedMinutes = cardsStudied * MINUTES_PER_CARD
  const unsubscribeUrl = `${appUrl}/settings`

  const cefrProfile = await getUserCefrProfile(supabase, profile.id)
  const detectedLevel = cefrProfile.level || 'Em avaliação'
  const levelProgress =
    cefrProfile.progressToNext ??
    calculateLevelProgress(cardsStudied, accuracy)

  await sendResendEmail({
    to: profile.email,
    subject: `Seu relatório semanal Kivora English — ${period.label}`,
    react: createElement(WeeklyReport, {
      username: profile.username,
      periodLabel: period.label,
      cardsStudied,
      accuracy,
      currentStreak,
      estimatedMinutes,
      level: detectedLevel,
      levelProgress,
      appUrl,
      unsubscribeUrl,
    }),
  })
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY?.trim()) {
    return NextResponse.json({ error: 'RESEND_API_KEY ausente' }, { status: 500 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY ausente' }, { status: 500 })
  }

  const url = new URL(request.url)
  const userId = url.searchParams.get('userId')

  let profilesQuery = supabase
    .from('profiles')
    .select('id,email,username,weekly_report_enabled')
    .eq('weekly_report_enabled', true)
    .not('email', 'is', null)
    .order('created_at', { ascending: true })

  if (userId) {
    profilesQuery = profilesQuery.eq('id', userId)
  }

  const { data: profiles, error } = await profilesQuery

  if (error) {
    console.error('Erro ao buscar perfis para relatório semanal', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const period = getPeriod()
  const appUrl = getAppUrl()
  let sent = 0
  let failed = 0

  for (const batch of chunk((profiles || []) as ProfileRow[], BATCH_SIZE)) {
    const results = await Promise.allSettled(
      batch.map((profile) => sendReportForProfile(profile, period, appUrl))
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        sent++
      } else {
        failed++
        console.error('Erro ao enviar relatório semanal', result.reason)
      }
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    usersChecked: profiles?.length || 0,
    period: {
      start: period.startDate,
      end: period.endDate,
      label: period.label,
    },
  })
}
