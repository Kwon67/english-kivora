import '../../practice-path.css'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PracticePath from '@/features/curriculum/components/PracticePath'
import { PRACTICE_UNITS } from '@/features/curriculum/lib/practicePath'
export const metadata = { title: 'Prática por competências' }
export default async function Page({searchParams}:{searchParams:Promise<{unit?:string}>}) {
  const {unit}=await searchParams
  const db=await createClient()
  const {data:{user}}=await db.auth.getUser()
  if(!user) redirect('/login')
  const {data,error}=await db.from('packs').select('id,name').in('id',PRACTICE_UNITS.flatMap(unit=>unit.packIds)).eq('is_public',true)
  return <PracticePath key={user.id} userId={user.id} initialUnit={unit} packs={data||[]} packsUnavailable={Boolean(error)} />
}
