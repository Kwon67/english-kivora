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
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*, packs(name)')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .single()

  if (assignmentError) {
    console.error('Error fetching assignment:', assignmentError)
    redirect('/home')
  }
  if (!assignment) redirect('/home')

  // If already completed, redirect
  if (assignment.status === 'completed') {
    console.log(`Assignment ${assignmentId} is already completed. Redirecting...`)
    redirect('/home')
  }

  // Fetch cards for this pack
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('id,pack_id,english_phrase,portuguese_translation,created_at')
    .eq('pack_id', assignment.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError) {
    console.error('Error fetching cards:', cardsError)
    redirect('/home')
  }
  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">Pacote Vazio</h2>
        <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-6">
          Este pacote de treinamento ainda não possui cards. Peça para o administrador adicionar conteúdo para poder jogar.
        </p>
        <a href="/home" className="btn-primary">Voltar ao Início</a>
      </div>
    )
  }

  return (
    <GameClient
      cards={cards}
      gameMode={assignment.game_mode}
      assignmentId={assignment.id}
      packName={(assignment.packs as { name: string })?.name || 'Pack'}
    />
  )
}

