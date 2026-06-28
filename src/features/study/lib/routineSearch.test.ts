import { describe, expect, it } from 'vitest'
import {
  filterRoutineAssignmentsBySmartQuery,
  normalizeRoutineSearchText,
} from './routineSearch'

const assignments = [
  {
    id: 'a1',
    pack_id: 'pack-1',
    game_mode: 'flashcard',
    packs: {
      name: 'PEC Viagem 01',
      description: 'Frases para aeroporto e hotel',
      category: 'PEC',
      level: 'A2',
    },
    searchCards: [
      {
        english_phrase: 'Where is the boarding gate?',
        portuguese_translation: 'Onde fica o portão de embarque?',
        accepted_translations: ['Onde está o portão?'],
      },
    ],
  },
  {
    id: 'a2',
    pack_id: 'pack-2',
    game_mode: 'typing',
    packs: {
      name: 'Business Meetings',
      description: 'Vocabulário para reuniões',
      category: 'Trabalho',
      level: 'B1',
    },
    searchCards: [
      {
        english_phrase: 'Could we reschedule the meeting?',
        portuguese_translation: 'Podemos remarcar a reunião?',
        accepted_translations: [],
      },
    ],
  },
]

describe('routineSearch', () => {
  it('normalizes accents and punctuation', () => {
    expect(normalizeRoutineSearchText('Portão de Embarque!')).toBe('portao de embarque')
  })

  it('finds packs by acronym/category terms', () => {
    const result = filterRoutineAssignmentsBySmartQuery(assignments, 'pec')
    expect(result.map((assignment) => assignment.id)).toEqual(['a1'])
  })

  it('finds packs by card phrases and translations', () => {
    expect(filterRoutineAssignmentsBySmartQuery(assignments, 'boarding gate')[0]?.id).toBe('a1')
    expect(filterRoutineAssignmentsBySmartQuery(assignments, 'remarcar reuniao')[0]?.id).toBe('a2')
  })

  it('handles small typing variations', () => {
    const result = filterRoutineAssignmentsBySmartQuery(assignments, 'meting')
    expect(result[0]?.id).toBe('a2')
  })

  it('prioritizes strong pack name matches over card and category matches', () => {
    const result = filterRoutineAssignmentsBySmartQuery(
      [
        {
          id: 'noisy-match',
          pack_id: 'pack-noisy',
          game_mode: 'flashcard',
          packs: {
            name: 'PEC Revisão Geral',
            description: 'Treino com várias frases do PEC 5',
            category: 'PEC',
            level: 'A2',
          },
          searchCards: [
            {
              english_phrase: 'PEC 5 practice set',
              portuguese_translation: 'Exercício PEC 5',
              accepted_translations: ['PEC 5'],
            },
            {
              english_phrase: 'Review PEC 5 vocabulary',
              portuguese_translation: 'Revisar vocabulário PEC 5',
              accepted_translations: ['PEC 5 vocabulary'],
            },
          ],
        },
        {
          id: 'pack-name-match',
          pack_id: 'pack-name',
          game_mode: 'typing',
          packs: {
            name: 'PEC 5',
            description: 'Pack direto',
            category: 'PEC',
            level: 'A2',
          },
          searchCards: [],
        },
      ],
      'PEC 5'
    )

    expect(result[0]?.id).toBe('pack-name-match')
  })
})
