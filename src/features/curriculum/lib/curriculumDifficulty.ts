import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

export type CurriculumStage = 'foundation' | 'development' | 'consolidation'
export const CURRICULUM_STAGE_LABELS: Record<CurriculumStage, string> = {
  foundation: 'Fundamentos', development: 'Desenvolvimento', consolidation: 'Consolidação',
}
export type CurriculumProgress = { completedPrefix: number; total: number }
export type SequencedPack = { id: string; curriculumPosition?: number | null; completed?: boolean }

/** A later completed lesson never bypasses a gap in the learning sequence. */
export function curriculumProgress(packs: SequencedPack[]): CurriculumProgress {
  const ordered = packs.filter(p => Number.isInteger(p.curriculumPosition) && p.curriculumPosition! > 0)
    .sort((a, b) => a.curriculumPosition! - b.curriculumPosition! || a.id.localeCompare(b.id))
  const firstGap = ordered.findIndex(p => !p.completed)
  return { completedPrefix: firstGap < 0 ? ordered.length : firstGap, total: ordered.length }
}

/** Volume/date/XP alone never grants a stage. Recent difficulty can hold the workload back. */
export function curriculumStage(progress?: CurriculumProgress, accuracy?: number | null): CurriculumStage {
  const fraction = progress && progress.total > 0 && Number.isFinite(progress.completedPrefix)
    ? Math.max(0, Math.min(1, progress.completedPrefix / progress.total)) : 0
  const stage = fraction < 1 / 3 ? 0 : fraction < 2 / 3 ? 1 : 2
  const ceiling = accuracy != null && Number.isFinite(accuracy) ? accuracy < 0.6 ? 0 : accuracy < 0.8 ? 1 : 2 : 2
  return (['foundation', 'development', 'consolidation'] as const)[Math.min(stage, ceiling)]
}

/** A small frontier keeps automatic tasks near the next lesson; completed lessons remain reviewable. */
export function withinCurriculumFrontier<T extends SequencedPack>(packs: T[], window = 3): T[] {
  const ordered = packs.filter(p => Number.isInteger(p.curriculumPosition) && p.curriculumPosition! > 0)
    .sort((a, b) => a.curriculumPosition! - b.curriculumPosition! || a.id.localeCompare(b.id))
  if (!ordered.length) return packs
  const firstGap = ordered.findIndex(p => !p.completed)
  const eligible = new Set(ordered.slice(0, firstGap < 0 ? ordered.length : firstGap + Math.max(1, window)).map(p => p.id))
  return packs.filter(p => eligible.has(p.id) || p.completed)
}

const WORD_LIMITS: Record<LearnerCefrLevel, [number, number, number]> = {
  A1: [6, 8, 9], A2: [9, 11, 13], B1: [12, 16, 19], B2: [18, 22, 25], C1: [24, 28, 32], C2: [28, 34, 40],
}
const GUIDANCE: Record<LearnerCefrLevel, [string, string, string]> = {
  A1: ['Cumprimentos, identificação, to be e substantivos concretos frequentes. Uma ideia direta.', 'Presente simples, perguntas curtas, quantidades, lugares, preferências e can; retome o vocabulário conhecido.', 'Combine necessidades cotidianas em frases curtas: horários, datas, compras e direções. Sem present perfect, hipóteses ou subordinadas complexas.'],
  A2: ['Retome presente simples e contínuo com vocabulário familiar. Pedidos e trocas curtas antes de narrativas.', 'Introduza passado simples, planos, comparação e quantidades em situações familiares, uma novidade por frase.', 'Combine passado, planos e motivos simples com because/when. Sem perfect continuous, inversão formal ou argumentação abstrata.'],
  B1: ['Relatos cotidianos curtos e opiniões com um motivo explícito.', 'Amplie relatos e experiências, present perfect e condicionais simples com conectivos comuns.', 'Conecte experiências, planos e explicações, com reformulação simples e contexto claro; sem exigir nuance de B2.'],
  B2: ['Opiniões claras, comparação de alternativas e justificativas em contextos conhecidos.', 'Introduza hipóteses, perspectiva, passiva quando natural e contra-argumentos explícitos.', 'Sustente argumentos e negocie soluções com nuances e coesão, sem exigir inferência densa de C1.'],
  C1: ['Precisão lexical e ajuste de registro em contextos explícitos, sem acumular jargão.', 'Atenuação, inferência contextual, colocações e relações argumentativas menos explícitas.', 'Integre registro, subtexto e argumentação complexa com naturalidade; não exija domínio cultural especializado de C2.'],
  C2: ['Contraste nuances e registros em exemplos breves, com contexto suficiente para interpretar a intenção.', 'Explore ambiguidade, ironia, reformulação e efeitos retóricos com pistas de contexto.', 'Combine sutileza idiomática, efeitos estilísticos e interpretações concorrentes. Complexidade deve servir ao sentido; evite obscuridade gratuita.'],
}

export function stageGuidance(level: LearnerCefrLevel, stage: CurriculumStage) {
  const index = (['foundation', 'development', 'consolidation'] as const).indexOf(stage)
  return { maxWords: WORD_LIMITS[level][index], guidance: GUIDANCE[level][index] }
}
