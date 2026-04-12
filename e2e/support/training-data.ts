type GameMode = 'multiple_choice' | 'flashcard' | 'typing' | 'matching'

export interface TrainingCard {
  en: string
  pt: string
}

export interface TrainingPack {
  key: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  gameMode: GameMode
  cards: TrainingCard[]
}

export function createTrainingPacks(runId: string): TrainingPack[] {
  return [
    {
      key: 'multiple-choice',
      name: `E2E MC ${runId}`,
      description: 'Validação E2E do modo de múltipla escolha.',
      difficulty: 'easy',
      gameMode: 'multiple_choice',
      cards: [
        { en: 'Morning breeze', pt: 'Brisa da manhã' },
        { en: 'Silent library', pt: 'Biblioteca silenciosa' },
        { en: 'Open window', pt: 'Janela aberta' },
        { en: 'Blue notebook', pt: 'Caderno azul' },
      ],
    },
    {
      key: 'flashcard',
      name: `E2E FLASH ${runId}`,
      description: 'Validação E2E do modo flashcard.',
      difficulty: 'easy',
      gameMode: 'flashcard',
      cards: [
        { en: 'Warm coffee', pt: 'Café quente' },
        { en: 'Quiet street', pt: 'Rua tranquila' },
        { en: 'Soft blanket', pt: 'Cobertor macio' },
        { en: 'Green garden', pt: 'Jardim verde' },
      ],
    },
    {
      key: 'typing',
      name: `E2E TYPING ${runId}`,
      description: 'Validação E2E do modo de digitação.',
      difficulty: 'medium',
      gameMode: 'typing',
      cards: [
        { en: 'Bright screen', pt: 'Tela brilhante' },
        { en: 'Tall building', pt: 'Prédio alto' },
        { en: 'Fresh bread', pt: 'Pão fresco' },
        { en: 'Clean desk', pt: 'Mesa limpa' },
      ],
    },
    {
      key: 'matching',
      name: `E2E MATCH ${runId}`,
      description: 'Validação E2E do modo de combinação.',
      difficulty: 'medium',
      gameMode: 'matching',
      cards: [
        { en: 'Silver key', pt: 'Chave prateada' },
        { en: 'Little boat', pt: 'Barco pequeno' },
        { en: 'Golden hour', pt: 'Hora dourada' },
        { en: 'City bridge', pt: 'Ponte da cidade' },
      ],
    },
  ]
}

export function toTranslationMap(cards: TrainingCard[]): Record<string, string> {
  return Object.fromEntries(cards.map((card) => [card.en, card.pt]))
}
