import { describe, expect, it } from 'vitest'
import {
  MASTERED_INTERVAL_DAYS,
  MIN_ANSWERS_FOR_ACCURACY,
  buildProgressReport,
  type ProgressInput,
} from '@/features/review/lib/progressReport'

const vazio: ProgressInput = { cards: [], phraseByCardId: {}, sessions: [] }

const muitasPartidas = (correct: number, wrong: number, n = 6) =>
  Array.from({ length: n }, () => ({ correct, wrong }))

describe('frases dominadas', () => {
  it('conta uma frase repetida em dois packs como UMA só', () => {
    // O caso real: um pack do catálogo está inteiramente contido em outro.
    const r = buildProgressReport({
      ...vazio,
      cards: [
        { cardId: 'a', intervalDays: 40, repetitions: 5 },
        { cardId: 'b', intervalDays: 40, repetitions: 5 },
      ],
      phraseByCardId: { a: 'Can I get that to go, please?', b: 'can i get that to go, please?  ' },
    })
    expect(r.phrasesMastered).toBe(1)
    expect(r.phrasesTotal).toBe(1)
    expect(r.duplicatesCollapsed).toBe(1)
  })

  it('mantém frases diferentes separadas', () => {
    const r = buildProgressReport({
      ...vazio,
      cards: [
        { cardId: 'a', intervalDays: 40, repetitions: 5 },
        { cardId: 'b', intervalDays: 40, repetitions: 5 },
      ],
      phraseByCardId: { a: 'Good morning', b: 'Good night' },
    })
    expect(r.phrasesMastered).toBe(2)
    expect(r.duplicatesCollapsed).toBe(0)
  })

  it('fica com o MAIOR intervalo entre cópias da mesma frase', () => {
    // Se você domina uma das cópias, você sabe a frase. Pegar a pior seria mentir para baixo.
    const r = buildProgressReport({
      ...vazio,
      cards: [
        { cardId: 'a', intervalDays: 60, repetitions: 8 },
        { cardId: 'b', intervalDays: 1, repetitions: 1 },
      ],
      phraseByCardId: { a: 'Same phrase', b: 'same phrase' },
    })
    expect(r.phrasesMastered).toBe(1)
    expect(r.phrasesLearning).toBe(0)
  })

  it('só conta como dominada a partir do limite declarado', () => {
    const abaixo = buildProgressReport({
      ...vazio,
      cards: [{ cardId: 'a', intervalDays: MASTERED_INTERVAL_DAYS - 1, repetitions: 4 }],
      phraseByCardId: { a: 'x' },
    })
    const noLimite = buildProgressReport({
      ...vazio,
      cards: [{ cardId: 'a', intervalDays: MASTERED_INTERVAL_DAYS, repetitions: 4 }],
      phraseByCardId: { a: 'x' },
    })
    expect(abaixo.phrasesMastered).toBe(0)
    expect(abaixo.phrasesLearning).toBe(1)
    expect(noLimite.phrasesMastered).toBe(1)
  })

  it('não quebra quando a frase do card é desconhecida', () => {
    const r = buildProgressReport({
      ...vazio,
      cards: [{ cardId: 'orfao', intervalDays: 30, repetitions: 3 }],
      phraseByCardId: {},
    })
    expect(r.phrasesTotal).toBe(1)
  })
})

describe('taxa de acerto', () => {
  it('não inventa um número com amostra pequena', () => {
    const r = buildProgressReport({ ...vazio, sessions: [{ correct: 3, wrong: 0 }] })
    expect(r.accuracy).toBeNull()
    expect(r.accuracySample).toBe(3)
  })

  it('reporta assim que a amostra sustenta', () => {
    const r = buildProgressReport({ ...vazio, sessions: [{ correct: MIN_ANSWERS_FOR_ACCURACY, wrong: 0 }] })
    expect(r.accuracy).toBe(100)
  })

  it('calcula sobre respostas, não sobre partidas', () => {
    const r = buildProgressReport({ ...vazio, sessions: [{ correct: 15, wrong: 5 }] })
    expect(r.accuracy).toBe(75)
    expect(r.accuracySample).toBe(20)
  })

  it('sobrevive a um usuário sem nenhuma partida', () => {
    const r = buildProgressReport(vazio)
    expect(r.accuracy).toBeNull()
    expect(r.accuracySample).toBe(0)
    expect(r.phrasesTotal).toBe(0)
  })
})

describe('tendência', () => {
  it('cala a boca quando há partidas de menos', () => {
    expect(buildProgressReport({ ...vazio, sessions: [{ correct: 10, wrong: 0 }] }).trend).toBeNull()
  })

  it('detecta melhora entre a metade antiga e a recente', () => {
    const r = buildProgressReport({
      ...vazio,
      sessions: [...muitasPartidas(5, 5, 3), ...muitasPartidas(10, 0, 3)],
    })
    expect(r.trend).toBe('melhorando')
  })

  it('detecta piora', () => {
    const r = buildProgressReport({
      ...vazio,
      sessions: [...muitasPartidas(10, 0, 3), ...muitasPartidas(5, 5, 3)],
    })
    expect(r.trend).toBe('piorando')
  })

  it('chama de estável uma variação pequena, em vez de anunciar movimento', () => {
    const r = buildProgressReport({
      ...vazio,
      sessions: [...muitasPartidas(80, 20, 3), ...muitasPartidas(82, 18, 3)],
    })
    expect(r.trend).toBe('estavel')
  })
})

describe('distribuição do gráfico', () => {
  it('soma exatamente o total de frases, sem sobra nem dupla contagem', () => {
    const r = buildProgressReport({
      ...vazio,
      cards: [
        { cardId: 'a', intervalDays: 0, repetitions: 0 },
        { cardId: 'b', intervalDays: 5, repetitions: 2 },
        { cardId: 'c', intervalDays: 40, repetitions: 9 },
      ],
      phraseByCardId: { a: 'um', b: 'dois', c: 'tres' },
    })
    expect(r.buckets.learning + r.buckets.familiar + r.buckets.mastered).toBe(r.phrasesTotal)
  })

  it('usa o MESMO limite e as MESMAS frases do número grande', () => {
    // A página mostrava "Dominado" duas vezes com valores diferentes: o gráfico usava 14 dias e
    // contava linhas, o painel usa 21 dias e conta frases. Agora vêm da mesma fonte.
    const r = buildProgressReport({
      ...vazio,
      cards: [
        { cardId: 'a', intervalDays: 40, repetitions: 9 },
        { cardId: 'b', intervalDays: 40, repetitions: 9 },
      ],
      phraseByCardId: { a: 'mesma frase', b: 'mesma frase' },
    })
    expect(r.buckets.mastered).toBe(r.phrasesMastered)
    expect(r.buckets.mastered).toBe(1)
  })
})
