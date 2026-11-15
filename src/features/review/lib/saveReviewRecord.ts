import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'
type Client = Awaited<ReturnType<typeof createClient>>
type RecordInput = Database['public']['Tables']['card_reviews']['Insert'] & { lapses?: number }
export class ReviewConflictError extends Error {}
/** Compare-and-set prevents two tabs from advancing the same review version. */
export async function saveReviewRecord(db: Client, record: RecordInput, expected?: number, existing = false) {
  if (expected === undefined) {
    const { error } = await db.from('card_reviews').upsert(record, { onConflict: 'user_id,card_id' })
    if (error) throw new Error('Não foi possível salvar a resposta.')
    return
  }
  if (!existing) {
    const { error } = await db.from('card_reviews').insert(record)
    if (error?.code === '23505') throw new ReviewConflictError('Esta resposta já foi registrada. Recarregue a fila.')
    if (error) throw new Error('Não foi possível salvar a resposta.')
    return
  }
  const { data, error } = await db.from('card_reviews').update(record).eq('user_id', record.user_id).eq('card_id', record.card_id).eq('total_reviews', expected).select('card_id').maybeSingle()
  if (error) throw new Error('Não foi possível salvar a resposta.')
  if (!data) throw new ReviewConflictError('A revisão mudou. Recarregue a fila.')
}
