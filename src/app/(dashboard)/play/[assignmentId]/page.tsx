import { redirect } from 'next/navigation'
import { homeNoticeRedirect } from '@/lib/homeNotices'
import { getAssignmentDeadline, parseAssignmentStatus } from '@/features/game/lib/assignmentStatus'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
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
    redirect(homeNoticeRedirect('assignment_not_found'))
  }
  if (!assignment) redirect(homeNoticeRedirect('assignment_not_found'))

  // If already completed, redirect
  const assignmentStatus = parseAssignmentStatus(assignment.status)

  if (assignmentStatus.baseStatus === 'completed') {
    console.log(`Assignment ${assignmentId} is already completed. Redirecting...`)
    redirect(homeNoticeRedirect('assignment_completed'))
  }

  // Fetch cards for this pack
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', assignment.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError) {
    console.error('Error fetching cards:', cardsError)
    redirect(homeNoticeRedirect('assignment_error'))
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

  const packName = (assignment.packs as { name: string })?.name || 'Pacote'

  return (
    <div className="space-y-4 pb-4">
      <StudyBreadcrumb
        items={[
          { label: 'Rotina', href: '/study' },
          { label: packName },
          { label: 'Jogando' },
        ]}
        className="px-1"
      />
      <GameClient
        cards={cards}
        gameMode={effectiveGameMode}
        assignmentId={assignment.id}
        packName={packName}
        timerConfig={{
          timeLimitMinutes: assignmentStatus.timeLimitMinutes,
          startedAt: assignmentStatus.timerStartedAt,
          deadlineAt: getAssignmentDeadline(assignmentStatus),
        }}
      />
    </div>
  )
}
