import { describe, expect, it } from 'vitest'
import {
  buildCoverageIndex,
  isCovered,
  isNearDuplicate,
  normalizePhrase,
  phraseSimilarity,
  splitByCoverage,
} from './phraseCoverage'

describe('normalizePhrase', () => {
  it('ignora caixa, pontuação e espaço dobrado', () => {
    expect(normalizePhrase('  Nice to MEET you!  ')).toBe('nice to meet you')
  })

  it('trata pontuação como a única diferença entre duas frases', () => {
    expect(normalizePhrase('Nice to meet you')).toBe(normalizePhrase('Nice to meet you!'))
  })

  it('preserva contrações, que são conteúdo de ensino e não ruído', () => {
    expect(normalizePhrase("I'm gonna go")).toBe("i'm gonna go")
  })

  it('devolve string vazia para entrada sem letras', () => {
    expect(normalizePhrase('!!! ...')).toBe('')
  })
})

describe('phraseSimilarity', () => {
  it('dá 1 para a mesma frase', () => {
    expect(phraseSimilarity('can I get that to go', 'Can I get that to go?')).toBe(1)
  })

  it('dá 0 quando não há token em comum', () => {
    expect(phraseSimilarity('hello there', 'goodbye friend')).toBe(0)
  })

  it('dá 0 para frase vazia, sem estourar', () => {
    expect(phraseSimilarity('', 'hello')).toBe(0)
  })
})

describe('isNearDuplicate', () => {
  it('pega a repetição que só acrescenta cortesia', () => {
    expect(isNearDuplicate('Can I get that to go?', 'Can I get that to go, please?')).toBe(true)
  })

  it('mantém frases que mudam o sentido, mesmo com começo igual', () => {
    expect(isNearDuplicate('I take a shower every day', 'I take a shower in the morning')).toBe(false)
  })

  it('mantém a contração como material distinto da forma completa', () => {
    expect(isNearDuplicate("I'm gonna call you later", 'I am going to call you later')).toBe(false)
  })

  it('não confunde frases curtas que compartilham palavras funcionais', () => {
    expect(isNearDuplicate('Thank you', 'Thank you so much')).toBe(false)
  })
})

describe('isCovered', () => {
  const index = buildCoverageIndex([
    'Nice to meet you.',
    'Where is the nearest pharmacy?',
    "It's been a long day, I just want to get home.",
  ])

  it('reconhece a frase idêntica a menos de pontuação', () => {
    expect(isCovered('nice to meet you', index)).toBe(true)
  })

  it('deixa passar assunto novo', () => {
    expect(isCovered('Could you call me a taxi?', index)).toBe(false)
  })

  it('não quebra com frase vazia', () => {
    expect(isCovered('   ', index)).toBe(false)
  })

  it('índice vazio não cobre nada', () => {
    expect(isCovered('Nice to meet you', buildCoverageIndex([]))).toBe(false)
  })
})

describe('splitByCoverage', () => {
  it('separa material novo de repetição do catálogo', () => {
    const resultado = splitByCoverage(
      [
        { en: 'Nice to meet you!', pt: 'Prazer em conhecer você!' },
        { en: 'How much does it cost?', pt: 'Quanto custa?' },
      ],
      ['Nice to meet you.']
    )

    expect(resultado.fresh.map((card) => card.en)).toEqual(['How much does it cost?'])
    expect(resultado.rejected).toHaveLength(1)
    expect(resultado.rejected[0].reason).toBe('catalogo')
  })

  it('barra a IA que devolve a mesma frase duas vezes no mesmo lote', () => {
    const resultado = splitByCoverage(
      [
        { en: 'How much does it cost?', pt: 'Quanto custa?' },
        { en: 'How much does it cost', pt: 'Quanto isso custa?' },
      ],
      []
    )

    expect(resultado.fresh).toHaveLength(1)
    expect(resultado.rejected[0].reason).toBe('lote')
  })

  it('preserva a ordem original do que foi aprovado', () => {
    const resultado = splitByCoverage(
      [
        { en: 'First one here', pt: 'Primeira' },
        { en: 'Totally unrelated sentence', pt: 'Sem relação' },
        { en: 'Another different thing entirely', pt: 'Outra coisa' },
      ],
      []
    )

    expect(resultado.fresh.map((card) => card.en)).toEqual([
      'First one here',
      'Totally unrelated sentence',
      'Another different thing entirely',
    ])
  })

  it('catálogo vazio aprova tudo que não repete internamente', () => {
    const resultado = splitByCoverage(
      [
        { en: 'One thing', pt: 'Uma coisa' },
        { en: 'Something else', pt: 'Outra coisa' },
      ],
      []
    )

    expect(resultado.fresh).toHaveLength(2)
    expect(resultado.rejected).toHaveLength(0)
  })
})
