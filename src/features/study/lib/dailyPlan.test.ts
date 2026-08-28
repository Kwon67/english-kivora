import { describe, expect, it } from 'vitest'
import { getLevelGate } from '@/features/learning/lib/levelGate'
import {
  buildDailyPlan,
  getDailyPlanSize,
  getModesForLevel,
  MAX_DAILY_PLAN,
  MIN_DAILY_PLAN,
  PACK_COOLDOWN_DAYS,
  type PlanCandidatePack,
} from './dailyPlan'

const TODAY = '2026-08-27'

function daysAgo(days: number): string {
  const date = new Date(`${TODAY}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - days)
  return date.toISOString().slice(0, 10)
}

describe('getDailyPlanSize', () => {
  it('encolhe para quem sumiu, para a volta não assustar', () => {
    expect(getDailyPlanSize({ activeDaysLast7: 0, completionRateLast7: 0 })).toBe(MIN_DAILY_PLAN)
  })

  it('encolhe também para quem aparece mas não termina', () => {
    expect(getDailyPlanSize({ activeDaysLast7: 4, completionRateLast7: 0.3 })).toBe(2)
  })

  it('mantém o padrão no uso mediano', () => {
    expect(getDailyPlanSize({ activeDaysLast7: 3, completionRateLast7: 0.6 })).toBe(3)
  })

  it('cresce para quem é constante', () => {
    expect(getDailyPlanSize({ activeDaysLast7: 5, completionRateLast7: 0.85 })).toBe(4)
  })

  it('dá o teto para quem fecha o plano todo dia', () => {
    expect(getDailyPlanSize({ activeDaysLast7: 7, completionRateLast7: 1 })).toBe(MAX_DAILY_PLAN)
  })

  it('nunca sai da faixa', () => {
    const sizes = [
      getDailyPlanSize({ activeDaysLast7: -5, completionRateLast7: -1 }),
      getDailyPlanSize({ activeDaysLast7: 99, completionRateLast7: 9 }),
    ]
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(MIN_DAILY_PLAN)
      expect(size).toBeLessThanOrEqual(MAX_DAILY_PLAN)
    }
  })
})

describe('getModesForLevel', () => {
  it('começa no reconhecimento e não pede produção a um A1', () => {
    const modes = getModesForLevel('A1')
    expect(modes).toEqual(['flashcard', 'multiple_choice'])
    expect(modes).not.toContain('speaking')
  })

  it('acumula os modos dos níveis anteriores', () => {
    const b1 = getModesForLevel('B1')
    expect(b1).toContain('flashcard')
    expect(b1).toContain('listening')
    expect(b1).toContain('typing')
    expect(b1).not.toContain('speaking')
  })

  it('só libera speaking no B2', () => {
    expect(getModesForLevel('B2')).toContain('speaking')
  })
})

describe('buildDailyPlan', () => {
  const gate = getLevelGate({ level: 'B1', confidence: 50, progressToNext: 10, nextLevel: 'B2' })

  const catalog: PlanCandidatePack[] = [
    { id: 'a1-1', level: 'A1' },
    { id: 'a2-1', level: 'A2' },
    { id: 'b1-1', level: 'B1' },
    { id: 'b1-2', level: 'B1' },
    { id: 'b2-1', level: 'B2' },
    { id: 'c1-1', level: 'C1' },
  ]

  it('nunca inclui pack acima do que o nível libera', () => {
    const plan = buildDailyPlan({ gate, catalog, today: TODAY, size: 5 })
    expect(plan.map((item) => item.packId)).not.toContain('b2-1')
    expect(plan.map((item) => item.packId)).not.toContain('c1-1')
  })

  it('respeita o tamanho pedido', () => {
    expect(buildDailyPlan({ gate, catalog, today: TODAY, size: 3 })).toHaveLength(3)
  })

  it('começa pelo nível atual', () => {
    const plan = buildDailyPlan({ gate, catalog, today: TODAY, size: 3 })
    expect(plan[0].level).toBe('B1')
  })

  it('varia os níveis em vez de esvaziar o nível atual primeiro', () => {
    const plan = buildDailyPlan({ gate, catalog, today: TODAY, size: 3 })
    expect(new Set(plan.map((item) => item.level)).size).toBeGreaterThan(1)
  })

  it('não repete o mesmo pack no mesmo dia', () => {
    const plan = buildDailyPlan({ gate, catalog, today: TODAY, size: 5 })
    expect(new Set(plan.map((item) => item.packId)).size).toBe(plan.length)
  })

  it('prefere o pack descansado ao recém-usado', () => {
    const plan = buildDailyPlan({
      gate,
      today: TODAY,
      size: 1,
      catalog: [
        { id: 'quente', level: 'B1', lastAssignedDate: daysAgo(1) },
        { id: 'frio', level: 'B1', lastAssignedDate: daysAgo(PACK_COOLDOWN_DAYS + 1) },
      ],
    })
    expect(plan[0].packId).toBe('frio')
  })

  it('usa pack em descanso se for a única opção, em vez de devolver plano vazio', () => {
    const plan = buildDailyPlan({
      gate,
      today: TODAY,
      size: 2,
      catalog: [{ id: 'unico', level: 'B1', lastAssignedDate: daysAgo(1) }],
    })
    expect(plan).toHaveLength(1)
    expect(plan[0].packId).toBe('unico')
  })

  it('inclui o nível de desafio quando o aluno já o conquistou', () => {
    const stretched = getLevelGate({
      level: 'B1',
      confidence: 100,
      progressToNext: 100,
      nextLevel: 'B2',
    })
    const plan = buildDailyPlan({ gate: stretched, catalog, today: TODAY, size: 5 })
    expect(plan.map((item) => item.packId)).toContain('b2-1')
  })

  it('devolve plano vazio quando nada no catálogo serve ao nível', () => {
    const a1 = getLevelGate({ level: 'A1', confidence: 10, progressToNext: 0, nextLevel: 'A2' })
    const plan = buildDailyPlan({
      gate: a1,
      today: TODAY,
      size: 3,
      catalog: [{ id: 'b2-1', level: 'B2' }],
    })
    expect(plan).toEqual([])
  })

  it('só usa modos que o nível do aluno liberou', () => {
    const a1 = getLevelGate({ level: 'A1', confidence: 10, progressToNext: 0, nextLevel: 'A2' })
    const plan = buildDailyPlan({
      gate: a1,
      today: TODAY,
      size: 3,
      catalog: [
        { id: 'a1-1', level: 'A1' },
        { id: 'a1-2', level: 'A1' },
        { id: 'a1-3', level: 'A1' },
      ],
    })
    for (const item of plan) {
      expect(getModesForLevel('A1')).toContain(item.gameMode)
    }
  })
})
