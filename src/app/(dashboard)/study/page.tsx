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
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12'

export default async function StudyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = getAppDateString()
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id,packs(name,description)')
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

  const totalCount = routineAssignments.length
  const completedCount = routineAssignments.filter((a) => isAssignmentCompleted(a.status)).length
  const pendingCount = totalCount - completedCount

  return (
    <div className="home-mobile-optimized rotina-root relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-text">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <StudyHeader activityCount={totalCount} pendingCount={pendingCount} />

        <section className="grid gap-4 sm:grid-cols-3">
          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Total</p>
                <p className="mt-3 text-3xl font-black text-text dark:text-text leading-none">{totalCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">
              {totalCount === 1 ? 'Atividade na rotina de hoje.' : 'Atividades na rotina de hoje.'}
            </p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Pendentes</p>
                <p className="mt-3 text-3xl font-black text-primary leading-none">{pendingCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">
              Sessões prontas para começar agora.
            </p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Concluídas</p>
                <p className="mt-3 text-3xl font-black text-text dark:text-text leading-none">{completedCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">
              Treinos finalizados na rotina de hoje.
            </p>
          </article>
        </section>

        <section id="atividades" className="space-y-6 pt-2">
          <div>
            <p className={softKicker}>Atividades</p>
            <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">
              O que estudar hoje
            </h2>
            <p className="mt-2 max-w-xl text-sm text-text-muted dark:text-text-muted">
              Cada card é uma sessão da sua rotina. Comece pelo que estiver pendente ou revise um treino concluído.
            </p>
          </div>

          <MyStudyRoutine assignments={routineAssignments} />
        </section>
      </div>
    </div>
  )
}