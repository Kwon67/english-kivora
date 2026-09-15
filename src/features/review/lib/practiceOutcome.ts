import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'

/**
 * O que a prática objetiva (digitação, escuta, fala, múltipla escolha) disse sobre o card ANTES
 * da autoavaliação.
 *
 * Isto existia e era jogado fora: `ReviewModePractice` chamava o mesmo `advance()` em acerto e em
 * erro, e a tela de nota abria com os quatro botões livres. Quem errou a digitação via a resposta
 * e podia clicar "Fácil" — a única entrada do agendador era a memória da pessoa sobre a própria
 * memória, que depois de ver o gabarito é generosa por natureza. Era a razão de "86 dominados"
 * conviverem com uma taxa de acerto em queda.
 *
 * - `wrong`: a prática reprovou. A frase não estava lá; o único veredito honesto é "Errei".
 * - `partial`: as palavras certas com erro de digitação. Passou raspando: "Difícil" no máximo.
 * - `correct`: passou limpo. A pessoa decide entre as quatro notas.
 * - `unscored`: a prática não mede nada (flashcard só revela). Sem restrição.
 */
export type PracticeOutcome = 'correct' | 'partial' | 'wrong' | 'unscored'

const SEVERITY: Record<PracticeOutcome, number> = {
  unscored: 0,
  correct: 1,
  partial: 2,
  wrong: 3,
}

/** Com mais de um modo por card, vale o pior resultado: uma reprovação não é apagada por um acerto depois. */
export function worstPracticeOutcome(
  current: PracticeOutcome | null,
  next: PracticeOutcome
): PracticeOutcome {
  if (!current) return next
  return SEVERITY[next] > SEVERITY[current] ? next : current
}

const ALL_GRADES = [REVIEW_GRADE.AGAIN, REVIEW_GRADE.HARD, REVIEW_GRADE.GOOD, REVIEW_GRADE.EASY] as const

/** Quais notas a prática deixa em aberto. `null` = nenhuma prática aconteceu nesta revisão. */
export function allowedGradesAfterPractice(outcome: PracticeOutcome | null): readonly number[] {
  if (outcome === 'wrong') return [REVIEW_GRADE.AGAIN]
  if (outcome === 'partial') return [REVIEW_GRADE.AGAIN, REVIEW_GRADE.HARD]
  return ALL_GRADES
}

export function isGradeAllowedAfterPractice(grade: number, outcome: PracticeOutcome | null): boolean {
  return allowedGradesAfterPractice(outcome).includes(grade)
}

/** A frase que explica por que os outros botões sumiram. `null` quando não há o que explicar. */
export function practiceOutcomeNotice(outcome: PracticeOutcome | null): string | null {
  if (outcome === 'wrong') {
    return 'A prática reprovou esta frase, então ela conta como erro e volta em instantes.'
  }
  if (outcome === 'partial') {
    return 'Você acertou o sentido com erro de digitação: vale no máximo "Difícil".'
  }
  return null
}
