import {
  CEFR_LEVEL_LABELS,
  LEARNER_CEFR_LEVELS,
  getCefrLevelWeight,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  getNextCurriculumLevel,
  type PassedLevelSummary,
} from '@/features/curriculum/lib/curriculum'

/**
 * A trilha da Home: o CURRÍCULO do aluno, nível por nível, desenhado como um caminho de bolinhas.
 *
 * Antes a trilha era só o histórico de atribuições, e o motor de IA dá packs gerados na hora —
 * então o A1 aparecia com 6 ou 8 bolinhas e o aluno "chegava" ao B1 sem ter visto 40 dos 44 packs
 * do nível. Agora cada nível é o conjunto inteiro de packs públicos daquele nível, na ordem
 * pedagógica (`packs.curriculum_position`), e o nível só termina com a prova final aprovada.
 *
 * Mostrar o nível inteiro faria uma página de rolagem gigante (44 bolinhas só no A1). A regra de
 * exibição é: as concluídas mais recentes (expansíveis) e NO MÁXIMO 3 não concluídas à frente.
 * O tamanho real do nível fica no contador da faixa ("12/44"), não em bolinhas.
 */

export type CurriculumPackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  category: string | null
  curriculum_position: number | null
  created_at: string | null
}

export type PackProgress = {
  timesCompleted: number
  lastStudiedDate: string | null
  /** Linha pendente para abrir direto em /play. */
  pendingAssignmentId: string | null
}

export type PathNodeState = 'done' | 'current' | 'open'

export type PathNode = {
  key: string
  packId: string
  packName: string
  packDescription: string | null
  category: string | null
  level: LearnerCefrLevel
  state: PathNodeState
  playAssignmentId: string | null
  timesCompleted: number
  lastStudiedDate: string | null
}

export type PathExamState = {
  /** `passed`: aprovado; `ready`: todos os packs feitos; `skip`: ainda dá para pular com prova. */
  status: 'passed' | 'ready' | 'skip'
  score: number | null
  total: number | null
  remainingPacks: number
}

export type PathUnit = {
  level: LearnerCefrLevel
  label: string
  status: 'passed' | 'current'
  nodes: PathNode[]
  doneCount: number
  containsCurrent: boolean
  exam: PathExamState
}

export type LearningPath = {
  units: PathUnit[]
  current: PathNode | null
  currentLevel: LearnerCefrLevel
  nextLevel: LearnerCefrLevel | null
  /** Packs concluídos e total no nível atual — é o que o cabeçalho mostra. */
  doneCount: number
  totalCount: number
}

function comparePacks(a: CurriculumPackRow, b: CurriculumPackRow): number {
  const posA = a.curriculum_position ?? Number.MAX_SAFE_INTEGER
  const posB = b.curriculum_position ?? Number.MAX_SAFE_INTEGER
  if (posA !== posB) return posA - posB
  const createdA = a.created_at ?? ''
  const createdB = b.created_at ?? ''
  if (createdA !== createdB) return createdA < createdB ? -1 : 1
  return a.id < b.id ? -1 : 1
}

export function buildLearningPath(input: {
  packs: CurriculumPackRow[]
  progress: ReadonlyMap<string, PackProgress>
  passedLevels: ReadonlyMap<LearnerCefrLevel, PassedLevelSummary>
  currentLevel: LearnerCefrLevel
}): LearningPath {
  const { packs, progress, passedLevels, currentLevel } = input
  const ceiling = getCefrLevelWeight(currentLevel)
  const units: PathUnit[] = []
  let current: PathNode | null = null

  // Níveis acima do atual não entram: aparecem só como o cadeado "próximo nível" na interface.
  for (const level of LEARNER_CEFR_LEVELS) {
    if (getCefrLevelWeight(level) > ceiling) break

    const levelPacks = packs
      .filter((pack) => normalizePackLevel(pack.level) === level)
      .sort(comparePacks)

    const nodes: PathNode[] = levelPacks.map((pack) => {
      const packProgress = progress.get(pack.id)
      const timesCompleted = packProgress?.timesCompleted ?? 0
      return {
        key: pack.id,
        packId: pack.id,
        packName: pack.name,
        packDescription: pack.description,
        category: pack.category,
        level,
        state: timesCompleted > 0 ? 'done' : 'open',
        playAssignmentId: packProgress?.pendingAssignmentId ?? null,
        timesCompleted,
        lastStudiedDate: packProgress?.lastStudiedDate ?? null,
      }
    })

    // A lição atual é a primeira não concluída na ordem do currículo — só no nível atual. Num
    // nível já aprovado com pack pendente (pulou com prova), as abertas continuam opcionais.
    if (level === currentLevel) {
      const next = nodes.find((node) => node.state === 'open')
      if (next) {
        next.state = 'current'
        current = next
      }
    }

    const doneCount = nodes.filter((node) => node.state === 'done').length
    const passed = passedLevels.get(level)

    units.push({
      level,
      label: CEFR_LEVEL_LABELS[level],
      status: passed ? 'passed' : 'current',
      nodes,
      doneCount,
      containsCurrent: nodes.some((node) => node.state === 'current'),
      exam: {
        status: passed ? 'passed' : nodes.length > 0 && doneCount === nodes.length ? 'ready' : 'skip',
        score: passed?.score ?? null,
        total: passed?.total ?? null,
        remainingPacks: nodes.length - doneCount,
      },
    })
  }

  const currentUnit = units.find((unit) => unit.level === currentLevel)

  return {
    units,
    current,
    currentLevel,
    nextLevel: getNextCurriculumLevel(currentLevel),
    doneCount: currentUnit?.doneCount ?? 0,
    totalCount: currentUnit?.nodes.length ?? 0,
  }
}

