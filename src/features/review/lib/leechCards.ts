import { LEECH_LAPSES_THRESHOLD } from '@/features/review/lib/leech'

type Linha = Record<string, unknown>

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: unknown) => {
        gte: (column: string, value: unknown) => {
          order: (column: string, options: { ascending: boolean }) => {
            limit: (n: number) => PromiseLike<{ data: Linha[] | null }>
          }
        }
      }
    }
  }
}

export type LeechCard = {
  cardId: string
  en: string
  pt: string
  lapses: number
}

/**
 * Cards que saíram da fila automática por lapsos demais.
 *
 * Sem esta listagem eles virariam buraco negro: parariam de aparecer na revisão e ninguém saberia
 * por quê. Aqui a pessoa vê quais são, quantas vezes esqueceu cada um, e pode revisá-los de
 * propósito por um link direcionado.
 */
export async function getLeechCards(
  supabase: SupabaseLike,
  userId: string,
  limit = 12
): Promise<LeechCard[]> {
  const { data } = await supabase
    .from('card_reviews')
    .select('card_id,lapses,cards(english_phrase,portuguese_translation)')
    .eq('user_id', userId)
    .gte('lapses', LEECH_LAPSES_THRESHOLD)
    .order('lapses', { ascending: false })
    .limit(limit)

  return ((data ?? []) as Linha[])
    .map((linha) => {
      const card = linha.cards as { english_phrase?: string; portuguese_translation?: string } | null
      return {
        cardId: String(linha.card_id ?? ''),
        en: card?.english_phrase ?? '',
        pt: card?.portuguese_translation ?? '',
        lapses: Number(linha.lapses ?? 0),
      }
    })
    .filter((card) => card.cardId && card.en)
}
