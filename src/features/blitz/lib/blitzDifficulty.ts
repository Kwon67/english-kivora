import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'

/**
 * Dificuldade do Blitz IA, no lugar dos quatro níveis CEFR.
 *
 * A tela oferecia A1, A2, B1 e B2. Quem não conhece a escala CEFR não tem como escolher entre
 * quatro siglas — e escolher errado estraga a partida inteira, porque o conteúdo é gerado na hora.
 * Três palavras que qualquer pessoa entende resolvem a mesma decisão.
 *
 * O CEFR não sumiu: ele continua sendo o que descreve o conteúdo para a IA e o que fica gravado
 * no pack efêmero. A mudança é de vocabulário na escolha, não de motor.
 *
 * "Fácil" cobre uma FAIXA (A1–A2) de propósito. Um iniciante de verdade e alguém no fim do A2
 * fazem a mesma escolha aqui, então a instrução para a IA descreve a faixa inteira em vez de
 * fingir que é um ponto só.
 */
export const BLITZ_DIFFICULTIES = [
  {
    id: 'facil',
    label: 'Fácil',
    hint: 'Frases curtas do dia a dia',
    cefr: ['A1', 'A2'],
    /** Nível gravado no pack efêmero. É o teto da faixa, não uma média. */
    storedCefr: 'A2',
  },
  {
    id: 'medio',
    label: 'Médio',
    hint: 'Trabalho, estudo e viagem',
    cefr: ['B1'],
    storedCefr: 'B1',
  },
  {
    id: 'dificil',
    label: 'Difícil',
    hint: 'Opinião, nuance e expressões',
    cefr: ['B2'],
    storedCefr: 'B2',
  },
] as const satisfies readonly {
  id: string
  label: string
  hint: string
  cefr: readonly LearnerCefrLevel[]
  storedCefr: LearnerCefrLevel
}[]

export type BlitzDifficulty = (typeof BLITZ_DIFFICULTIES)[number]['id']

export const DEFAULT_BLITZ_DIFFICULTY: BlitzDifficulty = 'facil'

export function isBlitzDifficulty(value: unknown): value is BlitzDifficulty {
  return BLITZ_DIFFICULTIES.some((item) => item.id === value)
}

export function getBlitzDifficulty(id: BlitzDifficulty) {
  return BLITZ_DIFFICULTIES.find((item) => item.id === id) ?? BLITZ_DIFFICULTIES[0]
}

/** Nível CEFR gravado no pack efêmero gerado para a partida. */
export function cefrForDifficulty(id: BlitzDifficulty): LearnerCefrLevel {
  return getBlitzDifficulty(id).storedCefr
}

/**
 * Links antigos apontam para `?level=A1|A2|B1|B2`. Em vez de mandá-los para o /blitz, traduz para
 * a dificuldade equivalente — quem tinha a partida salva nos favoritos continua jogando.
 */
export function difficultyFromCefr(level: string): BlitzDifficulty | null {
  const achado = BLITZ_DIFFICULTIES.find((item) => (item.cefr as readonly string[]).includes(level))
  return achado ? achado.id : null
}

/** Faixa em texto, para a instrução da IA e para a descrição do pack. */
export function cefrRangeLabel(id: BlitzDifficulty): string {
  const { cefr } = getBlitzDifficulty(id)
  return cefr.length > 1 ? `${cefr[0]}–${cefr[cefr.length - 1]}` : cefr[0]
}
