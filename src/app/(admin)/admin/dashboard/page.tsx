import Link from 'next/link'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  TrendingUp,
  Users,
} from 'lucide-react'
import DeleteAssignmentButton from './DeleteAssignmentButton'
import DeleteMemberButton from './DeleteMemberButton'
import AddMemberModal from './AddMemberModal'
import { createClient } from '@/lib/supabase/server'
import type { Assignment, GameSession, Pack, Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DashboardAssignment = Assignment & {
  packs: Pack
  profiles: Profile
  game_sessions: GameSession[]
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: members } = await supabase.from('profiles').select('*').order('username')

  // Fetch all assignments that have been played or assigned today
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, packs(*), profiles(id, username), game_sessions(*)')
    .order('assigned_date', { ascending: false })
    .limit(200)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentSessions } = await supabase
    .from('game_sessions')
    .select('*, profiles(username, avatar_emoji)')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: false })

  const memberStats =
    members?.map((member: Profile) => {
      const memberAssignments =
        assignments?.filter((assignment: DashboardAssignment) => assignment.user_id === member.id) || []
      const completed = memberAssignments.filter(
        (assignment: DashboardAssignment) => assignment.status === 'completed'
      ).length
      const total = memberAssignments.length

      const memberSessions =
        recentSessions?.filter((session: GameSession & { profiles: Profile }) => session.user_id === member.id) || []
      const totalCorrect = memberSessions.reduce(
        (sum: number, session: GameSession) => sum + session.correct_answers,
        0
      )
      const totalWrong = memberSessions.reduce(
        (sum: number, session: GameSession) => sum + session.wrong_answers,
        0
      )
      const totalAttempts = totalCorrect + totalWrong
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

      return {
        ...member,
        todayCompleted: completed,
        todayTotal: total,
        weekAccuracy: accuracy,
        weekSessions: memberSessions.length,
      }
    }) || []

  // Stats: only today's assignments for summary cards
  const todayAssignments = assignments?.filter((a: DashboardAssignment) => a.assigned_date === today) || []
  const todayCompleted = todayAssignments.filter((a: DashboardAssignment) => a.status === 'completed').length
  const completionRate = todayAssignments.length > 0 ? Math.round((todayCompleted / todayAssignments.length) * 100) : 0
  const totalCorrect = recentSessions?.reduce((sum, session) => sum + session.correct_answers, 0) || 0

  const statCards = [
    {
      label: 'Conclusao hoje',
      value: `${completionRate}%`,
      icon: TrendingUp,
      accent: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
      subtitle: `${todayCompleted} de ${todayAssignments.length} tarefas concluídas`,
    },
    {
      label: 'Cards dominados',
      value: totalCorrect.toLocaleString(),
      icon: BookOpen,
      accent: 'bg-[var(--color-secondary-light)] text-[var(--color-secondary)]',
      subtitle: 'Soma de acertos nos ultimos 7 dias',
    },
    {
      label: 'Membros ativos',
      value: members?.length || 0,
      icon: Users,
      accent: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
      subtitle: 'Base registrada no workspace',
    },
  ]

  // Build display rows: all assignments that are completed OR assigned today
  const displayAssignments = (assignments as DashboardAssignment[] | null)
    ?.filter(a => a.status === 'completed' || a.assigned_date === today)
    .sort((a, b) => {
      // completed first, then by date descending
      if (a.status === 'completed' && b.status !== 'completed') return -1
      if (a.status !== 'completed' && b.status === 'completed') return 1
      return a.assigned_date > b.assigned_date ? -1 : 1
    }) ?? []

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="surface-hero p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Operations overview</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Controle diário do programa de inglês da equipe.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Visão centralizada de atribuições, execução e consistência dos alunos em um painel mais limpo e legível.
            </p>
          </div>

          <div className="rounded-[26px] bg-[linear-gradient(135deg,rgba(17,32,51,0.96),rgba(15,118,110,0.9))] px-5 py-4 text-white shadow-[0_34px_80px_-50px_rgba(17,32,51,0.9)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Hoje</p>
            <p className="mt-2 text-3xl font-semibold">{today}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon

            return (
              <div key={stat.label} className="metric-tile">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-subtle)]">
                      {stat.label}
                    </p>
                    <p className="mt-4 text-4xl font-semibold text-[var(--color-text)]">{stat.value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[18px] ${stat.accent}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{stat.subtitle}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Daily status</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
              Desempenho diario dos alunos
            </h2>
          </div>
          <a
            href="/admin/assign"
            className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
          >
            Atribuir nova tarefa
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-white/72 text-[var(--color-text-muted)]">
              <tr>
                <th className="px-6 py-4 font-semibold">Membro</th>
                <th className="px-6 py-4 font-semibold">Pack</th>
                <th className="px-6 py-4 font-semibold">Modo</th>
                <th className="px-6 py-4 font-semibold text-center">Acertos</th>
                <th className="px-6 py-4 font-semibold text-center">Erros</th>
                <th className="px-6 py-4 font-semibold text-center">Streak</th>
                <th className="px-6 py-4 font-semibold text-center">Concluido em</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Acoes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[var(--color-border)]">
              {displayAssignments.length > 0 ? (
                displayAssignments.map((assignment: DashboardAssignment) => {
                  const isCompleted = assignment.status === 'completed'
                  const session = assignment.game_sessions?.[0]
                  const modeLabelMap: Record<string, string> = {
                    multiple_choice: 'M. Escolha',
                    flashcard: 'Flashcard',
                    typing: 'Digitação',
                    matching: 'Associação',
                  }

                  return (
                    <tr key={assignment.id} className="transition-colors hover:bg-white/72">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                            {assignment.profiles?.username?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <span className="font-semibold text-[var(--color-text)]">{assignment.profiles?.username}</span>
                            <p className="text-xs text-[var(--color-text-subtle)]">{assignment.assigned_date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-muted)]">
                        {assignment.packs?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)]">
                          {modeLabelMap[assignment.game_mode] ?? assignment.game_mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                        {isCompleted && session ? session.correct_answers : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-red-500">
                        {isCompleted && session ? session.wrong_answers : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isCompleted && session ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            <Flame className="h-3.5 w-3.5" strokeWidth={2.2} />
                            {session.max_streak}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-center text-[var(--color-text-muted)]">
                        {isCompleted && session?.completed_at
                          ? new Date(session.completed_at).toLocaleString('pt-BR', {
                              day: '2-digit', month: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {isCompleted
                            ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                            : <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />}
                          {isCompleted ? 'Concluido' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DeleteAssignmentButton assignmentId={assignment.id} />
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-[var(--color-text-muted)]">
                    Nenhuma partida ou tarefa encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== MEMBER MANAGEMENT ===== */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="section-kicker">Team management</p>
            <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">Membros do workspace</h2>
          </div>
          <AddMemberModal />
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {members?.map((member: Profile) => (
            <div key={member.id} className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-white/72 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
              {/* Avatar + name */}
              <Link
                href={`/admin/members/${member.id}`}
                className="flex items-center gap-3 min-w-0 flex-1 group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] font-bold text-[var(--color-text)]">
                  {member.username?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{member.username}</p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{member.email}</p>
                </div>
              </Link>

              {/* Actions row — always visible, wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 pl-[52px] sm:pl-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  member.role === 'admin'
                    ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {member.role}
                </span>
                <Link
                  href={`/admin/members/${member.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] transition-colors hover:bg-white"
                >
                  Ver histórico
                </Link>
                {member.role !== 'admin' && (
                  <DeleteMemberButton userId={member.id} username={member.username || ''} />
                )}
              </div>
            </div>
          ))}


          {(!members || members.length === 0) && (
            <p className="px-6 py-10 text-center text-[var(--color-text-muted)]">Nenhum membro registrado.</p>
          )}
        </div>
      </section>
    </div>
  )
}
