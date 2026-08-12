import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { filterRoutineAssignments } from '@/features/study/lib/routineAssignments'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getAppDateString } from '@/lib/timezone'
import MyStudyRoutine, {
  type StudyRoutineAssignment,
} from '@/features/study/components/MyStudyRoutine'
import SectionBadge from '@/components/ui/SectionBadge'
import StudyHeader from './StudyHeader'
import { studySectionTitle, studyShell } from '@/features/study/lib/studyUi'

export default async function StudyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = getAppDateString()
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id,packs(name,description,category,level)')
    .eq('user_id', user.id)
    .order('assigned_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Study page assignments query failed', { userId: user.id, error })
    throw new Error('Falha ao carregar sua rotina de estudos.')
  }

  const routineAssignments = filterRoutineAssignments(
    ((assignments || []) as unknown as StudyRoutineAssignment[]),
    today
  )

  const routinePackIds = [...new Set(routineAssignments.map((assignment) => assignment.pack_id))]
  const { data: routineCards, error: routineCardsError } = routinePackIds.length > 0
    ? await supabase
        .from('cards')
        .select('pack_id,english_phrase,portuguese_translation,accepted_translations')
        .in('pack_id', routinePackIds)
        .order('created_at', { ascending: true })
    : { data: [], error: null }

  if (routineCardsError) {
    console.error('Study page routine cards query failed', { userId: user.id, error: routineCardsError })
  }

  const cardsByPackId = new Map<string, NonNullable<StudyRoutineAssignment['searchCards']>>()
  for (const card of routineCards || []) {
    const packCards = cardsByPackId.get(card.pack_id) || []
    packCards.push({
      english_phrase: card.english_phrase,
      portuguese_translation: card.portuguese_translation,
      accepted_translations: card.accepted_translations,
    })
    cardsByPackId.set(card.pack_id, packCards)
  }

  const searchableRoutineAssignments = routineAssignments.map((assignment) => ({
    ...assignment,
    searchCards: cardsByPackId.get(assignment.pack_id) || [],
  }))

  const totalCount = routineAssignments.length
  const completedCount = routineAssignments.filter((a) => isAssignmentCompleted(a.status)).length
  const pendingCount = totalCount - completedCount

  return (
    <div className={studyShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-6xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <StudyHeader
          activityCount={totalCount}
          pendingCount={pendingCount}
          completedCount={completedCount}
          nextPendingAssignmentId={routineAssignments.find((assignment) => !isAssignmentCompleted(assignment.status))?.id}
        />

        <section id="atividades" className="space-y-4 sm:space-y-6">
          <div>
            <SectionBadge label="Atividades" />
            <h2 className={`mt-3 ${studySectionTitle}`}>O que estudar hoje</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Cada card é uma sessão da sua rotina. Comece pelo que estiver pendente ou revise um treino concluído.
            </p>
          </div>

          <MyStudyRoutine assignments={searchableRoutineAssignments} />
        </section>
      </div>
    </div>
  )
}
