import { redirect } from 'next/navigation'
import { getAssignmentDeadline, parseAssignmentStatus } from '@/features/game/lib/assignmentStatus'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import GameClient from './GameClient'
import EmptyState from '@/components/ui/EmptyState'

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ assignmentId: string }>
  searchParams: Promise<{ adaptive?: string }>
}) {
  const { assignmentId } = await params
  const { adaptive } = await searchParams
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
  const assignmentStatus = parseAssignmentStatus(assignment.status)

  if (assignmentStatus.baseStatus === 'completed') {
    console.log(`Assignment ${assignmentId} is already completed. Redirecting...`)
    redirect('/home')
  }

  // Fetch cards for this pack
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', assignment.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError) {
    console.error('Error fetching cards:', cardsError)
    redirect('/home')
  }
  if (!cards || cards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Ilustração unDraw de pacote sem cards"
          title="Pacote vazio"
          description="Este pacote ainda não possui cards. Peça para o administrador adicionar conteúdo antes de iniciar a sessão."
          actionHref="/home"
          actionLabel="Voltar ao início"
          transitionTypes={navBackTransitionTypes}
          className="w-full max-w-xl"
        />
      </div>
    )
  }

  const adaptiveMode =
    adaptive && isPlayableAssignmentGameMode(adaptive) ? adaptive : null
  const effectiveGameMode =
    adaptiveMode && adaptiveMode !== 'typing' ? adaptiveMode : assignment.game_mode

  return (
    <GameClient
      cards={cards}
      gameMode={effectiveGameMode}
      assignmentId={assignment.id}
      packName={(assignment.packs as { name: string })?.name || 'Pack'}
      timerConfig={{
        timeLimitMinutes: assignmentStatus.timeLimitMinutes,
        startedAt: assignmentStatus.timerStartedAt,
        deadlineAt: getAssignmentDeadline(assignmentStatus),
      }}
    />
  )
}
