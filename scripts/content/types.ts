/**
 * Conteúdo curado que o seed insere no catálogo.
 *
 * Tuplas `[inglês, português]` em vez de objetos: são ~900 frases, e o par lado a lado deixa a
 * revisão humana viável — o erro que importa aqui é tradução torta, e ele salta aos olhos quando
 * as duas línguas estão na mesma linha.
 */
export type SeedCard = [english: string, portuguese: string]

export type SeedPack = {
  name: string
  description: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  category: 'Geral' | 'Conversação' | 'Gramática' | 'Negócios' | 'Viagem'
  cards: SeedCard[]
}
