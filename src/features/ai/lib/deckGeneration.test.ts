import { describe, expect, it } from 'vitest'
import {
  buildDeckGenerationPrompt,
  CEFR_LEVELS,
  isCefrLevel,
  parseGeneratedCards,
  sanitizeGeneratedText,
} from './deckGeneration'

describe('sanitizeGeneratedText', () => {
  it('troca hífen não separável por hífen comum', () => {
    expect(sanitizeGeneratedText('check‑in')).toBe('check-in')
  })

  it('troca aspas curvas por retas', () => {
    expect(sanitizeGeneratedText('“it’s fine”')).toBe('"it\'s fine"')
  })

  it('troca reticências e espaço rígido', () => {
    expect(sanitizeGeneratedText('wait… now')).toBe('wait... now')
  })

  it('separa travessão que colava duas palavras', () => {
    expect(sanitizeGeneratedText('Just a thought\u2014maybe next week')).toBe('Just a thought - maybe next week')
  })

  it('mantém hífen tipográfico colado, porque ali ele é hífen mesmo', () => {
    expect(sanitizeGeneratedText('a well\u2011known case')).toBe('a well-known case')
  })

  it('não mexe em texto já limpo', () => {
    expect(sanitizeGeneratedText("It's a well-known problem.")).toBe("It's a well-known problem.")
  })
})

describe('parseGeneratedCards', () => {
  it('sana o que a IA devolve', () => {
    const cards = parseGeneratedCards('{"cards":[{"en":"a check‑in desk","pt":"um balcão"}]}')
    expect(cards[0].en).toBe('a check-in desk')
  })

  it('descarta card sem os dois lados', () => {
    expect(parseGeneratedCards('{"cards":[{"en":"only english"}]}')).toEqual([])
  })

  it('devolve vazio quando não há array de cards', () => {
    expect(parseGeneratedCards('{"resultado":"nada"}')).toEqual([])
  })
})

describe('buildDeckGenerationPrompt', () => {
  it('inclui as frases proibidas', () => {
    const prompt = buildDeckGenerationPrompt('viagem', 5, { avoidPhrases: ['Nice to meet you'] })
    expect(prompt).toContain('Nice to meet you')
    expect(prompt).toContain('NÃO REPITA')
  })

  it('omite o bloco de proibição quando não há nada a evitar', () => {
    expect(buildDeckGenerationPrompt('viagem', 5)).not.toContain('NÃO REPITA')
  })

  /**
   * Regressão real: a primeira redação listava as estruturas de B2 ("voz passiva, condicionais
   * complexas") e o modelo tratou como checklist por frase, produzindo 67% de condicional e 58%
   * de passiva num pack de expressões idiomáticas. O prompt precisa dizer que é teto, não meta.
   */
  it('apresenta o nível como teto e proíbe forçar estrutura', () => {
    const prompt = buildDeckGenerationPrompt('idioms', 8, { level: 'B2' })
    expect(prompt).toContain('teto')
    expect(prompt).toContain('LIMITE de complexidade')
    expect(prompt).toContain('NUNCA force')
  })

  it('não menciona nível nenhum quando ele não é passado', () => {
    expect(buildDeckGenerationPrompt('idioms', 8)).not.toContain('CALIBRAGEM DE NÍVEL')
  })

  it('calibra cada nível de forma distinta', () => {
    const a1 = buildDeckGenerationPrompt('viagem', 5, { level: 'A1' })
    const c2 = buildDeckGenerationPrompt('viagem', 5, { level: 'C2' })
    expect(a1).toContain('3 a 7 palavras')
    expect(c2).toContain('registro nativo pleno')
    expect(a1).not.toBe(c2)
  })
})

describe('isCefrLevel', () => {
  it('aceita os seis níveis oferecidos na tela', () => {
    expect(CEFR_LEVELS.map((n) => n.value).every(isCefrLevel)).toBe(true)
  })

  /**
   * Regressão: saveDeckAction gravava `level: 'medium'`, valor que a migração CEFR passou a
   * recusar. O insert falhava e o remendo salvava o pack SEM nível — invisível para quem criava.
   */
  it('recusa o antigo "medium", que a coluna packs.level não aceita mais', () => {
    expect(isCefrLevel('medium')).toBe(false)
  })

  it('recusa lixo e ausência sem estourar', () => {
    expect(isCefrLevel(undefined)).toBe(false)
    expect(isCefrLevel('')).toBe(false)
    expect(isCefrLevel('a1')).toBe(false)
    expect(isCefrLevel(1)).toBe(false)
  })

  it('cada nível tem rótulo e dica para a interface', () => {
    for (const nivel of CEFR_LEVELS) {
      expect(nivel.label).toContain(nivel.value)
      expect(nivel.hint.length).toBeGreaterThan(10)
    }
  })

  it('cobre exatamente os valores que o prompt sabe calibrar', () => {
    for (const nivel of CEFR_LEVELS) {
      expect(buildDeckGenerationPrompt('t', 3, { level: nivel.value })).toContain('CALIBRAGEM DE NÍVEL')
    }
  })
})
