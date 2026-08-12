import type { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export const HEATMAP_WEEKS_FULL = 12
export const HEATMAP_WEEKS_COMPACT = 8

export const HEATMAP_LEVELS = [
  'border border-brand-dark bg-bg-card',
  'border border-brand-dark bg-brand-accent/35',
  'border border-brand-dark bg-brand-accent/60',
  'border border-brand-dark bg-brand-accent/85',
  'border border-brand-dark bg-brand-accent',
] as const

export const HEATMAP_MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export const HEATMAP_WEEKDAY_ROW_LABELS: Record<number, string> = {
  0: 'Seg',
  1: 'Ter',
  2: 'Qua',
  3: 'Qui',
  4: 'Sex',
  5: 'Sáb',
  6: 'Dom',
}

export type HeatmapCell = {
  date: string | null
  count: number
  isFuture: boolean
}

export type HeatmapStats = {
  activeDays: number
  totalInteractions: number
  bestCount: number
  bestDate: string
}

export function buildActivityData(
  sessions: Array<{ completed_at: string; correct_answers: number; wrong_answers: number }>,
  cardReviews: Array<{ review_date: string; total_reviews: number }>,
) {
  const activityData: Record<string, number> = {}

  sessions.forEach((session) => {
    const dateStr = getAppDateString(session.completed_at)
    const interactions = session.correct_answers + session.wrong_answers
    activityData[dateStr] = (activityData[dateStr] || 0) + interactions
  })

  cardReviews.forEach((review) => {
    if (review.total_reviews <= 0) return
    const dateStr = getAppDateString(review.review_date)
    activityData[dateStr] = (activityData[dateStr] || 0) + 1
  })

  return activityData
}

export async function getActivityDataForUser(supabase: SupabaseServerClient, userId: string) {
  const [sessionsResult, reviewsResult] = await Promise.all([
    supabase
      .from('game_sessions')
      .select('completed_at,correct_answers,wrong_answers')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(120),
    supabase.from('card_reviews').select('review_date,total_reviews').eq('user_id', userId),
  ])

  return buildActivityData(sessionsResult.data || [], reviewsResult.data || [])
}

function parseAppDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getMondayIndex(dateStr: string) {
  const day = parseAppDate(dateStr).getDay()
  return day === 0 ? 6 : day - 1
}

export function getHeatmapColorClass(count: number, isFuture: boolean) {
  if (isFuture) return 'border border-transparent bg-transparent'
  if (count === 0) return HEATMAP_LEVELS[0]
  if (count <= 20) return HEATMAP_LEVELS[1]
  if (count <= 50) return HEATMAP_LEVELS[2]
  if (count <= 100) return HEATMAP_LEVELS[3]
  return HEATMAP_LEVELS[4]
}

export function formatHeatmapDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function buildHeatmapModel(activityData: Record<string, number>, weeks: number, today = getAppDateString()) {
  const mondayIndex = getMondayIndex(today)
  const currentWeekMonday = shiftAppDate(today, -mondayIndex)
  const gridStart = shiftAppDate(currentWeekMonday, -(weeks - 1) * 7)

  const grid: HeatmapCell[][] = Array.from({ length: weeks }, () =>
    Array.from({ length: 7 }, () => ({ date: null, count: 0, isFuture: true })),
  )

  for (let week = 0; week < weeks; week += 1) {
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = shiftAppDate(gridStart, week * 7 + weekday)
      const isFuture = date > today

      grid[week][weekday] = {
        date: isFuture ? null : date,
        count: isFuture ? 0 : activityData[date] || 0,
        isFuture,
      }
    }
  }

  const monthLabels = Array.from({ length: weeks }, (_, week) => {
    const weekMonday = shiftAppDate(gridStart, week * 7)
    const month = parseAppDate(weekMonday).getMonth()
    const previousMonth =
      week === 0 ? -1 : parseAppDate(shiftAppDate(gridStart, (week - 1) * 7)).getMonth()

    return month !== previousMonth ? HEATMAP_MONTH_LABELS[month] : ''
  })

  let activeDays = 0
  let totalInteractions = 0
  let bestCount = 0
  let bestDate = ''

  grid.flat().forEach((cell) => {
    if (!cell.date || cell.isFuture) return
    if (cell.count > 0) activeDays += 1
    totalInteractions += cell.count
    if (cell.count > bestCount) {
      bestCount = cell.count
      bestDate = cell.date
    }
  })

  return {
    grid,
    monthLabels,
    stats: { activeDays, totalInteractions, bestCount, bestDate } satisfies HeatmapStats,
  }
}