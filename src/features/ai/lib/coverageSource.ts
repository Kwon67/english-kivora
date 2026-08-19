import { selectRelevantPhrases } from './phraseCoverage'

type Linha = Record<string, unknown>

type QueryLike = PromiseLike<{ data: Linha[] | null }> & {
  eq: (column: string, value: unknown) => QueryLike
  in: (column: string, values: readonly unknown[]) => QueryLike
  or: (filter: string) => QueryLike
  limit: (count: number) => QueryLike
  range: (from: number, to: number) => QueryLike
}

type SupabaseLike = {
  from: (table: string) => { select: (columns: string) => QueryLike }
}

/** Teto de segurança: o prompt nunca deve depender do tamanho do acervo. */
export const COVERAGE_PROMPT_LIMIT = 60

/** Tamanho de cada página. O PostgREST recusa passar de 1000 linhas por requisição. */
const TAMANHO_PAGINA = 1000

/**
 * Lê todas as frases dos packs indicados, página por página.
 *
 * O `.limit(5000)` que estava aqui antes era ilusão: o PostgREST tem um teto próprio de 1000
 * linhas e simplesmente ignora pedidos maiores, sem erro nenhum. Com o acervo em 1177 frases a
 * verificação de duplicata estava cega para as últimas 177 — silenciosamente, que é o pior jeito
 * de falhar. Paginar é a única forma de a cobertura acompanhar o acervo crescendo.
 */
async function lerTodasAsFrases(supabase: SupabaseLike, packIds: string[]): Promise<string[]> {
  const frases: string[] = []

  for (let pagina = 0; ; pagina += 1) {
    const inicio = pagina * TAMANHO_PAGINA
    const { data } = await supabase
      .from('cards')
      .select('english_phrase')
      .in('pack_id', packIds)
      .range(inicio, inicio + TAMANHO_PAGINA - 1)

    const lote = data ?? []
    for (const card of lote) {
      const frase = card.english_phrase as string | null
      if (frase) frases.push(frase)
    }

    if (lote.length < TAMANHO_PAGINA) return frases
  }
}

/**
 * As frases que a geração precisa evitar, já recortadas para o tema pedido.
 *
 * O escopo depende de quem está gerando. O admin abastece o catálogo público, então compete
 * com ele inteiro. Um usuário Pro gerando pack próprio compete com o catálogo *e* com o que ele
 * mesmo já criou — não faz sentido gastar uma das 5 gerações diárias dele reinventando uma frase
 * que ele poderia simplesmente adicionar de graça.
 */
export async function fetchPhrasesToAvoid(
  supabase: SupabaseLike,
  topic: string,
  options: { ownerId?: string; limit?: number } = {}
): Promise<string[]> {
  const { ownerId, limit = COVERAGE_PROMPT_LIMIT } = options

  const packFilter = ownerId
    ? `is_public.eq.true,is_public.is.null,owner_id.eq.${ownerId}`
    : 'is_public.eq.true,is_public.is.null'

  const { data: packs } = await supabase.from('packs').select('id').or(packFilter)
  const packIds = (packs ?? []).map((pack) => pack.id as string).filter(Boolean)
  if (packIds.length === 0) return []

  const phrases = await lerTodasAsFrases(supabase, packIds)

  return selectRelevantPhrases(topic, phrases, limit)
}
