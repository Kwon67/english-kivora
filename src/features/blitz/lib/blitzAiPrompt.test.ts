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
})