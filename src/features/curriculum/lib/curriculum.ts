import { LEARNER_CEFR_LEVELS, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

/**
 * Currículo por nível com prova final (mastery learning).
 *
 * O nível do aluno é o PRIMEIRO nível ainda não aprovado na prova final. Não existe mais subir de
 * nível só por estatística de acerto: para sair do A1 é preciso passar na prova do A1, que libera
 * ao concluir todos os packs do nível — ou antes, como "prova para pular", para quem já domina.
 *
 * Referências usadas para a régua:
 * - 80% é o critério clássico de domínio de Bloom (mastery learning);
 * - cada nível CEFR pede de 100 a 200 horas guiadas (Cambridge), então um nível é um bloco longo
 *   de estudo, não oito lições — daí o nível inteiro do catálogo (40+ packs) entrar na trilha.
 */

/** Nota mínima para passar na prova final de um nível. */
export const EXAM_PASS_RATIO = 0.8

/** Questões por prova. Com 40+ packs por nível, 30 cobre o nível sem virar maratona. */
export const EXAM_QUESTION_COUNT = 30

/** Espera depois de reprovar. Curta: serve para revisar, não para punir. */
export const EXAM_RETRY_COOLDOWN_MINUTES = 30

/** Uma tentativa aberta há mais tempo que isso não é retomada: começa outra. */
export const EXAM_ATTEMPT_RESUME_MINUTES = 90

export type PassedLevelSummary = { score: number; total: number; passedAt: string }

/** Primeiro nível sem aprovação. Com todos aprovados, o aluno fica no C2 (topo). */
export function getCurriculumLevel(passed: ReadonlySet<LearnerCefrLevel>): LearnerCefrLevel {
  return LEARNER_CEFR_LEVELS.find((level) => !passed.has(level)) ?? 'C2'
}

export function getNextCurriculumLevel(level: LearnerCefrLevel): LearnerCefrLevel | null {
  const index = LEARNER_CEFR_LEVELS.indexOf(level)
  return LEARNER_CEFR_LEVELS[index + 1] ?? null
}

export function isExamPassing(score: number, total: number): boolean {
  return total > 0 && score / total >= EXAM_PASS_RATIO
}

/** Minutos que faltam para poder tentar de novo depois de uma reprovação. 0 = já pode. */
export function getExamCooldownMinutes(lastFailedAt: string | null, now: Date = new Date()): number {
  if (!lastFailedAt) return 0
  const failedAt = Date.parse(lastFailedAt)
  if (Number.isNaN(failedAt)) return 0
  const remainingMs = failedAt + EXAM_RETRY_COOLDOWN_MINUTES * 60_000 - now.getTime()
  return remainingMs > 0 ? Math.ceil(remainingMs / 60_000) : 0
}
