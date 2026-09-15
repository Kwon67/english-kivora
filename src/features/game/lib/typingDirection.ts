import type { TypingDirection } from '@/features/game/components/TypingMode'

/**
 * Para que lado a digitação vai numa atividade do plano diário.
 *
 * A digitação é produção (lê o português, escreve o inglês) — mas produzir de memória uma frase
 * que a pessoa NUNCA viu não mede nada: ela chuta uma tradução possível, o corretor só conhece o
 * gabarito, e a sessão vira uma sequência de "errado" com o SRS punindo cards que ela acabou de
 * conhecer. No primeiro contato com o pack a digitação é compreensão (vê o inglês, escreve o
 * sentido), que expõe a frase; a partir do segundo encontro, produção. É a mesma régua da revisão:
 * card em aprendizagem escreve o sentido, card maduro produz.
 *
 * "Já encontrou o pack" = concluiu alguma atividade dele antes (em qualquer modo) OU algum card
 * dele já está na repetição espaçada.
 */
export function resolveTypingDirectionForPack(input: {
  completedAssignmentsBefore: number
  cardsInSpacedRepetition: number
}): TypingDirection {
  const hasMetPack = input.completedAssignmentsBefore > 0 || input.cardsInSpacedRepetition > 0
  return hasMetPack ? 'pt-to-en' : 'en-to-pt'
}
