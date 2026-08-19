type Linha = Record<string, unknown>

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => PromiseLike<{ data: Linha[] | null }>
    }
  }
}

/**
 * Quantos packs públicos ainda NÃO estão na rotina da pessoa.
 *
 * Alimenta o aviso de material acabando: enquanto existir pack curado parado no catálogo, a
 * sugestão deve ser adicioná-lo, não gerar um novo com IA.
 *
 * Duas consultas leves (só ids), não o conteúdo dos packs.
 */
export async function countCatalogPacksNotInRoutine(
  supabase: SupabaseLike,
  userId: string
): Promise<number> {
  const [{ data: publicos }, { data: meus }] = await Promise.all([
    supabase.from('packs').select('id').eq('is_public', true),
    supabase.from('assignments').select('pack_id').eq('user_id', userId),
  ])

  const naRotina = new Set(
    (meus ?? []).map((row) => row.pack_id as string | null).filter((id): id is string => Boolean(id))
  )

  return (publicos ?? []).filter((pack) => !naRotina.has(pack.id as string)).length
}
