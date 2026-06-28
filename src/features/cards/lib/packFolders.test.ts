import { describe, expect, it } from 'vitest'
import { groupPacksByLevel } from './packFolders'

describe('groupPacksByLevel', () => {
  it('keeps advanced CEFR levels separate in the full catalog', () => {
    const groups = groupPacksByLevel([
      { name: 'Starter 1', level: 'A1' },
      { name: 'Pro Use 1', level: 'C1' },
      { name: 'Mastery 1', level: 'C2' },
    ])

    expect(groups.map((group) => group.label)).toEqual([
      'Iniciante (A1)',
      'Avançado (C1)',
      'Proficiente (C2)',
    ])
  })

  it('keeps legacy levels compatible with existing packs', () => {
    const groups = groupPacksByLevel([
      { name: 'Easy 1', level: 'easy' },
      { name: 'Advanced 1', level: 'advanced' },
    ])

    expect(groups.map((group) => group.label)).toEqual([
      'Básico (A2)',
      'Intermediário superior (B2)',
    ])
  })
})
