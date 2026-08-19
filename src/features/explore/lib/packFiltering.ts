/**
 * Busca e filtro do catálogo.
 *
 * A tela de descoberta foi desenhada para 16 coleções e agora carrega 105 — quase 38 mil pixels
 * de rolagem, sem busca e sem filtro por tema, embora a coluna `category` esteja preenchida no
 * banco desde a semeadura. Este módulo é a lógica que faltava, separada da tela para poder ser
 * testada sem renderizar nada.
 */

export type FiltravelPack = {
  id: string
  name: string
  description: string | null
  level: string | null
  category: string | null
}

/** Sem acento, sem caixa, sem espaço sobrando — para "negocios" achar "Negócios". */
export function normalizeBusca(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * A coleção atende à busca?
 *
 * Cada palavra digitada precisa aparecer em algum lugar (nome, descrição, categoria ou nível),
 * não necessariamente no mesmo campo: quem digita "entrevista b2" espera achar a coleção de
 * entrevista que é B2, e essas duas informações vivem em colunas diferentes.
 */
export function packAtendeBusca(pack: FiltravelPack, query: string): boolean {
  const termos = normalizeBusca(query).split(' ').filter(Boolean)
  if (termos.length === 0) return true

  const alvo = normalizeBusca(
    [pack.name, pack.description, pack.category, pack.level].filter(Boolean).join(' ')
  )

  return termos.every((termo) => alvo.includes(termo))
}

export type FiltroCatalogo = {
  query?: string
  /** null ou ausente = todas as categorias. */
  category?: string | null
}

export function filtrarPacks<T extends FiltravelPack>(packs: T[], filtro: FiltroCatalogo = {}): T[] {
  const { query = '', category = null } = filtro

  return packs.filter((pack) => {
    if (category && (pack.category ?? 'Geral') !== category) return false
    return packAtendeBusca(pack, query)
  })
}

export type CategoriaContada = { name: string; count: number }

/**
 * As categorias realmente presentes, da mais numerosa para a menos.
 *
 * Deriva dos dados em vez de uma lista fixa: categoria nova no banco aparece sozinha no filtro,
 * e categoria que ficou sem coleções não vira um botão que não filtra nada.
 */
export function listarCategorias(packs: FiltravelPack[]): CategoriaContada[] {
  const contagem = new Map<string, number>()

  for (const pack of packs) {
    const nome = pack.category ?? 'Geral'
    contagem.set(nome, (contagem.get(nome) ?? 0) + 1)
  }

  return [...contagem.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pt-BR'))
}
