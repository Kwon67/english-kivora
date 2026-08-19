/**
 * "Ainda tenho o que aprender?"
 *
 * A repetição espaçada é boa em decidir QUANDO rever o que você já viu, e não tem opinião nenhuma
 * sobre o que você ainda não viu. Quando o material inédito acaba, a fila simplesmente esvazia e
 * o app fica em silêncio — parecendo que você terminou, quando na verdade ficou sem conteúdo.
 *
 * Medido no baralho real: 26 cards inéditos na rotina a 10 por dia, ou seja ~3 dias. E havia 4
 * packs no catálogo, com 40 cards, que o usuário nunca adicionou — 4 dias de material esperando
 * sem que nada avisasse.
 *
 * Por isso a ordem da sugestão importa: catálogo ANTES de gerar com IA. Conteúdo curado que já
 * existe não custa nada e já foi revisado; gerar deveria ser o caminho de quem realmente esgotou.
 */

export type NewMaterialSuggestion = 'adicionar-pack' | 'gerar' | null

export type NewMaterialInput = {
  /** Cards da rotina que o usuário nunca viu. */
  unseenInRoutine: number
  /** Teto diário de cards novos. */
  dailyNewLimit: number
  /** Packs públicos que ele ainda não adicionou. */
  catalogPacksAvailable: number
}

export type NewMaterialStatus = {
  daysLeft: number
  level: 'ok' | 'acabando' | 'vazio'
  suggestion: NewMaterialSuggestion
  unseenInRoutine: number
  catalogPacksAvailable: number
}

/** A partir daqui vale avisar. Três dias dão tempo de agir antes do silêncio. */
export const LOW_MATERIAL_DAYS = 3

export function getNewMaterialStatus(input: NewMaterialInput): NewMaterialStatus {
  const unseen = Math.max(0, input.unseenInRoutine)
  const limite = Math.max(1, input.dailyNewLimit)
  const catalogo = Math.max(0, input.catalogPacksAvailable)

  const daysLeft = Math.ceil(unseen / limite)
  const level = unseen === 0 ? 'vazio' : daysLeft <= LOW_MATERIAL_DAYS ? 'acabando' : 'ok'

  // Catálogo primeiro: só oferece gerar quando não há mais nada curado para adicionar.
  const suggestion: NewMaterialSuggestion =
    level === 'ok' ? null : catalogo > 0 ? 'adicionar-pack' : 'gerar'

  return {
    daysLeft,
    level,
    suggestion,
    unseenInRoutine: unseen,
    catalogPacksAvailable: catalogo,
  }
}
