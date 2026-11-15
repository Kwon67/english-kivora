import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

type Client = Awaited<ReturnType<typeof createClient>>
type Release = Database['public']['Tables']['card_reviews']['Insert']

/** Release a card without replacing an answer saved after the schedule was read. */
export async function releaseScheduledCard(db: Client, record: Release, previousTotal: number | null): Promise<void> {
  if (previousTotal === null) {
    const { error } = await db.from('card_reviews').insert(record)
    if (error && error.code !== '23505') throw new Error('Não foi possível liberar o cartão agendado.')
    return
  }
  const { error } = await db.from('card_reviews').update({ next_review_date: record.next_review_date })
    .eq('user_id', record.user_id).eq('card_id', record.card_id).eq('total_reviews', previousTotal)
  if (error) throw new Error('Não foi possível liberar o cartão agendado.')
}
