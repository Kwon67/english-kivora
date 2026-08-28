import { isPackLevelAllowed, type LevelGate } from '@/features/learning/lib/levelGate'

type Linha = Record<string, unknown>

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => PromiseLike<{ data: Linha[] | null }>
    }
  }
}

/**
 * Quantos packs do catálogo o motor ainda pode trazer para esta pessoa.
 *
 * Alimenta o aviso de material acabando: enquanto existir pack curado que ela ainda não recebeu,
 * a mensagem é "o plano de amanhã traz mais"; quando acabar, aí sim vale oferecer gerar com IA.
 *
 * O `gate` é o que torna a conta honesta. Sem ele o aviso contava o catálogo inteiro, incluindo
 * material acima do nível — que o motor nunca vai atribuir. Um A1 veria "ainda há 80 packs" e
 * receberia zero, que é exatamente a promessa vazia que este aviso existe para evitar.
 *
 * Duas consultas leves (só ids e nível), não o conteúdo dos packs.
 */
export async function countCatalogPacksNotInRoutine(
  supabase: SupabaseLike,
  userId: string,
  gate?: LevelGate
): Promise<number> {
  const [{ data: publicos }, { data: meus }] = await Promise.all([
    supabase.from('packs').select('id,level').eq('is_public', true),
    supabase.from('assignments').select('pack_id').eq('user_id', userId),
  ])

  const naRotina = new Set(
    (meus ?? []).map((row) => row.pack_id as string | null).filter((id): id is string => Boolean(id))
  )

  return (publicos ?? []).filter((pack) => {
    if (naRotina.has(pack.id as string)) return false
    if (!gate) return true
    return isPackLevelAllowed(pack.level as string | null, gate)
  }).length
}
