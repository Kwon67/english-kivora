import type { createAdminClient } from '@/lib/supabase/server'
import type { QuickWordInput } from './quickWord'
import { getAppDateString } from '@/lib/timezone'
type Database = NonNullable<ReturnType<typeof createAdminClient>>
/** Stable primary keys make retries safe, including a lost response after insertion. */
export async function persistQuickWord(db: Database, userId: string, input: QuickWordInput) {
  const fail = (error: string, retryable = true) => ({ success: false as const, error, retryable })
  let pack = await db.from('packs').select('id,owner_id,is_public').eq('id', input.packId).maybeSingle()
  if (pack.error) return fail('Não foi possível abrir a coleção. Tente novamente.')
  if (!pack.data && input.createCollection) {
    const created = await db.from('packs').insert({ id: input.packId, name: 'Minhas palavras', owner_id: userId, is_public: false })
    if (created.error && created.error.code !== '23505') return fail('Não foi possível criar a coleção. Tente novamente.')
    pack = await db.from('packs').select('id,owner_id,is_public').eq('id', input.packId).maybeSingle()
  }
  if (pack.error || !pack.data || pack.data.owner_id !== userId || pack.data.is_public) return fail('Escolha uma coleção privada sua.', false)
  const existing = await db.from('cards').select('id,pack_id,english_phrase,portuguese_translation').eq('id', input.cardId).maybeSingle()
  if (existing.error) return fail('Não foi possível conferir a palavra. Tente novamente.')
  if (existing.data && (existing.data.pack_id !== input.packId || existing.data.english_phrase !== input.en || existing.data.portuguese_translation !== input.pt)) return fail('Este envio já foi usado. Atualize a página.', false)
  if (!existing.data) {
    const saved = await db.from('cards').insert({ id: input.cardId, pack_id: input.packId, english_phrase: input.en, portuguese_translation: input.pt })
    if (saved.error) {
      if (saved.error.code !== '23505') return fail('A palavra não foi salva. Tente novamente.')
      const concurrent = await db.from('cards').select('pack_id,english_phrase,portuguese_translation').eq('id', input.cardId).maybeSingle()
      if (concurrent.error || !concurrent.data || concurrent.data.pack_id !== input.packId || concurrent.data.english_phrase !== input.en || concurrent.data.portuguese_translation !== input.pt) return fail('Não foi possível confirmar este envio. Confira a coleção.', false)
    }
  }
  const assignment = await db.from('assignments').select('id').eq('user_id', userId).eq('pack_id', input.packId).limit(1)
  if (assignment.error) return fail('Palavra guardada; falta incluí-la na revisão. Tente novamente.')
  if (!assignment.data?.length) {
    const result = await db.from('assignments').insert({ id: input.packId, user_id: userId, pack_id: input.packId, game_mode: 'flashcard', status: 'pending', assigned_date: getAppDateString(), assigned_by: 'self' })
    if (result.error) {
      if (result.error.code !== '23505') return fail('Palavra guardada; falta incluí-la na revisão. Tente novamente.')
      const confirmed = await db.from('assignments').select('id').eq('user_id', userId).eq('pack_id', input.packId).limit(1)
      if (confirmed.error || !confirmed.data?.length) return fail('Palavra guardada; falta incluí-la na revisão. Tente novamente.')
    }
  }
  return { success: true as const, packId: input.packId }
}
