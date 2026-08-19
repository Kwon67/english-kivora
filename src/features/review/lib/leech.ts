import { REVIEW_GRADE } from '@/features/review/lib/reviewGrades'

/**
 * Cards que você erra indefinidamente ("leech").
 *
 * A repetição espaçada assume que repetir resolve. Para a maioria das frases resolve; para umas
 * poucas, não — e essas voltam para sempre, comendo a cota diária sem nunca grudar. Medido num
 * baralho real: 12 cards com 6+ revisões ainda em 10 dias ou menos, um com 11 revisões e intervalo
 * de 1 dia.
 *
 * O limite de 8 é o padrão do Anki, calibrado em décadas de uso. Passando dele, insistir na mesma
 * forma é desperdício: o card sai da fila automática e vai para Dificuldades, onde a pessoa pode
 * atacá-lo de outro jeito (ouvir, escrever, quebrar em pedaços) ou decidir deixá-lo de lado.
 *
 * Sair da fila NÃO é apagar: o card continua no baralho, com todo o histórico, e volta assim que
 * for revisado de propósito.
 */
export const LEECH_LAPSES_THRESHOLD = 8

/** Um lapso só conta quando o card JÁ tinha graduado — errar enquanto aprende é o esperado. */
export function nextLapseCount(
  grade: number,
  currentLapses: number,
  wasGraduated: boolean
): number {
  const atual = Math.max(0, currentLapses)
  if (!wasGraduated) return atual
  return grade === REVIEW_GRADE.AGAIN ? atual + 1 : atual
}

export function isLeech(lapses: number | null | undefined): boolean {
  return (lapses ?? 0) >= LEECH_LAPSES_THRESHOLD
}

/**
 * Quantos lapsos ainda faltam para o card sair da fila. Serve para avisar ANTES de acontecer,
 * em vez de o card sumir sem explicação.
 */
export function lapsesUntilLeech(lapses: number | null | undefined): number {
  return Math.max(0, LEECH_LAPSES_THRESHOLD - (lapses ?? 0))
}