/** Quantas concluídas aparecem antes do "Mostrar mais". */
export const VISIBLE_DONE_COUNT = 3

/** Teto de bolinhas NÃO concluídas na tela — pedido explícito: nunca uma rolagem gigante. */
export const MAX_VISIBLE_PENDING = 3

/**
 * Quais bolinhas de um nível aparecem.
 *
 * Concluídas: as `VISIBLE_DONE_COUNT` mais recentes na ordem do currículo, ou todas com o nível
 * expandido. Não concluídas: no máximo `MAX_VISIBLE_PENDING`, a partir da atual — expandir NÃO
 * mostra mais pendentes, só mais histórico. Dentro de cada grupo vale a ordem do currículo.
 */
export function getVisibleNodes(
  nodes: PathNode[],
  expanded: boolean
): { visible: PathNode[]; hiddenDone: number; hiddenPending: number } {
  const done = nodes.filter((node) => node.state === 'done')
  const pending = nodes.filter((node) => node.state !== 'done')

  const shownDone = expanded ? done : done.slice(Math.max(0, done.length - VISIBLE_DONE_COUNT))
  const shownPending = pending.slice(0, MAX_VISIBLE_PENDING)

  return {
    // Histórico em cima, depois a atual e as próximas: a escada sempre "sobe" do que foi feito para
    // o que falta. Na ordem pura do currículo, uma lição adiantada (a 23ª feita antes da 4ª)
    // apareceria concluída no meio das pendentes, e o aluno perderia a noção de onde está.
    visible: [...shownDone, ...shownPending],
    hiddenDone: done.length - shownDone.length,
    hiddenPending: pending.length - shownPending.length,
  }
}

/**
 * Deslocamento horizontal de cada bolinha, em "passos" (-2..2). Segue uma senoide de período 8,
 * o mesmo zigue-zague suave do Duolingo: 0, -1, -2, -1, 0, 1, 2, 1, 0...
 */
const ZIGZAG = [0, -1, -2, -1, 0, 1, 2, 1] as const

export function getPathNodeOffset(index: number): number {
  return ZIGZAG[index % ZIGZAG.length]
}

type ProgressRow = {
  id: string
  pack_id: string
  status: string
  assigned_date: string
  created_at?: string | null
}

/**
 * Progresso por pack a partir das atribuições do aluno. Conta qualquer modo e qualquer origem:
 * o que importa para o currículo é ter estudado o pack, não por qual caminho ele chegou.
 */
export function summarizePackProgress(
  rows: ProgressRow[],
  isCompleted: (status: string) => boolean
): Map<string, PackProgress> {
  const byPack = new Map<string, PackProgress>()
  const sorted = [...rows].sort((a, b) =>
    `${a.assigned_date}|${a.created_at ?? ''}` < `${b.assigned_date}|${b.created_at ?? ''}` ? -1 : 1
  )

  for (const row of sorted) {
    const entry = byPack.get(row.pack_id) ?? {
      timesCompleted: 0,
      lastStudiedDate: null,
      pendingAssignmentId: null,
    }
    if (isCompleted(row.status)) {
      entry.timesCompleted += 1
      entry.lastStudiedDate = row.assigned_date
    } else if (!entry.pendingAssignmentId) {
      // A pendente mais antiga: é a que o aluno já tinha na fila.
      entry.pendingAssignmentId = row.id
    }
    byPack.set(row.pack_id, entry)
  }

  return byPack
}
