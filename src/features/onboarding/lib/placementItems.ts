import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

export type PlacementItem = {
  id: string
  level: LearnerCefrLevel
  prompt: string
  context?: string
  options: [string, string, string, string]
  correctIndex: number
}

export const PLACEMENT_ITEMS: PlacementItem[] = [
  {
    id: 'a1-hello',
    level: 'A1',
    prompt: 'How do you greet someone in the morning?',
    context: 'Escolha a saudação correta.',
    options: ['Good night', 'Good morning', 'Goodbye', 'See you later'],
    correctIndex: 1,
  },
  {
    id: 'a1-numbers',
    level: 'A1',
    prompt: 'Complete: "I have ___ brothers."',
    context: 'Número em inglês.',
    options: ['tree', 'three', 'thre', 'free'],
    correctIndex: 1,
  },
  {
    id: 'a1-verb-be',
    level: 'A1',
    prompt: 'She ___ a student.',
    options: ['am', 'is', 'are', 'be'],
    correctIndex: 1,
  },
  {
    id: 'a2-past',
    level: 'A2',
    prompt: 'Yesterday, I ___ to the supermarket.',
    options: ['go', 'goes', 'went', 'going'],
    correctIndex: 2,
  },
  {
    id: 'a2-comparative',
    level: 'A2',
    prompt: 'This book is ___ than that one.',
    options: ['more good', 'better', 'gooder', 'best'],
    correctIndex: 1,
  },
  {
    id: 'a2-frequency',
    level: 'A2',
    prompt: 'I ___ drink coffee, only on weekends.',
    options: ['always', 'usually', 'sometimes', 'never'],
    correctIndex: 2,
  },
  {
    id: 'b1-present-perfect',
    level: 'B1',
    prompt: 'I have lived here ___ 2019.',
    options: ['for', 'since', 'from', 'during'],
    correctIndex: 1,
  },
  {
    id: 'b1-conditionals',
    level: 'B1',
    prompt: 'If I ___ more time, I would learn another language.',
    options: ['have', 'had', 'will have', 'would have'],
    correctIndex: 1,
  },
  {
    id: 'b1-passive',
    level: 'B1',
    prompt: 'The report ___ by the team last Friday.',
    options: ['wrote', 'was written', 'has wrote', 'is writing'],
    correctIndex: 1,
  },
  {
    id: 'b2-nuance',
    level: 'B2',
    prompt: 'Despite the rain, the event went ___ as planned.',
    options: ['out', 'off', 'away', 'through'],
    correctIndex: 1,
  },
  {
    id: 'b2-inference',
    level: 'B2',
    prompt: 'She tends to play devil\'s advocate in meetings. She usually ___',
    options: [
      'agrees with everyone',
      'argues the opposite view',
      'leaves early',
      'avoids speaking',
    ],
    correctIndex: 1,
  },
  {
    id: 'b2-register',
    level: 'B2',
    prompt: 'Which sentence is most appropriate in a formal email?',
    options: [
      'Hey, just checking in about the thing.',
      'I am writing to follow up on our previous discussion.',
      'Yo, got a sec?',
      'Can u send that asap?',
    ],
    correctIndex: 1,
  },
]

export const PLACEMENT_MAX_QUESTIONS = 8

export function getPlacementItemById(
  id: string,
  extraItems: PlacementItem[] = []
): PlacementItem | undefined {
  return extraItems.find((item) => item.id === id) ?? PLACEMENT_ITEMS.find((item) => item.id === id)
}

export function getPlacementItemsByLevel(level: LearnerCefrLevel): PlacementItem[] {
  return PLACEMENT_ITEMS.filter((item) => item.level === level)
}