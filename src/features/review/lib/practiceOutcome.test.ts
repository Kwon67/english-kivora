import { describe, expect, it } from 'vitest'
import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'
import {
  allowedGradesAfterPractice,
  isGradeAllowedAfterPractice,
  practiceOutcomeNotice,
  worstPracticeOutcome,
} from '@/features/review/lib/practiceOutcome'

describe('practiceOutcome', () => {
  it('sem prática ou com acerto limpo, as quatro notas ficam livres', () => {
    expect(allowedGradesAfterPractice(null)).toEqual([0, 3, 4, 5])
    expect(allowedGradesAfterPractice('correct')).toEqual([0, 3, 4, 5])
    expect(allowedGradesAfterPractice('unscored')).toEqual([0, 3, 4, 5])
    expect(practiceOutcomeNotice('correct')).toBeNull()
  })

  it('reprovar na prática deixa só "Errei" — ver o gabarito não vira acerto', () => {
    expect(allowedGradesAfterPractice('wrong')).toEqual([REVIEW_GRADE.AGAIN])
    expect(isGradeAllowedAfterPractice(REVIEW_GRADE.EASY, 'wrong')).toBe(false)
    expect(isGradeAllowedAfterPractice(REVIEW_GRADE.GOOD, 'wrong')).toBe(false)
    expect(isGradeAllowedAfterPractice(REVIEW_GRADE.AGAIN, 'wrong')).toBe(true)
    expect(practiceOutcomeNotice('wrong')).toMatch(/erro/)
  })

  it('erro de digitação limita a "Difícil"', () => {
    expect(allowedGradesAfterPractice('partial')).toEqual([REVIEW_GRADE.AGAIN, REVIEW_GRADE.HARD])
    expect(isGradeAllowedAfterPractice(REVIEW_GRADE.GOOD, 'partial')).toBe(false)
  })

  it('com vários modos vale o pior resultado, em qualquer ordem', () => {
    expect(worstPracticeOutcome(null, 'correct')).toBe('correct')
    expect(worstPracticeOutcome('correct', 'wrong')).toBe('wrong')
    expect(worstPracticeOutcome('wrong', 'correct')).toBe('wrong')
    expect(worstPracticeOutcome('partial', 'correct')).toBe('partial')
    expect(worstPracticeOutcome('unscored', 'partial')).toBe('partial')
  })
})
