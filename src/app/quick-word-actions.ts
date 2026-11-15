'use server'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { QuickWordSchema, type QuickWordInput } from '@/features/words/quickWord'
import { persistQuickWord } from '@/features/words/quickWordService'
export async function addQuickWord(input: QuickWordInput) {
  const parsed = QuickWordSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message || 'Confira os campos.' }
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  if (error || !user) return { success: false as const, error: 'Entre novamente para salvar.' }
  const db = createAdminClient()
  if (!db) return { success: false as const, error: 'Não foi possível salvar agora.' }
  const result = await persistQuickWord(db, user.id, parsed.data)
  if (result.success) for (const route of ['/home', '/review', '/library', '/add']) revalidatePath(route)
  return result
}
