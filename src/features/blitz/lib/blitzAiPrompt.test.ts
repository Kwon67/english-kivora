import { describe, expect, it } from 'vitest'
import { buildBlitzAiPrompt } from './blitzAiPrompt'

describe('buildBlitzAiPrompt', () => {
  it('includes the selected CEFR level in the prompt', () => {
    const prompt = buildBlitzAiPrompt(24, 'B1')

    expect(prompt).toContain('nível CEFR B1')
    expect(prompt).toContain('Intermediário')
    expect(prompt).toContain('24')
  })

  it('adapts guidance per level band', () => {
    const beginner = buildBlitzAiPrompt(16, 'A1')
    const advanced = buildBlitzAiPrompt(16, 'B2')

    expect(beginner).toContain('até 7 palavras')
    expect(advanced).toContain('até 14 palavras')
  })

  it('includes strong natural Brazilian Portuguese translation rules', () => {
    const prompt = buildBlitzAiPrompt(10, 'A2')

    expect(prompt).toContain('REGRAS OBRIGATÓRIAS DE TRADUÇÃO')
    expect(prompt).toContain('pt-BR natural')
    expect(prompt).toContain('NUNCA tradução literal')
    expect(prompt).toContain('I take a shower every day')
    expect(prompt).toContain('Eu tomo banho todos os dias')
    expect(prompt).toContain('NUNCA "dou um banho"')
  })

  it('instructs to return only valid JSON', () => {
    const prompt = buildBlitzAiPrompt(8, 'B1')
    expect(prompt).toContain('SOMENTE um JSON válido')
    expect(prompt).toContain('{"cards"')
  })

  it('includes strong diversity rules to avoid repeated phrases across generations', () => {
    const prompt = buildBlitzAiPrompt(16, 'A1')

    expect(prompt).toContain('REGRAS CRÍTICAS DE DIVERSIDADE')
    expect(prompt).toContain('NUNCA repita frases')
    expect(prompt).toContain('mesmo nível')
    expect(prompt).toContain('Não use padrões repetitivos como')
    expect(prompt).toContain('garanta que nenhuma frase seja igual ou muito parecida')
  })
})