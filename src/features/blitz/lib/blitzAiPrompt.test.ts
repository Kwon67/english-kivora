import { describe, expect, it } from 'vitest'
import { buildBlitzAiPrompt } from './blitzAiPrompt'

describe('o nível do usuário é o teto da geração', () => {
  it('nomeia o teto e proíbe passar dele', () => {
    const prompt = buildBlitzAiPrompt(24, 'B1')

    expect(prompt).toContain('nível de inglês é B1')
    expect(prompt).toContain('B1 é o TETO da partida')
    expect(prompt).toContain('NUNCA gere frases acima de B1')
  })

  it('nunca descreve um nível acima do teto', () => {
    // O texto do B2 fala de "argumentação" e "até 14 palavras". Para quem está no B1, essa
    // instrução não pode aparecer nem como exemplo — era exatamente por aí que entrava o
    // conteúdo fora do nível.
    const prompt = buildBlitzAiPrompt(32, 'B1')

    expect(prompt).not.toContain('frases de B2')
    expect(prompt).not.toContain('até 14 palavras')
  })

  it('cobre a faixa inteira do A1 até o nível do usuário', () => {
    const prompt = buildBlitzAiPrompt(32, 'B1')

    expect(prompt).toContain('frases de B1')
    expect(prompt).toContain('frases de A2')
    expect(prompt).toContain('frases de A1')
    expect(prompt).toContain('A1–B1')
  })

  it('para quem está no A1, pede só A1 e não anuncia faixa', () => {
    const prompt = buildBlitzAiPrompt(16, 'A1')

    expect(prompt).toContain('frases de A1')
    expect(prompt).not.toContain('frases de A2')
    expect(prompt).toContain('NUNCA gere frases acima de A1')
  })

  it('sem nível avaliado, usa o teto de avaliação em vez de liberar tudo', () => {
    const prompt = buildBlitzAiPrompt(16, null)

    expect(prompt).toContain('NUNCA gere frases acima de A2')
    expect(prompt).not.toContain('frases de B1')
  })
})

describe('distribuição por nível', () => {
  it('pede exatamente a quantidade solicitada, somando os níveis', () => {
    const prompt = buildBlitzAiPrompt(32, 'B1')

    expect(prompt).toContain('some exatamente 32 frases')
    const pedidos = [...prompt.matchAll(/- (\d+) frases de /g)].map((m) => Number(m[1]))
    expect(pedidos.reduce((soma, n) => soma + n, 0)).toBe(32)
  })

  it('concentra no nível do usuário, não na revisão', () => {
    const prompt = buildBlitzAiPrompt(32, 'B1')
    const [noTeto, ...abaixo] = [...prompt.matchAll(/- (\d+) frases de /g)].map((m) => Number(m[1]))

    expect(noTeto).toBeGreaterThan(Math.max(...abaixo))
  })
})

describe('regras que não mudaram com o fim das dificuldades', () => {
  it('mantém as regras de tradução natural em pt-BR', () => {
    const prompt = buildBlitzAiPrompt(10, 'A2')

    expect(prompt).toContain('REGRAS OBRIGATÓRIAS DE TRADUÇÃO')
    expect(prompt).toContain('pt-BR natural')
    expect(prompt).toContain('NUNCA tradução literal')
    expect(prompt).toContain('I take a shower every day')
    expect(prompt).toContain('Eu tomo banho todos os dias')
    expect(prompt).toContain('NUNCA "dou um banho"')
  })

  it('continua exigindo somente JSON válido', () => {
    const prompt = buildBlitzAiPrompt(8, 'B1')
    expect(prompt).toContain('SOMENTE um JSON válido')
    expect(prompt).toContain('{"cards"')
  })

  it('mantém as regras de diversidade, agora por nível', () => {
    const prompt = buildBlitzAiPrompt(16, 'A2')

    expect(prompt).toContain('REGRAS CRÍTICAS DE DIVERSIDADE')
    expect(prompt).toContain('NUNCA repita frases')
    expect(prompt).toContain('mesmo nível')
    expect(prompt).toContain('Não use padrões repetitivos como')
    expect(prompt).toContain('garanta que nenhuma frase seja igual ou muito parecida')
  })
})
