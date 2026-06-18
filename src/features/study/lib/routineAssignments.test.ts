import { describe, expect, it } from 'vitest'
import {
  filterRoutineAssignments,
  getRoutinePackIds,
  isPackInRoutine,
  isSelfRoutineAssignment,
} from './routineAssignments'

const today = '2026-06-17'

function row(
  overrides: Partial<{
    id: string
    pack_id: string
    game_mode: string
    status: string
    assigned_by: string
    assigned_date: string
    created_at: string
    reward_badge_id: string | null
  }> = {}
) {
  return {
    id: 'a1',
    pack_id: 'pack-1',
    game_mode: 'flashcard',
    status: 'pending',
    assigned_by: 'self',
    assigned_date: today,
    created_at: '2026-06-17T10:00:00.000Z',
    reward_badge_id: null,
    ...overrides,
  }
}

describe('filterRoutineAssignments', () => {
  it('keeps self-assigned packs even when completed on a past date', () => {
    const assignments = [
      row({
        id: 'old',
        status: 'completed',
        assigned_date: '2026-06-15',
      }),
    ]

    const result = filterRoutineAssignments(assignments, today)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('old')
  })

  it('drops admin assignments completed on a past date', () => {
    const assignments = [
      row({
        id: 'admin-old',
        assigned_by: 'admin',
        status: 'completed',
        assigned_date: '2026-06-15',
        reward_badge_id: 'badge-1',
      }),
    ]

    expect(filterRoutineAssignments(assignments, today)).toHaveLength(0)
  })

  it('keeps admin assignments for today even when completed', () => {
    const assignments = [
      row({
        id: 'admin-today',
        assigned_by: 'admin',
        status: 'completed',
        assigned_date: today,
      }),
    ]

    expect(filterRoutineAssignments(assignments, today)).toHaveLength(1)
  })

  it('dedupes self assignments by pack and mode, keeping the latest row', () => {
    const assignments = [
      row({
        id: 'older',
        assigned_date: '2026-06-15',
        created_at: '2026-06-15T08:00:00.000Z',
      }),
      row({
        id: 'newer',
        assigned_date: '2026-06-16',
        created_at: '2026-06-16T08:00:00.000Z',
      }),
    ]

    const result = filterRoutineAssignments(assignments, today)
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('newer')
  })

  it('ignores non-playable game modes', () => {
    const assignments = [
      row({
        game_mode: 'scheduled_review',
        status: 'scheduled_review|weekdays=1|time=18:00|cards=|count=0|active=1|last=|until=',
      }),
    ]

    expect(filterRoutineAssignments(assignments, today)).toHaveLength(0)
  })
})

describe('isSelfRoutineAssignment', () => {
  it('treats legacy completed admin rows without badge as member routine', () => {
    expect(
      isSelfRoutineAssignment({
        assigned_by: 'admin',
        reward_badge_id: null,
        game_mode: 'flashcard',
        status: 'completed',
      })
    ).toBe(true)
  })

  it('keeps pending admin rows on the admin routine track', () => {
    expect(
      isSelfRoutineAssignment({
        assigned_by: 'admin',
        reward_badge_id: null,
        game_mode: 'flashcard',
        status: 'pending',
      })
    ).toBe(false)
  })

  it('keeps badge-backed admin rows as admin routine', () => {
    expect(
      isSelfRoutineAssignment({
        assigned_by: 'admin',
        reward_badge_id: 'badge-1',
        game_mode: 'flashcard',
      })
    ).toBe(false)
  })
})

describe('getRoutinePackIds', () => {
  it('matches explore and study routine visibility', () => {
    const assignments = [
      row({
        pack_id: 'pack-a',
        status: 'completed',
        assigned_date: '2026-06-10',
        assigned_by: 'admin',
        reward_badge_id: null,
      }),
      row({
        id: 'admin',
        pack_id: 'pack-b',
        assigned_by: 'admin',
        status: 'completed',
        assigned_date: '2026-06-10',
        reward_badge_id: 'badge-1',
      }),
      row({
        id: 'scheduled',
        pack_id: 'pack-c',
        game_mode: 'scheduled_review',
        status: 'scheduled_review|weekdays=1|time=18:00|cards=|count=0|active=1|last=|until=',
      }),
    ]

    expect(getRoutinePackIds(assignments, today)).toEqual(['pack-a'])
    expect(isPackInRoutine(assignments, 'pack-a', today)).toBe(true)
    expect(isPackInRoutine(assignments, 'pack-b', today)).toBe(false)
    expect(isPackInRoutine(assignments, 'pack-c', today)).toBe(false)
  })
})