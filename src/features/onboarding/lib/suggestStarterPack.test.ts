import { describe, expect, it } from 'vitest'
import { pickStarterPack, rankStarterPacks, type StarterPackRow } from './suggestStarterPack'

const packs: StarterPackRow[] = [
  {
    id: '1',
    name: 'Business English Meetings',
    description: 'Workplace vocabulary',
    level: 'B1',
    category: 'Trabalho',
    cover_url: null,
  },
  {
    id: '2',
    name: 'Travel Essentials',
    description: 'Airport and hotel phrases',
    level: 'A2',
    category: 'Viagem',
    cover_url: null,
  },
  {
    id: '3',
    name: 'Grammar Basics',
    description: 'Verb tenses for beginners',
    level: 'A1',
    category: 'Gramática',
    cover_url: null,
  },
]

describe('rankStarterPacks', () => {
  it('prioritizes level and interest matches', () => {
    const ranked = rankStarterPacks(packs, { level: 'A2', interests: ['travel'] })
    expect(ranked[0]?.id).toBe('2')
    expect(ranked[0]?.matchReason).toContain('Viagem')
  })

  it('falls back to level proximity when interests do not match', () => {
    const ranked = rankStarterPacks(packs, { level: 'A2', interests: [] })
    expect(ranked[0]?.id).toBe('2')
  })
})

describe('pickStarterPack', () => {
  it('returns the highest ranked pack', () => {
    const picked = pickStarterPack(packs, { level: 'B1', interests: ['work'] })
    expect(picked?.id).toBe('1')
  })

  it('returns null when catalog is empty', () => {
    expect(pickStarterPack([], { level: 'A2', interests: ['travel'] })).toBeNull()
  })
})