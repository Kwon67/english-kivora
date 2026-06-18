import Link from 'next/link'
import { ArrowLeft, Compass, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { isPlayableAssignmentGameMode } from '@/features/review/lib/reviewSchedules'
import { getAppDateString } from '@/lib/timezone'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import MyStudyRoutine, {
  type StudyRoutineAssignment,
} from '@/features/study/components/MyStudyRoutine'

const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'

export default async function StudyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = getAppDateString()
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id,game_mode,status,assigned_by,assigned_date,packs(name,description)')
    .eq('user_id', user.id)
    .order('assigned_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Study page assignments query failed', { userId: user.id, error })
    throw new Error('Falha ao carregar sua rotina de estudos.')
  }

  const routineAssignments = ((assignments || []) as unknown as StudyRoutineAssignment[])
    .filter((row) => isPlayableAssignmentGameMode(row.game_mode))
    .filter((row) => row.assigned_date >= today || !isAssignmentCompleted(row.status))

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container-low"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">Kivora Inglês</p>
          <p className={softKicker}>Plano de estudos</p>
        </div>
        <Link
          href="/explore"
          transitionTypes={navForwardTransitionTypes}
          className="btn-primary min-h-10 shrink-0"
        >
          <Plus className="h-4 w-4" />
          Adicionar pack
        </Link>
      </div>

      <section className="premium-card relative overflow-hidden p-6 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-montserrat text-3xl font-bold text-text">Minha rotina</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted">
              Escolha o que estudar hoje. Você pode adicionar packs do catálogo e remover apenas os que incluiu.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-surface-container-low px-4 py-2 text-xs font-bold text-text-subtle">
            <Compass className="h-4 w-4 text-primary" />
            {routineAssignments.length} {routineAssignments.length === 1 ? 'atividade' : 'atividades'}
          </div>
        </div>
      </section>

      <MyStudyRoutine assignments={routineAssignments} />
    </div>
  )
}