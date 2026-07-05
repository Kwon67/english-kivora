import { describe, expect, it } from 'vitest'
import { getLearningProfilePlan, type LearningProfileInput } from './learningProfile'

const baseReviewStats = {
  dueToday: 0,
  dueTomorrow: 0,
  newCards: 0,
  totalDue: 0,
  totalBacklogDue: 0,
  deferredDue: 0,
  totalReviews: 20,
  introducedToday: 0,
  newCardsLimit: 10,
  sessionLimit: 10,
  dailyCardsReviewed: 0,
}

function input(overrides: Partial<LearningProfileInput> = {}): LearningProfileInput {
  return {
    cefrProfile: {
      level: 'A1',
      levelName: 'Iniciante',
      confidence: 82,
      totalInteractions: 30,
      assessing: false,
      nextLevel: 'A2',
      progressToNext: 20,
      source: 'auto',
    },
    reviewStats: baseReviewStats,
    problemWordsCount: 0,
    pendingAssignmentsCount: 0,
    completedReviewsToday: 0,
    streakStatus: 'normal',
    dailyGoalMinutes: 10,
    interests: [],
    ...overrides,
  }
}

describe('getLearningProfilePlan', () => {
  it('prioritizes vocabulary and SRS for A1 learners', () => {
    const plan = getLearningProfilePlan(input())

    expect(plan.stage).toBe('vocabulary')
    expect(plan.focusAreas).toContain('SRS diário')
    expect(plan.headline).toContain('vocabulário')
  })

  it('prioritizes due SRS work before new content', () => {
    const plan = getLearningProfilePlan(
      input({
        reviewStats: {
          ...baseReviewStats,
          totalDue: 6,
          dueToday: 6,
          totalBacklogDue: 14,
        },
        problemWordsCount: 9,
      })
    )

    expect(plan.stage).toBe('srs-repair')
    expect(plan.primaryAction.href).toBe('/review')
    expect(plan.signals).toContain('Prioridade: reduzir acúmulo antes de consumir conteúdo novo')
  })

  it('moves B1 learners toward shadowing', () => {
    const plan = getLearningProfilePlan(
      input({
        cefrProfile: {
          level: 'B1',
          levelName: 'Intermediário',
          confidence: 78,
          totalInteractions: 90,
          assessing: false,
          nextLevel: 'B2',
          progressToNext: 45,
          source: 'auto',
        },
      })
    )

    expect(plan.stage).toBe('shadowing')
    expect(plan.focusAreas).toContain('Shadowing')
  })

  it('keeps unassessed learners in diagnostic mode', () => {
    const plan = getLearningProfilePlan(
      input({
        cefrProfile: {
          level: null,
          levelName: 'Em avaliação',
          confidence: 0,
          totalInteractions: 0,
          assessing: true,
          nextLevel: 'A1',
          progressToNext: 0,
          source: 'auto',
        },
      })
    )

    expect(plan.stage).toBe('diagnostic')
    expect(plan.primaryAction.href).toBe('/onboarding')
  })

  it('rotates resources when the same stage recently stalled without engagement', () => {
    const plan = getLearningProfilePlan(
      input({
        interests: ['conversation'],
        learningMemory: {
          recentPlans: [
            {
              planDate: '2026-07-04',
              stage: 'vocabulary',
              level: 'A1',
              resourceIds: ['a1-youtube-short-story', 'a1-netflix-micro-scenes'],
              outcomeStatus: 'stalled',
            },
          ],
          recentOpenedResourceIds: [],
        },
      })
    )

    expect(plan.stage).toBe('vocabulary')
    expect(plan.resources[0]?.id).not.toBe('a1-youtube-short-story')
    expect(plan.signals).toContain('Ajuste automático: trocamos recursos pouco engajados recentemente')
  })
})
