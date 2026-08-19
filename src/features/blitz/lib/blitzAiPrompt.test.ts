import { describe, expect, it } from 'vitest'
import { buildBlitzAiPrompt } from './blitzAiPrompt'

describe('buildBlitzAiPrompt', () => {
  it('nomeia a dificuldade E a faixa CEFR que ela representa', () => {
    const prompt = buildBlitzAiPrompt(24, 'medio')

    expect(prompt).toContain('Médio')
    expect(prompt).toContain('CEFR B1')
    expect(prompt).toContain('24')
  })

  it('descreve a FAIXA inteira quando a dificuldade cobre dois níveis', () => {
    // "Fácil" atende A1 e A2. Se a instrução citasse um só, metade de quem clica ali receberia
    // conteúdo fora do próprio nível.
    const facil = buildBlitzAiPrompt(16, 'facil')

    expect(facil).toContain('A1–A2')
    expect(facil).toContain('até 10 palavras')
  })

  it('separa as três dificuldades por complexidade de frase', () => {
    const facil = buildBlitzAiPrompt(16, 'facil')
    const dificil = buildBlitzAiPrompt(16, 'dificil')

    expect(facil).toContain('até 10 palavras')
    expect(dificil).toContain('até 14 palavras')
    expect(facil).not.toContain('até 14 palavras')
  })

  it('mantém as regras de tradução natural em pt-BR', () => {
    const prompt = buildBlitzAiPrompt(10, 'facil')

    expect(prompt).toContain('REGRAS OBRIGATÓRIAS DE TRADUÇÃO')
    expect(prompt).toContain('pt-BR natural')
    expect(prompt).toContain('NUNCA tradução literal')
    expect(prompt).toContain('I take a shower every day')
    expect(prompt).toContain('Eu tomo banho todos os dias')
    expect(prompt).toContain('NUNCA "dou um banho"')
  })

  it('continua exigindo somente JSON válido', () => {
    const prompt = buildBlitzAiPrompt(8, 'medio')
    expect(prompt).toContain('SOMENTE um JSON válido')
    expect(prompt).toContain('{"cards"')
  })

  it('mantém as regras de diversidade, agora por dificuldade', () => {
    const prompt = buildBlitzAiPrompt(16, 'facil')

    expect(prompt).toContain('REGRAS CRÍTICAS DE DIVERSIDADE')
    expect(prompt).toContain('NUNCA repita frases')
    expect(prompt).toContain('mesma dificuldade')
    expect(prompt).toContain('Não use padrões repetitivos como')
    expect(prompt).toContain('garanta que nenhuma frase seja igual ou muito parecida')
  })
})
