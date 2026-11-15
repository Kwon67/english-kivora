import { adaptiveModes, type SkillSignal } from './studyQuality'
import { withinCurriculumFrontier } from '@/features/curriculum/lib/curriculumDifficulty'
import { getCefrLevelWeight, normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { getLevelPriority, type LevelGate } from '@/features/learning/lib/levelGate'
import type { GameMode } from '@/types/database.types'

/**
 * Monta o plano do dia do aluno sem que ele precise escolher nada.
 *
 * Puro de propósito: recebe catálogo e histórico já carregados e devolve a
 * lista de atividades. Quem grava no banco é o chamador, então esta regra —
 * a parte que de fato define a experiência — é testável sem Supabase.
 */

export const MIN_DAILY_PLAN = 2
export const MAX_DAILY_PLAN = 5
const BASE_DAILY_PLAN = 3

/**
 * Quantos dias para trás o motor evita repetir um pack.
 *
 * Curto o bastante para o catálogo não acabar, longo o bastante para o dia
 * seguinte não parecer o anterior.
 */
export const PACK_COOLDOWN_DAYS = 14

export type DailyPlanHistory = {
  /** Dias com ao menos uma atividade concluída nos últimos 7. */
  activeDaysLast7: number
  /** Concluídas ÷ atribuídas nos últimos 7 dias. 0 quando não houve plano. */
  completionRateLast7: number
}

/**
 * O tamanho do plano segue a constância recente, não a ambição declarada.
 *
 * Quem está voltando depois de sumir recebe o mínimo: o objetivo do dia é
 * reabrir o hábito, e um plano grande na volta é o jeito mais rápido de perder
 * a pessoa de novo. Quem fecha o plano todo dia ganha volume, porque para essa
 * pessoa o teto baixo é que vira o problema.
 */
export function getDailyPlanSize(history: DailyPlanHistory): number {
  let size = BASE_DAILY_PLAN

  if (history.activeDaysLast7 <= 1 || history.completionRateLast7 < 0.4) {
    size -= 1
  }

  if (history.activeDaysLast7 >= 5 && history.completionRateLast7 >= 0.8) {
    size += 1
  }

  if (history.activeDaysLast7 >= 7 && history.completionRateLast7 >= 0.9) {
    size += 1
  }

  return Math.max(MIN_DAILY_PLAN, Math.min(MAX_DAILY_PLAN, size))
}

/**
 * Listening, speaking and short written production are available from A1.
 * Sentence complexity is controlled by the curriculum; writing needs practice
 * before the final A1 assessment. Matching adds simultaneous reading later.
 */
const MODE_UNLOCKS: Record<LearnerCefrLevel, GameMode[]> = {
  A1: ['flashcard', 'multiple_choice', 'listening', 'speaking', 'typing'],
  A2: [],
  B1: ['matching'],
  B2: [],
  C1: [],
  C2: [],
}

export function getModesForLevel(level: LearnerCefrLevel): GameMode[] {
  const ceiling = getCefrLevelWeight(level)

  return (Object.keys(MODE_UNLOCKS) as LearnerCefrLevel[])
    .filter((unlock) => getCefrLevelWeight(unlock) <= ceiling)
    .flatMap((unlock) => MODE_UNLOCKS[unlock])
}

export type PlanCandidatePack = {
  id: string
  level: string | null
  curriculumPosition?: number | null
  completed?: boolean
  assignedToday?: boolean
  /** Última vez que o aluno recebeu este pack, em YYYY-MM-DD. */
  lastAssignedDate?: string | null
}

export type PlannedActivity = {
  packId: string
  gameMode: GameMode
  level: LearnerCefrLevel
}

function daysBetween(from: string, to: string): number {
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return Number.POSITIVE_INFINITY
  return (end - start) / (1000 * 60 * 60 * 24)
}

/**
 * Escolhe os packs do dia dentro do que o nível libera.
 *
 * A ordem vem de `getLevelPriority` (atual → consolidação → desafio) e, dentro
 * de cada nível, packs em descanso ficam para o fim em vez de serem descartados:
 * um catálogo pequeno não pode produzir um plano vazio, então o cooldown é uma
 * preferência, nunca um filtro rígido.
 */
export function buildDailyPlan(input: {
  gate: LevelGate
  catalog: PlanCandidatePack[]
  today: string
  size: number
  skillSignals?: SkillSignal[]
}): PlannedActivity[] {
  const { gate, catalog, today, size } = input
  const priority = getLevelPriority(gate)

  const byLevel = new Map<LearnerCefrLevel, PlanCandidatePack[]>()
  for (const pack of catalog) {
    const level = normalizePackLevel(pack.level)
    if (!gate.allowed.includes(level)) continue
    const bucket = byLevel.get(level)
    if (bucket) bucket.push(pack)
    else byLevel.set(level, [pack])
  }

  for (const [level, allPacks] of byLevel) {
    const bucket = withinCurriculumFrontier(allPacks).filter(pack => !pack.assignedToday)
    byLevel.set(level, bucket)
    bucket.sort((a, b) => {
      // Introduce the next lesson before rotating reviews; a cooldown must never skip prerequisites.
      if (a.curriculumPosition != null && b.curriculumPosition != null) {
        if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1
        if (!a.completed && !b.completed) return a.curriculumPosition - b.curriculumPosition
      }
      const restA = a.lastAssignedDate ? daysBetween(a.lastAssignedDate, today) : Number.POSITIVE_INFINITY
      const restB = b.lastAssignedDate ? daysBetween(b.lastAssignedDate, today) : Number.POSITIVE_INFINITY
      const coldA = restA >= PACK_COOLDOWN_DAYS
      const coldB = restB >= PACK_COOLDOWN_DAYS
      if (coldA !== coldB) return coldA ? -1 : 1
      return (restB - restA) || a.id.localeCompare(b.id)
    })
  }

  const modes = getModesForLevel(gate.current)
  const parsedDay = Date.parse(`${today}T00:00:00Z`)
  const modeOffset = Number.isNaN(parsedDay) ? 0 : Math.floor(parsedDay / 86_400_000)
  const chosenModes = adaptiveModes(modes, input.skillSignals ?? [], modeOffset, size)
  const plan: PlannedActivity[] = []
  const usedPacks = new Set<string>()

  // Percorre os níveis em rodadas: o plano fica variado por construção, em vez
  // de esvaziar o nível atual e só então descer para a consolidação.
  let exhausted = false
  while (plan.length < size && !exhausted) {
    exhausted = true

    for (const level of priority) {
      if (plan.length >= size) break

      const bucket = byLevel.get(level)
      if (!bucket) continue

      const pack = bucket.find((candidate) => !usedPacks.has(candidate.id))
      if (!pack) continue

      exhausted = false
      usedPacks.add(pack.id)
      plan.push({
        packId: pack.id,
        gameMode: chosenModes[plan.length % chosenModes.length] as GameMode,
        level,
      })
    }
  }

  return plan
}
