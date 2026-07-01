import { describe, expect, it } from 'vitest'
import { buildPlacementAiPrompt, parsePlacementAiItem } from './placementAi'

describe('placementAi', () => {
  it('builds a prompt with level context', () => {
    const prompt = buildPlacementAiPrompt('B1', [])
    expect(prompt).toContain('B1')
    expect(prompt).toContain('correctIndex')
  })

  it('parses valid AI placement JSON', () => {
    const raw = JSON.stringify({
      prompt: 'Choose the correct verb: She ___ to work by bus.',
      context: 'Presente simplee.',
      options: ['go', 'goes', 'going', 'gone'],
      correctIndex: 1,
    })

    const item = parsePlacementAiItem(raw, 'A2', 'ai-test-1')
    expect(item).not.toBeNull()
    expect(item?.level).toBe('A2')
    expect(item?.correctIndex).toBe(1)
    expect(item?.options).toHaveLength(4)
  })

  it('rejects invalid payloads', () => {
    expect(parsePlacementAiItem('{bad json', 'A1', 'ai-test-2')).toBeNull()
    expect(
      parsePlacementAiItem(
        JSON.stringify({ prompt: 'x', options: ['a'], correctIndex: 9 }),
        'A1',
        'ai-test-3'
      )
    ).toBeNull()
  })
})