import Link from 'next/link'
import { redirect } from 'next/navigation'
import StudioHero from '@/components/learning/StudioHero'
import { createClient } from '@/lib/supabase/server'
import { appDateRange, formatAppDate, getAppDateString } from '@/lib/timezone'
import { PLAYABLE_GAME_MODES } from '@/features/review/lib/reviewSchedules'
import { getGameModeOption } from '@/features/game/lib/gameModes'
import { getReviewQueueSummaryForUser } from '@/features/review/lib/reviewQueue'
import { ensureDailyPlanForUser } from '@/features/study/lib/ensureDailyPlan'
import { materializeScheduledReviewReleasesForUser } from '@/app/actions'
import type { MemberTask } from '@/features/study/lib/memberTasks'
import { TODAY_LESSONS } from '@/features/study/lib/todayLesson'
import { TRAVEL_LESSONS } from '@/features/study/lib/travelUnit'
import ContextCompletions from './ContextCompletions'
import HomeNotice from './HomeNotice'
import HomeRealtime from './HomeRealtime'

export const metadata = { title: 'Resumo do dia' }
export const maxDuration = 180

function TaskList({ tasks, today }: { tasks: MemberTask[]; today: string }) {
  return <ul className="divide-y">{tasks.map(task => {
    const future = task.assigned_date > today
    const origin = task.assigned_by === 'admin' ? 'Atribuída a você' : 'Do seu plano'
    return <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm">{origin} · {getGameModeOption(task.game_mode).shortLabel}</p>
        <strong className="break-words">{task.packs?.name ?? 'Atividade de inglês'}</strong>
        {task.assigned_date !== today && <p className="text-sm">{future ? 'Agendada para' : 'Pendente desde'} <time dateTime={task.assigned_date}>{task.assigned_date.split('-').reverse().join('/')}</time></p>}
      </div>
      {!future && <Link className="product-text-link" href={'/play/' + task.id}>Abrir tarefa →</Link>}
    </li>
  })}</ul>
}

export default async function Home() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')
  const now = new Date()
  const today = getAppDateString(now)
  const range = appDateRange(today)!
  const preparation = await Promise.allSettled([
    ensureDailyPlanForUser(user.id, user.user_metadata),
    materializeScheduledReviewReleasesForUser(user.id),
  ])
  const [assignments, sessions, reviews, context] = await Promise.all([
    db.from('assignments').select('id,assigned_date,game_mode,assigned_by,packs(name)')
      .eq('user_id', user.id).in('game_mode', PLAYABLE_GAME_MODES).not('status', 'like', 'completed%')
      .or('assigned_by.eq.admin,assigned_date.eq.' + today).order('assigned_date').order('id'),
    db.from('game_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .gte('completed_at', range.start).lt('completed_at', range.end),
    getReviewQueueSummaryForUser(db as unknown as Parameters<typeof getReviewQueueSummaryForUser>[0], user.id).catch(() => null),
    process.env.CONTEXT_PRACTICE_PERSISTENCE_ENABLED === 'true'
      ? db.from('context_practice_attempts').select('lesson_id').eq('user_id', user.id).gte('completed_at', range.start).lt('completed_at', range.end)
      : Promise.resolve({ data: [], error: null }),
  ])
  const lessons = [...Object.values(TODAY_LESSONS), ...TRAVEL_LESSONS].map(({ id, title }) => ({ id, title }))
  const tasks = (assignments.data ?? []) as unknown as MemberTask[]
  const pending = tasks.filter(task => task.assigned_date <= today)
  const future = tasks.filter(task => task.assigned_date > today)
  return <div className="study-desk mx-auto w-full max-w-4xl">
    <HomeNotice />
    <HomeRealtime />
    <StudioHero title="Resumo do dia" label={formatAppDate(now, { weekday: 'long', day: 'numeric', month: 'long' })} ornament="sun" compact />
    <section className="daily-summary-section" aria-labelledby="feito">
      <h2 id="feito" className="text-xl font-semibold">O que você já fez hoje</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div><dt>Cards revisados</dt><dd className="text-2xl font-semibold break-words">{reviews?.dailyCardsReviewed ?? 'Indisponível'}</dd></div>
        <div><dt>Sessões de jogo concluídas</dt><dd className="text-2xl font-semibold break-words">{sessions.count ?? 'Indisponível'}</dd></div>
      </dl>
      <ContextCompletions key={user.id} userId={user.id} today={today} lessons={lessons} saved={context.data?.map(row => row.lesson_id) ?? null} />
      <Link href={'/history?date=' + today} className="product-text-link mt-4 inline-block">Ver histórico do dia →</Link>
    </section>
    <section id="tarefas" className="daily-summary-section scroll-mt-24" aria-labelledby="falta">
      <h2 id="falta" className="text-xl font-semibold">O que falta para hoje</h2>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
        <p>{reviews ? (reviews.totalDue ? `Cards na próxima rodada: ${reviews.totalDue}` : 'Revisão em dia') : 'Revisão temporariamente indisponível'}</p>
        <Link className="product-text-link" href="/review">Abrir revisão →</Link>
      </div>
      {assignments.error ? <p role="alert">Não foi possível carregar as tarefas.</p>
        : pending.length ? <TaskList tasks={pending} today={today} /> : <p className="py-3">Nenhuma tarefa pendente para hoje.</p>}
      {preparation.some(result => result.status === 'rejected') && <p role="status">Parte da rotina ainda está sendo preparada.</p>}
    </section>
    {future.length > 0 && <section className="daily-summary-section"><h2 className="text-xl font-semibold">Próximas tarefas</h2><TaskList tasks={future} today={today} /></section>}
    <nav aria-label="Praticar no seu ritmo" className="daily-summary-section">
      <h2 className="text-xl font-semibold">Praticar no seu ritmo</h2>
      <div className="mt-4 flex flex-wrap gap-5">
        <Link className="product-text-link" href="/explore">Explorar frases</Link>
        <Link className="product-text-link" href="/add">Adicionar frase</Link>
        <Link className="product-text-link" href="/library">Minha coleção</Link>
        <Link className="product-text-link" href="/practice-context">Prática em contexto</Link>
      </div>
    </nav>
  </div>
}
