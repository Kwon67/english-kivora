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
 * Modos liberados por nível.
 *
 * `listening` e `speaking` agora abrem já no A1, e isso é uma REVERSÃO deliberada. A escada
 * anterior os prendia em A2 e B2 sob o argumento de que "pedir speaking a um A1 mede coragem, não
 * inglês" — o que trata a fala como recompensa por já saber. Na prática produzia o contrário do
 * pretendido: o iniciante, que é justamente quem mais precisa treinar ouvido e boca, passava
 * semanas só lendo e digitando, e chegava ao B2 sem nunca ter dito uma frase em voz alta.
 *
 * Ouvir "I am a student." e repetir é acessível a qualquer nível — o que muda com o nível é a
 * COMPLEXIDADE da frase, e disso já cuida o teto de nível do `levelGate`. Os modos que continuam
 * escalonados são os que exigem produção escrita (`typing`) e leitura simultânea de vários pares
 * (`matching`), onde a dificuldade não vem da frase e sim da mecânica.
 */
const MODE_UNLOCKS: Record<LearnerCefrLevel, GameMode[]> = {
  A1: ['flashcard', 'multiple_choice', 'listening', 'speaking'],
  A2: ['typing'],
  B1: ['matching'],
  B2: [],
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

  for (const bucket of byLevel.values()) {
    bucket.sort((a, b) => {
      const restA = a.lastAssignedDate ? daysBetween(a.lastAssignedDate, today) : Number.POSITIVE_INFINITY
      const restB = b.lastAssignedDate ? daysBetween(b.lastAssignedDate, today) : Number.POSITIVE_INFINITY
      const coldA = restA >= PACK_COOLDOWN_DAYS
      const coldB = restB >= PACK_COOLDOWN_DAYS
      if (coldA !== coldB) return coldA ? -1 : 1
      return restB - restA
    })
  }

  const modes = getModesForLevel(gate.current)
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
        gameMode: modes[plan.length % modes.length],
        level,
      })
    }
  }

  return plan
}
