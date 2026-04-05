import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GameClient from './GameClient'

export default async function PlayPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch assignment with pack info
  const { data: assignment } = await supabase
    .from('assignments')
    .select('*, packs(name)')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .single()

  if (!assignment) redirect('/home')

  // If already completed, redirect
  if (assignment.status === 'completed') {
    console.log(`Assignment ${assignmentId} is already completed. Redirecting...`)
    redirect('/home')
  }

  // Fetch cards for this pack
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', assignment.pack_id)
    .order('order_index', { ascending: true })

  if (!cards || cards.length === 0) redirect('/home')

  return (
    <GameClient
      cards={cards}
      gameMode={assignment.game_mode}
      assignmentId={assignment.id}
      packName={(assignment.packs as { name: string })?.name || 'Pack'}
    />
  )
}
