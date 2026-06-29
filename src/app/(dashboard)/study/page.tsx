import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BookMarked, CheckCircle2, Clock3 } from 'lucide-react'
import { filterRoutineAssignments } from '@/features/study/lib/routineAssignments'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getAppDateString } from '@/lib/timezone'
import MyStudyRoutine, {
  type StudyRoutineAssignment,
} from '@/features/study/components/MyStudyRoutine'
import StudyHeader from './StudyHeader'

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)] transition-all duration-300'
const softKicker =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'

function RoutineBadge({ label }: { label: string }) {
  return (
    <div className="flex w-fit items-center">
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className={softKicker}>{label}</span>
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}

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
    <div className="home-mobile-optimized rotina-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <StudyHeader activityCount={totalCount} pendingCount={pendingCount} />

        <section className="grid gap-4 sm:grid-cols-3">
          <article className={`${glassTile} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <RoutineBadge label="Total" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{totalCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">
              {totalCount === 1 ? 'Atividade na rotina de hoje.' : 'Atividades na rotina de hoje.'}
            </p>
          </article>

          <article className={`${glassTile} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <RoutineBadge label="Pendentes" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{pendingCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">
              Sessões prontas para começar agora.
            </p>
          </article>

          <article className={`${glassTile} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <RoutineBadge label="Concluídas" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{completedCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">
              Treinos finalizados na rotina de hoje.
            </p>
          </article>
        </section>

        <section id="atividades" className="space-y-6 pt-2">
          <div>
            <RoutineBadge label="Atividades" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
              O que estudar hoje
            </h2>
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
