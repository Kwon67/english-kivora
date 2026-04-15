import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAssignmentDeadline, parseAssignmentStatus } from '@/lib/assignmentStatus'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createClient } from '@/lib/supabase/server'
import GameClient from './GameClient'

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
    .select('id,pack_id,english_phrase,portuguese_translation,accepted_translations,created_at')
    .eq('pack_id', assignment.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError) {
    console.error('Error fetching cards:', cardsError)
    redirect('/home')
  }
  if (!cards || cards.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="premium-card max-w-xl p-8 text-center sm:p-10">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[30px] bg-red-50 text-red-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          </div>
          <h2 className="text-4xl font-semibold text-[var(--color-text)]">Pacote vazio</h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
            Este pacote ainda não possui cards. Peça para o administrador adicionar conteúdo antes de iniciar a sessão.
          </p>
          <Link href="/home" transitionTypes={navBackTransitionTypes} className="btn-primary mt-7">
            Voltar ao inicio
          </Link>
        </div>
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
