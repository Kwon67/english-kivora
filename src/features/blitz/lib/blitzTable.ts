import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type SupabaseLikeError = {
  code?: string
  message?: string
} | null | undefined

export function isBlitzTableMissingError(error: SupabaseLikeError): boolean {
  if (!error?.message) return false

  return (
    error.code === 'PGRST205' ||
    /blitz_runs/i.test(error.message) ||
    /schema cache/i.test(error.message)
  )
}

export async function isBlitzTableReady(
  supabase: SupabaseClient<Database>
): Promise<boolean> {
  const { error } = await supabase.from('blitz_runs').select('id').limit(1)
  if (!error) return true
  return !isBlitzTableMissingError(error)
}