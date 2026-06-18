import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'

export type RoutineAssignmentRow = {
  id: string
  pack_id: string
  game_mode: string
  status: string
  assigned_by: string
  assigned_date: string
  created_at?: string | null
  reward_badge_id?: string | null
}

export function isSelfRoutineAssignment(
  row: Pick<RoutineAssignmentRow, 'assigned_by' | 'reward_badge_id' | 'game_mode' | 'status'>
): boolean {
  if (row.assigned_by === 'self') return true

  // Legacy rows: completed member-added packs stored as admin before assigned_by rollout.
  return (
    row.assigned_by === 'admin' &&
    !row.reward_badge_id &&
    isPlayableAssignmentGameMode(row.game_mode) &&
    isAssignmentCompleted(row.status)
  )
}

function compareRoutineRows<T extends RoutineAssignmentRow>(a: T, b: T): number {
  if (a.assigned_date !== b.assigned_date) {
    return a.assigned_date < b.assigned_date ? 1 : -1
  }

  const aCreated = a.created_at || ''
  const bCreated = b.created_at || ''
  if (aCreated !== bCreated) {
    return aCreated < bCreated ? 1 : -1
  }

  return a.id < b.id ? 1 : -1
}

export function isAssignmentInDailyPlan(
  row: Pick<RoutineAssignmentRow, 'assigned_date' | 'status'>,
  today: string
): boolean {
  return row.assigned_date >= today || !isAssignmentCompleted(row.status)
}

function dedupeLatestSelfAssignments<T extends RoutineAssignmentRow>(rows: T[]): T[] {
  const byKey = new Map<string, T>()

  for (const row of rows) {
    const key = `${row.pack_id}:${row.game_mode}`
    const existing = byKey.get(key)
    if (!existing || compareRoutineRows(row, existing) < 0) {
      byKey.set(key, row)
    }
  }

  return Array.from(byKey.values())
}

export function filterRoutineAssignments<T extends RoutineAssignmentRow>(
  assignments: T[],
  today: string
): T[] {
  const playable = assignments.filter((row) => isPlayableAssignmentGameMode(row.game_mode))
  const selfRows = playable.filter((row) => isSelfRoutineAssignment(row))
  const adminRows = playable.filter((row) => !isSelfRoutineAssignment(row))

  const activeAdmin = adminRows.filter((row) => isAssignmentInDailyPlan(row, today))
  const activeSelf = dedupeLatestSelfAssignments(selfRows)

  return [...activeAdmin, ...activeSelf].sort(compareRoutineRows)
}

export function getRoutinePackIds(assignments: RoutineAssignmentRow[], today: string): string[] {
  return [...new Set(filterRoutineAssignments(assignments, today).map((row) => row.pack_id))]
}

export function isPackInRoutine(
  assignments: RoutineAssignmentRow[],
  packId: string,
  today: string
): boolean {
  return getRoutinePackIds(assignments, today).includes(packId)
}