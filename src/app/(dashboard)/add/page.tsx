import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import QuickAdd from '@/features/words/QuickAdd'
export const metadata = { title: 'Adicionar palavra' }
export default async function AddPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const { data, error } = await db.from('packs').select('id,name').eq('owner_id', user.id).eq('is_public', false).order('created_at', { ascending: false })
  return <QuickAdd key={user.id} userId={user.id} packs={data || []} loadError={Boolean(error)} />
}
