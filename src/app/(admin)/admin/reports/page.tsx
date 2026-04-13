import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Flame,
  Percent,
  Users,
} from 'lucide-react'
import { isAssignmentCompleted } from '@/lib/assignmentStatus'
import { isPlayableAssignmentGameMode } from '@/lib/reviewSchedules'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import type { Assignment, GameSession, Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AssignmentWithSessions = Assignment & {
  game_sessions: GameSession[]
  profiles: Pick<Profile, 'id' | 'username'>
}

function getLatestSession(sessions: GameSession[] = []) {
  return [...sessions].sort(
    (a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  )[0] ?? null
}

export default async function AdminReportsPage() {
  const supabase = createAdminClient() ?? await createClient()
  const today = getAppDateString()
  const thirtyDaysAgo = shiftAppDate(today, -30)

  const [membersResult, assignmentsResult, sessionsResult] = await Promise.all([
    supabase.from('profiles').select('id, username, role').order('username'),
    supabase
      .from('assignments')
      .select('*, profiles(id, username), game_sessions(*)')
      .gte('assigned_date', thirtyDaysAgo)
      .order('assigned_date', { ascending: false }),
    supabase
      .from('game_sessions')
      .select('*')
      .gte('completed_at', getAppDayStartUtcIso(thirtyDaysAgo))
      .order('completed_at', { ascending: false }),
  ])

  if (membersResult.error || assignmentsResult.error || sessionsResult.error) {
    console.error('Admin reports query failed', {
      membersError: membersResult.error,
      assignmentsError: assignmentsResult.error,
      sessionsError: sessionsResult.error,
    })
    throw new Error('Falha ao carregar os relatórios administrativos.')
  }

  const members = (membersResult.data ?? []).filter((member) => member.role !== 'admin')
  const assignments = ((assignmentsResult.data ?? []) as AssignmentWithSessions[]).filter((assignment) =>
    isPlayableAssignmentGameMode(assignment.game_mode)
  )
  const sessions = sessionsResult.data ?? []

  const todayAssignments = assignments.filter((assignment) => assignment.assigned_date === today)
  const completedToday = todayAssignments.filter((assignment) => isAssignmentCompleted(assignment.status)).length
  const totalCorrect = sessions.reduce((sum, session) => sum + session.correct_answers, 0)
  const totalWrong = sessions.reduce((sum, session) => sum + session.wrong_answers, 0)
  const accuracy = totalCorrect + totalWrong > 0
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
    : 0
  const bestStreak = sessions.reduce((best, session) => Math.max(best, session.max_streak), 0)

  const memberRows = members.map((member) => {
    const memberAssignments = assignments.filter((assignment) => assignment.user_id === member.id)
    const completedAssignments = memberAssignments.filter((assignment) => isAssignmentCompleted(assignment.status))
    const latestSessions = completedAssignments
      .map((assignment) => getLatestSession(assignment.game_sessions ?? []))
      .filter((session): session is GameSession => session !== null)

    const memberCorrect = latestSessions.reduce((sum, session) => sum + session.correct_answers, 0)
    const memberWrong = latestSessions.reduce((sum, session) => sum + session.wrong_answers, 0)
    const memberAccuracy = memberCorrect + memberWrong > 0
      ? Math.round((memberCorrect / (memberCorrect + memberWrong)) * 100)
      : 0

    return {
      id: member.id,
      username: member.username,
      assigned: memberAssignments.length,
      completed: completedAssignments.length,
      sessions: latestSessions.length,
      accuracy: memberAccuracy,
      bestStreak: latestSessions.reduce((best, session) => Math.max(best, session.max_streak), 0),
    }
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="surface-hero p-6 sm:p-8">
        <div className="max-w-3xl">
          <p className="section-kicker">Reports</p>
          <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
            Relatórios consolidados dos últimos 30 dias.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Leitura rápida de volume, conclusão e qualidade das sessões para acompanhar o ritmo da equipe.
          </p>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-4">
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Equipe ativa</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{members.length}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Membros não-admin monitorados</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Conclusão hoje</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">
              {todayAssignments.length > 0 ? Math.round((completedToday / todayAssignments.length) * 100) : 0}%
            </p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{completedToday} de {todayAssignments.length} tarefas</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Precisão média</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{accuracy}%</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{totalCorrect} acertos e {totalWrong} erros</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Melhor streak</p>
            <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{bestStreak}</p>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">Maior sequência nas sessões registradas</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
              <Users className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Tarefas</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{assignments.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Sessões</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">{sessions.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-orange-50 text-orange-500">
              <Flame className="h-6 w-6" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">Sessões concluídas</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--color-text)]">
                {assignments.filter((assignment) => isAssignmentCompleted(assignment.status)).length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-6 py-5">
          <p className="section-kicker">Member report</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Resumo por membro</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Membro</th>
                <th className="px-6 py-4 text-center font-semibold">Atribuídas</th>
                <th className="px-6 py-4 text-center font-semibold">Concluídas</th>
                <th className="px-6 py-4 text-center font-semibold">Sessões</th>
                <th className="px-6 py-4 text-center font-semibold">Precisão</th>
                <th className="px-6 py-4 text-center font-semibold">Melhor streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {memberRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-white/72">
                  <td className="px-6 py-4 font-semibold text-[var(--color-text)]">{row.username}</td>
                  <td className="px-6 py-4 text-center">{row.assigned}</td>
                  <td className="px-6 py-4 text-center">{row.completed}</td>
                  <td className="px-6 py-4 text-center">{row.sessions}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex rounded-full bg-[var(--color-primary-light)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      {row.accuracy}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">{row.bestStreak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Entrega</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Acompanhe quem está convertendo atribuição em sessão concluída sem ficar preso no detalhe operacional.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Percent className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Qualidade</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            A taxa de acerto consolidada ajuda a separar volume de treino de retenção real.
          </p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-[var(--color-primary)]" strokeWidth={1.8} />
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Tendência</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Use este recorte como leitura semanal e mensal do programa, não só como fotografia do dia.
          </p>
        </div>
      </section>
    </div>
  )
}
