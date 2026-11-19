'use server'
import { createClient } from '@/lib/supabase/server'
import { ContextAttemptSchema, persistContextAttempt, type ContextAttempt, type ContextSaveResult } from '@/features/study/lib/contextPracticePersistence'

export async function saveContextPractice(input: ContextAttempt): Promise<ContextSaveResult> {
  if (!ContextAttemptSchema.safeParse(input).success) return { status: 'error', message: 'Confira os campos da prática.' }
  const db = await createClient()
  const { data: { user }, error } = await db.auth.getUser()
  if (error || !user) return { status: 'error', message: 'Entre novamente para salvar. Seu rascunho continua neste navegador.' }
  // Explicit rollout gate: the staged schema is not present in production during this local-only task.
  if (process.env.CONTEXT_PRACTICE_PERSISTENCE_ENABLED !== 'true') return { status: 'local_only' }
  return persistContextAttempt(db, user.id, input)
}
