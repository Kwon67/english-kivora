import { describe, expect, it } from 'vitest'
import { nextTravelEpisode, restoreTravelProgress, TRAVEL_LESSONS } from './travelUnit'
import { ContextAttemptSchema } from './contextPracticePersistence'
import { emptyTodayDraft } from './todayLesson'
describe('travel progression and evidence', () => {
  const saved = (completed: string[]) => JSON.stringify({ version: 1, completed, updatedAt: new Date().toISOString() })
  it('only restores an ordered prefix of the known unit', () => {
    const ids = TRAVEL_LESSONS.map(l => l.id)
    expect(restoreTravelProgress(saved(ids))?.completed).toEqual(ids)
    expect(nextTravelEpisode(ids)).toBe(3)
    expect(restoreTravelProgress(saved([ids[1]]))).toBeNull()
    expect(restoreTravelProgress(saved([ids[0], ids[0]]))).toBeNull()
    expect(restoreTravelProgress(saved(['unrelated']))).toBeNull()
  })
  it('accepts complete pilot attempts at its assigned band and rejects arbitrary lesson IDs', () => {
    const input = { attemptId: '11111111-1111-4111-8111-111111111111', level: 'A2', draft: { ...emptyTodayDraft(TRAVEL_LESSONS[3].id), response: 'Wednesday works.', revision: 'Wednesday at eleven works. Please confirm Room 2.', choice: 1, firstChoice: 0, hintsUsed: true, spoken: true } }
    expect(ContextAttemptSchema.safeParse(input).success).toBe(true)
    expect(ContextAttemptSchema.safeParse({ ...input, level: 'C2' }).success).toBe(false)
    expect(ContextAttemptSchema.safeParse({ ...input, draft: { ...input.draft, lessonId: 'arbitrary' } }).success).toBe(false)
  })
})
