import { describe, expect, it } from 'vitest'
import { CEFR_LEVELS } from '@/features/cefr/lib/cefrLevels'
import { emptyTodayDraft, restoreTodayDraft, TODAY_LESSONS } from './todayLesson'
import { COMMUNICATIVE_CURRICULUM, COMMUNICATIVE_SKILLS, objectiveEvidenceStatus } from './communicativeCurriculum'

describe('contextual practice and evidence', () => {
  it.each(CEFR_LEVELS)('%s has an answer key, explanation, rewriting criteria and four observable objectives', level => {
    const lesson = TODAY_LESSONS[level]
    expect(lesson.choices[lesson.answer]).toBeTruthy()
    expect(new Set(lesson.choices).size).toBe(3)
    expect(lesson.explanation.length).toBeGreaterThan(30)
    expect(lesson.criteria).toHaveLength(3)
    expect(COMMUNICATIVE_CURRICULUM.filter(item => item.level === level).map(item => item.skill)).toEqual([...COMMUNICATIVE_SKILLS])
  })
  it('restores free responses without exact-match grading and rejects malformed progression', () => {
    const draft = { ...emptyTodayDraft('a1-meeting-01'), choice: 1, step: 3, response: 'Hi, I’m Lee. Can we meet at eleven instead?' }
    expect(restoreTodayDraft(JSON.stringify(draft), draft.lessonId)).toEqual(draft)
    expect(restoreTodayDraft(JSON.stringify(draft), 'another-task')).toBeNull()
    expect(restoreTodayDraft(JSON.stringify({ ...draft, response: '' }), draft.lessonId)).toBeNull()
    expect(restoreTodayDraft('broken json', draft.lessonId)).toBeNull()
  })
  it('does not turn self-review or objective quiz practice into verified skill mastery', () => {
    const objective = COMMUNICATIVE_CURRICULUM[0]
    expect(objectiveEvidenceStatus(objective, [])).toBe('not_observed')
    const item = { objectiveId: objective.id, taskId: 'a1-meeting-01', at: '2026-11-16T12:00:00Z', achieved: true, source: 'self_review' as const }
    expect(objectiveEvidenceStatus(objective, [item])).toBe('practice_evidence')
    expect(objectiveEvidenceStatus(objective, [{ ...item, source: 'objective_question' }])).toBe('practice_evidence')
    expect(objectiveEvidenceStatus(objective, [{ ...item, source: 'external_review' }])).toBe('reviewed_evidence')
  })
})
