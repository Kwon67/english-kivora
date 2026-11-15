import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DictionarySearch from '@/features/dictionary/DictionarySearch'

export const metadata = { title: 'Dicionário' }
export default async function DictionaryPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  return <DictionarySearch />
}
