import { PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import type { createClient } from '@/lib/supabase/client'

export type MemberTask = {
  id: string
  assigned_date: string
  game_mode: string
  assigned_by: string
  packs: { name: string } | null
}

export async function getAssignedTasks(db: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await db.from('assignments')
    .select('id,assigned_date,game_mode,assigned_by,packs(name)')
    .eq('user_id', userId).eq('assigned_by', 'admin')
    .in('game_mode', PLAYABLE_GAME_MODES).not('status', 'like', 'completed%')
    .order('assigned_date').order('id')
  if (error) return null
  return data as unknown as MemberTask[]
}
