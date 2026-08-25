import { describe, expect, it } from 'vitest'
import {
  interleaveByPack,
  rankCards,
  scoreCard,
  type CardSignal,
} from '@/features/learning/lib/cardIntelligence'

const base: CardSignal = {
  cardId: 'c1',
  packId: 'p1',
  packLevel: 'B1',
  isNew: false,
  lapses: 0,
  easeFactor: 2.5,
  repetitions: 3,
  recentErrors: 0,
  daysSinceSeen: 2,
  daysOverdue: 0,
  }

const sinal = (over: Partial<CardSignal>): CardSignal => ({ ...base, ...over })
const contexto = { userLevel: 'B1' as const, mode: 'review' as const }

describe('o que a pessoa erra vem antes do que ela acerta', () => {
  it('põe o card errado recentemente acima de um igual sem erro', () => {
    const errado = scoreCard(sinal({ cardId: 'a', recentErrors: 3 }), contexto)
    const limpo = scoreCard(sinal({ cardId: 'b' }), contexto)

    expect(errado.score).toBeGreaterThan(limpo.score)
    expect(errado.reasonTag).toBe('errou-recente')
    expect(errado.reason).toContain('3 vezes')
  })

  it('põe o card que já escapou acima de um que nunca escapou', () => {
    const escapou = scoreCard(sinal({ cardId: 'a', lapses: 2 }), contexto)
    const firme = scoreCard(sinal({ cardId: 'b' }), contexto)

    expect(escapou.score).toBeGreaterThan(firme.score)
    expect(escapou.reason).toContain('2 vezes')
  })

  it('percebe dificuldade pelo fator de facilidade, mesmo sem lapso registrado', () => {
    const dificil = scoreCard(sinal({ cardId: 'a', easeFactor: 1.7 }), contexto)
    const facil = scoreCard(sinal({ cardId: 'b', easeFactor: 2.5 }), contexto)

    expect(dificil.score).toBeGreaterThan(facil.score)
  })
})

describe('atraso manda na revisão, nível manda no Blitz', () => {
  const atrasado = sinal({ cardId: 'a', daysOverdue: 6, packLevel: 'A1' })
  const noNivel = sinal({ cardId: 'b', daysOverdue: -3, packLevel: 'B1' })

  it('na revisão, o atrasado vem primeiro', () => {
    const [primeiro] = rankCards([noNivel, atrasado], { userLevel: 'B1', mode: 'review' })
    expect(primeiro.signal.cardId).toBe('a')
  })

  it('no Blitz, a frase na borda do nível vem primeiro', () => {
    const [primeiro] = rankCards([atrasado, noNivel], { userLevel: 'B1', mode: 'blitz' })
    expect(primeiro.signal.cardId).toBe('b')
  })

  it('mas no Blitz um card MUITO atrasado ainda passa na frente: está prestes a ser perdido', () => {
    const quaseperdido = sinal({ cardId: 'c', daysOverdue: 25, packLevel: 'A2', lapses: 1 })
    const [primeiro] = rankCards([noNivel, quaseperdido], { userLevel: 'B1', mode: 'blitz' })
    expect(primeiro.signal.cardId).toBe('c')
  })
})

describe('encaixe de nível', () => {
  it('prefere o que está no teto do aluno a algo bem abaixo', () => {
    const noTeto = scoreCard(sinal({ cardId: 'a', packLevel: 'B1' }), { userLevel: 'B1', mode: 'blitz' })
    const bemAbaixo = scoreCard(sinal({ cardId: 'b', packLevel: 'A1' }), { userLevel: 'B1', mode: 'blitz' })

    expect(noTeto.score).toBeGreaterThan(bemAbaixo.score)
    expect(noTeto.reasonTag).toBe('no-seu-nivel')
  })

  it('não zera o que está abaixo: consolidar sustenta o nível', () => {
    const abaixo = scoreCard(sinal({ cardId: 'b', packLevel: 'A2' }), { userLevel: 'B1', mode: 'blitz' })
    expect(abaixo.score).toBeGreaterThan(0)
  })
})

describe('todo card sabe dizer por que foi escolhido', () => {
  it('nunca devolve motivo vazio', () => {
    const casos: CardSignal[] = [
      sinal({}),
      sinal({ isNew: true, repetitions: 0, daysSinceSeen: 0, daysOverdue: -99 }),
      sinal({ recentErrors: 1 }),
      sinal({ daysOverdue: 10 }),
    ]

    for (const caso of casos) {
      const resultado = scoreCard(caso, contexto)
      expect(resultado.reason.length).toBeGreaterThan(8)
      expect(resultado.reasonTag).toBeTruthy()
    }
  })

  it('o motivo mostrado é o do componente que mais pesou', () => {
    // Erro recente vale mais que o resto: é ele que tem de aparecer.
    const resultado = scoreCard(
      sinal({ recentErrors: 3, daysSinceSeen: 1, daysOverdue: -5 }),
      { userLevel: 'B1', mode: 'blitz' }
    )
    expect(resultado.reasonTag).toBe('errou-recente')
  })
})

describe('intercalar packs', () => {
  it('não serve duas frases seguidas do mesmo pack quando há alternativa', () => {
    const cards = rankCards(
      [
        sinal({ cardId: '1', packId: 'p1', recentErrors: 3 }),
        sinal({ cardId: '2', packId: 'p1', recentErrors: 3 }),
        sinal({ cardId: '3', packId: 'p1', recentErrors: 3 }),
        sinal({ cardId: '4', packId: 'p2', recentErrors: 3 }),
        sinal({ cardId: '5', packId: 'p3', recentErrors: 3 }),
      ],
      contexto
    )

    const packs = cards.map((item) => item.signal.packId)
    const repeticoesSeguidas = packs.filter((pack, index) => index > 0 && pack === packs[index - 1])
    // Com 3 cards de p1 e só 2 de outros packs, uma repetição no fim é inevitável — mas só uma.
    expect(repeticoesSeguidas.length).toBeLessThanOrEqual(1)
  })

  it('devolve todos os cards, sem perder nem duplicar', () => {
    const entrada = Array.from({ length: 12 }, (_, i) =>
      sinal({ cardId: `c${i}`, packId: `p${i % 3}` })
    )
    const saida = interleaveByPack(entrada.map((s) => scoreCard(s, contexto)))

    expect(saida).toHaveLength(12)
    expect(new Set(saida.map((item) => item.signal.cardId)).size).toBe(12)
  })
})
