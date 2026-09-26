import { describe, expect, it } from 'vitest'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import type { PassedLevelSummary } from '@/features/curriculum/lib/curriculum'
import {
  MAX_VISIBLE_PENDING,
  buildLearningPath,
  getPathNodeOffset,
  getVisibleNodes,
  summarizePackProgress,
  type CurriculumPackRow,
  type PackProgress,
} from './learningPath'

function pack(id: string, level: string, position: number | null = null): CurriculumPackRow {
  return {
    id,
    name: `Pack ${id}`,
    description: null,
    level,
    category: 'Geral',
    curriculum_position: position,
    created_at: `2026-01-01T00:00:${id.padStart(2, '0')}Z`,
  }
}

function levelPacks(level: string, count: number) {
  return Array.from({ length: count }, (_, i) => pack(`${level}-${i + 1}`, level, i + 1))
}

function done(...ids: string[]): Map<string, PackProgress> {
  return new Map(ids.map((id) => [id, { timesCompleted: 1, lastStudiedDate: '2026-09-01', pendingAssignmentId: null }]))
}

const noPasses = new Map<LearnerCefrLevel, PassedLevelSummary>()

describe('buildLearningPath', () => {
  it('mostra o nível inteiro do catálogo, não só o que o aluno já recebeu', () => {
    const path = buildLearningPath({
      packs: levelPacks('A1', 44),
      progress: new Map(),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(path.totalCount).toBe(44)
    expect(path.units[0].nodes).toHaveLength(44)
  })

  it('não mostra níveis acima do atual', () => {
    const path = buildLearningPath({
      packs: [...levelPacks('A1', 3), ...levelPacks('A2', 3)],
      progress: new Map(),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(path.units.map((unit) => unit.level)).toEqual(['A1'])
    expect(path.nextLevel).toBe('A2')
  })

  it('segue a ordem pedagógica, não a de criação', () => {
    const path = buildLearningPath({
      packs: [pack('z', 'A1', 2), pack('a', 'A1', 1), pack('m', 'A1', null)],
      progress: new Map(),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(path.units[0].nodes.map((node) => node.packId)).toEqual(['a', 'z', 'm'])
  })

  it('a lição atual é a primeira não concluída na ordem do currículo', () => {
    const path = buildLearningPath({
      packs: levelPacks('A1', 5),
      progress: done('A1-1', 'A1-2', 'A1-4'),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(path.current?.packId).toBe('A1-3')
    expect(path.doneCount).toBe(3)
  })

  it('prova só fica "pronta" com todas as lições feitas; antes disso é "para pular"', () => {
    const partial = buildLearningPath({
      packs: levelPacks('A1', 3),
      progress: done('A1-1'),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(partial.units[0].exam).toMatchObject({ status: 'skip', remainingPacks: 2 })

    const complete = buildLearningPath({
      packs: levelPacks('A1', 3),
      progress: done('A1-1', 'A1-2', 'A1-3'),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    expect(complete.units[0].exam.status).toBe('ready')
    expect(complete.current).toBeNull()
  })

  it('nível aprovado aparece como aprovado, com a nota', () => {
    const path = buildLearningPath({
      packs: [...levelPacks('A1', 2), ...levelPacks('A2', 2)],
      progress: done('A1-1', 'A1-2'),
      passedLevels: new Map([['A1', { score: 27, total: 30, passedAt: '2026-09-20' }]]),
      currentLevel: 'A2',
    })
    expect(path.units.map((unit) => [unit.level, unit.status])).toEqual([
      ['A1', 'passed'],
      ['A2', 'current'],
    ])
    expect(path.units[0].exam).toMatchObject({ status: 'passed', score: 27, total: 30 })
    expect(path.current?.packId).toBe('A2-1')
  })
})

describe('getVisibleNodes', () => {
  const path = buildLearningPath({
    packs: levelPacks('A1', 44),
    progress: done(...Array.from({ length: 10 }, (_, i) => `A1-${i + 1}`)),
    passedLevels: noPasses,
    currentLevel: 'A1',
  })
  const nodes = path.units[0].nodes

  it('comprimido: 3 concluídas recentes + no máximo 3 pendentes', () => {
    const { visible, hiddenDone, hiddenPending } = getVisibleNodes(nodes, false)
    expect(visible.map((node) => node.packId)).toEqual(['A1-8', 'A1-9', 'A1-10', 'A1-11', 'A1-12', 'A1-13'])
    expect(hiddenDone).toBe(7)
    expect(hiddenPending).toBe(31)
  })

  it('expandido revela o histórico, mas nunca mais do que 3 pendentes', () => {
    const { visible, hiddenDone } = getVisibleNodes(nodes, true)
    expect(hiddenDone).toBe(0)
    expect(visible.filter((node) => node.state !== 'done')).toHaveLength(MAX_VISIBLE_PENDING)
    expect(visible).toHaveLength(13)
  })

  it('aluno começando: só as 3 primeiras lições', () => {
    const fresh = buildLearningPath({
      packs: levelPacks('A1', 44),
      progress: new Map(),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    const { visible } = getVisibleNodes(fresh.units[0].nodes, false)
    expect(visible.map((node) => node.state)).toEqual(['current', 'open', 'open'])
  })
})

describe('getVisibleNodes com lição adiantada', () => {
  it('concluída fora de ordem sobe para o histórico em vez de ficar entre as pendentes', () => {
    const path = buildLearningPath({
      packs: levelPacks('A1', 30),
      progress: done('A1-1', 'A1-2', 'A1-23'),
      passedLevels: noPasses,
      currentLevel: 'A1',
    })
    const { visible } = getVisibleNodes(path.units[0].nodes, false)
    expect(visible.map((node) => node.packId)).toEqual(['A1-1', 'A1-2', 'A1-23', 'A1-3', 'A1-4', 'A1-5'])
    expect(visible.map((node) => node.state)).toEqual(['done', 'done', 'done', 'current', 'open', 'open'])
  })
})

describe('summarizePackProgress', () => {
  const isCompleted = (status: string) => status.startsWith('completed')

  it('conta conclusões de qualquer modo e guarda a pendente mais antiga', () => {
    const progress = summarizePackProgress(
      [
        { id: 'a', pack_id: 'p', status: 'completed', assigned_date: '2026-09-01' },
        { id: 'b', pack_id: 'p', status: 'completed', assigned_date: '2026-09-03' },
        { id: 'c', pack_id: 'p', status: 'pending', assigned_date: '2026-09-05' },
        { id: 'd', pack_id: 'p', status: 'pending', assigned_date: '2026-09-06' },
      ],
      isCompleted
    )
    expect(progress.get('p')).toEqual({ timesCompleted: 2, lastStudiedDate: '2026-09-03', pendingAssignmentId: 'c' })
  })
})

describe('getPathNodeOffset', () => {
  it('desenha o zigue-zague e repete a cada 8 bolinhas', () => {
    const offsets = Array.from({ length: 9 }, (_, index) => getPathNodeOffset(index))
    expect(offsets).toEqual([0, -1, -2, -1, 0, 1, 2, 1, 0])
  })
})
