import { describe, expect, it } from 'vitest'
import {
  FIRST_DAY_NEW_CARDS,
  countRecalledToday,
  getFirstDayPlan,
  type FirstDayInput,
} from '@/features/onboarding/lib/firstDayPlan'

const freshUser: FirstDayInput = {
  isRecentSignup: true,
  hasAssignedPack: true,
  introducedToday: 0,
  dailyCardsReviewed: 0,
  totalReviews: 0,
  pendingAssignments: 1,
  completedAssignments: 0,
}

describe('quando o guia aparece', () => {
  it('aparece para quem acabou de sair do onboarding com um pack', () => {
    expect(getFirstDayPlan(freshUser).active).toBe(true)
  })

  it('não aparece para conta antiga', () => {
    expect(getFirstDayPlan({ ...freshUser, isRecentSignup: false }).active).toBe(false)
  })

  it('não aparece para quem pulou o pack — esse caso é do checklist de escolher pack', () => {
    expect(getFirstDayPlan({ ...freshUser, hasAssignedPack: false }).active).toBe(false)
  })

  it('some sozinho quando os três passos terminam', () => {
    const plan = getFirstDayPlan({
      ...freshUser,
      introducedToday: FIRST_DAY_NEW_CARDS,
      dailyCardsReviewed: FIRST_DAY_NEW_CARDS + 3,
      completedAssignments: 1,
    })
    expect(plan.complete).toBe(true)
    expect(plan.active).toBe(false)
    expect(plan.nextStep).toBeNull()
  })

  it('some para quem já tem histórico, mesmo com a conta recém-criada', () => {
    expect(getFirstDayPlan({ ...freshUser, totalReviews: 200 }).active).toBe(false)
  })
})

describe('uma ação por vez', () => {
  it('só libera o primeiro passo no começo', () => {
    const plan = getFirstDayPlan(freshUser)
    expect(plan.nextStep?.id).toBe('learn')
    expect(plan.steps.filter((step) => !step.locked)).toHaveLength(1)
  })

  it('libera os seguintes depois de aprender', () => {
    const plan = getFirstDayPlan({ ...freshUser, introducedToday: FIRST_DAY_NEW_CARDS, dailyCardsReviewed: FIRST_DAY_NEW_CARDS })
    expect(plan.steps.every((step) => !step.locked)).toBe(true)
    expect(plan.nextStep?.id).toBe('practice')
  })

  it('nunca aponta para um passo travado', () => {
    const plan = getFirstDayPlan(freshUser)
    expect(plan.nextStep?.locked).toBe(false)
  })
})

describe('o passo de revisão não pode se marcar sozinho', () => {
  it('continua pendente quando o usuário só aprendeu cards novos', () => {
    // A armadilha: dailyCardsReviewed inclui as estreias. Medir por ele daria o passo como feito
    // no mesmo instante em que a pessoa aprendeu a primeira frase.
    const plan = getFirstDayPlan({
      ...freshUser,
      introducedToday: FIRST_DAY_NEW_CARDS,
      dailyCardsReviewed: FIRST_DAY_NEW_CARDS,
    })
    expect(plan.steps.find((step) => step.id === 'recall')?.done).toBe(false)
  })

  it('completa quando uma frase volta pela escada e é respondida de novo', () => {
    const plan = getFirstDayPlan({
      ...freshUser,
      introducedToday: FIRST_DAY_NEW_CARDS,
      dailyCardsReviewed: FIRST_DAY_NEW_CARDS + 1,
    })
    expect(plan.steps.find((step) => step.id === 'recall')?.done).toBe(true)
  })

  it('countRecalledToday nunca fica negativo', () => {
    expect(countRecalledToday({ introducedToday: 5, dailyCardsReviewed: 2 })).toBe(0)
  })
})

describe('a promessa de tempo', () => {
  it('soma cinco minutos, que é o que o card anuncia', () => {
    expect(getFirstDayPlan(freshUser).totalMinutes).toBe(5)
  })
})
