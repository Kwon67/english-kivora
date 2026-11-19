import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TutorSession from '@/features/tutor/components/TutorSession'
export default async function ScenarioDetailPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)redirect('/login')
 return <TutorSession key={`${user.id}:${id}`} userId={user.id} scenarioId={id}/>
}
