import { redirect } from 'next/navigation'
import { isCefrLevel } from '@/features/cefr/lib/cefrLevels'

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ level?: string; unit?: string }> }) {
  const { level, unit } = await searchParams
  const query = new URLSearchParams()
  if (isCefrLevel(level)) query.set('level', level)
  if (unit === 'travel') query.set('unit', unit)
  redirect(query.size ? '/practice-context?' + query.toString() : '/home')
}
