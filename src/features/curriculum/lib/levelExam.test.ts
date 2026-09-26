import { describe, expect, it } from 'vitest'
import {
  getCurriculumLevel,
  getExamCooldownMinutes,
  isExamPassing,
} from './curriculum'
import {
  buildLevelExam,
  gradeLevelExam,
  toPublicQuestion,
  type ExamCard,
} from './levelExam'

/** RNG determinístico (mulberry32) para as provas sorteadas serem reproduzíveis. */
function seeded(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const cards: ExamCard[] = Array.from({ length: 120 }, (_, i) => ({
  id: `c${i}`,
  packId: `p${i % 12}`,
  en: `English sentence number ${i}.`,
  pt: `Frase em português número ${i}.`,
}))

describe('regras do currículo', () => {
  it('o nível é o primeiro sem aprovação', () => {
    expect(getCurriculumLevel(new Set())).toBe('A1')
    expect(getCurriculumLevel(new Set(['A1', 'A2']))).toBe('B1')
    // Aprovação fora de ordem não pula nível: sem o A1, continua no A1.
    expect(getCurriculumLevel(new Set(['A2']))).toBe('A1')
    expect(getCurriculumLevel(new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']))).toBe('C2')
  })

  it('passa com 80%', () => {
    expect(isExamPassing(24, 30)).toBe(true)
    expect(isExamPassing(23, 30)).toBe(false)
    expect(isExamPassing(0, 0)).toBe(false)
  })

  it('espera de 30 minutos depois de reprovar', () => {
    const now = new Date('2026-09-25T12:00:00Z')
    expect(getExamCooldownMinutes(null, now)).toBe(0)
    expect(getExamCooldownMinutes('2026-09-25T11:50:00Z', now)).toBe(20)
    expect(getExamCooldownMinutes('2026-09-25T11:00:00Z', now)).toBe(0)
  })
})

describe('buildLevelExam', () => {
  const exam = buildLevelExam(cards, seeded(42))

  it('tem 30 questões nos quatro formatos', () => {
    expect(exam).toHaveLength(30)
    const kinds = exam.reduce<Record<string, number>>((acc, q) => ({ ...acc, [q.kind]: (acc[q.kind] ?? 0) + 1 }), {})
    expect(kinds).toEqual({ en_pt: 12, pt_en: 8, listening: 5, typing: 5 })
  })

  it('cobre o nível inteiro: todos os packs aparecem antes de repetir', () => {
    expect(new Set(exam.map((q) => q.packId)).size).toBe(12)
  })

  it('alternativas: 4, sem repetição, e a certa está entre elas', () => {
    for (const q of exam.filter((question) => question.options)) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.options).toContain(q.answer)
    }
  })

  it('o que vai para o navegador não leva o gabarito', () => {
    for (const q of exam) {
      const publicQuestion = toPublicQuestion(q) as Record<string, unknown>
      expect(publicQuestion.answer).toBeUndefined()
      expect(publicQuestion.cardId).toBeUndefined()
      // Na escuta, a frase falada é a resposta: não pode sair do servidor.
      expect(publicQuestion.audioText).toBeUndefined()
    }
  })
})

describe('gradeLevelExam', () => {
  const exam = buildLevelExam(cards, seeded(7))
  const allRight = Object.fromEntries(exam.map((q) => [q.id, q.answer]))

  it('tudo certo passa', () => {
    expect(gradeLevelExam(exam, allRight)).toMatchObject({ score: 30, total: 30, passed: true })
  })

  it('escrita aceita erro de digitação pequeno em palavra longa', () => {
    const typing = exam.find((q) => q.kind === 'typing')!
    const answers = { ...allRight, [typing.id]: typing.answer.replace('sentence', 'sentense') }
    expect(gradeLevelExam(exam, answers).score).toBe(30)
  })

  it('7 erros reprovam (23/30 < 80%)', () => {
    const answers = { ...allRight }
    for (const q of exam.slice(0, 7)) answers[q.id] = 'resposta errada'
    expect(gradeLevelExam(exam, answers)).toMatchObject({ score: 23, passed: false })
  })

  it('questão em branco conta como erro', () => {
    const { [exam[0].id]: _skipped, ...answers } = allRight
    void _skipped
    const result = gradeLevelExam(exam, answers)
    expect(result.score).toBe(29)
    expect(result.review[0].given).toBeNull()
  })
})
