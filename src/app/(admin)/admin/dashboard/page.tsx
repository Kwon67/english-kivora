import { createClient } from '@/lib/supabase/server'
import type { Profile, Assignment, GameSession, Pack } from '@/types/database.types'
import { TrendingUp, BookOpen, Users, CheckCircle2, Clock } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: members } = await supabase
    .from('profiles')
    .select('*')
    .order('username')

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, packs(*), profiles(username, avatar_emoji)')
    .eq('assigned_date', today)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: recentSessions } = await supabase
    .from('game_sessions')
    .select('*, profiles(username, avatar_emoji)')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .order('completed_at', { ascending: false })

  const memberStats = members?.map((member: Profile) => {
    const memberAssignments = assignments?.filter(
      (a: Assignment & { packs: Pack; profiles: Profile }) => a.user_id === member.id
    ) || []
    const completed = memberAssignments.filter(
      (a: Assignment) => a.status === 'completed'
    ).length
    const total = memberAssignments.length

    const memberSessions = recentSessions?.filter(
      (s: GameSession & { profiles: Profile }) => s.user_id === member.id
    ) || []
    const totalCorrect = memberSessions.reduce(
      (acc: number, s: GameSession) => acc + s.correct_answers, 0
    )
    const totalWrong = memberSessions.reduce(
      (acc: number, s: GameSession) => acc + s.wrong_answers, 0
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
  })

  const totalAssignments = memberStats?.reduce((acc, m) => acc + m.todayTotal, 0) || 0
  const completedAssignments = memberStats?.reduce((acc, m) => acc + m.todayCompleted, 0) || 0
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
  const sumCorrect = recentSessions?.reduce((acc, s) => acc + s.correct_answers, 0) || 0

  const statCards = [
    {
      label: 'Conclusão Hoje',
      value: `${completionRate}%`,
      icon: TrendingUp,
      accent: 'text-[var(--color-primary)] bg-[var(--color-primary-light)]',
      hasBar: true,
      barPercent: completionRate,
    },
    {
      label: 'Cards Dominados',
      value: sumCorrect.toLocaleString(),
      icon: BookOpen,
      accent: 'text-blue-600 bg-blue-50',
      subtitle: 'Últimos 7 dias',
    },
    {
      label: 'Membros Ativos',
      value: members?.length || 0,
      icon: Users,
      accent: 'text-amber-600 bg-amber-50',
      subtitle: 'Total registrado',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{stat.label}</span>
                <div className={`w-9 h-9 rounded-xl ${stat.accent} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" strokeWidth={2} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--color-text)] tracking-tight">{stat.value}</div>
              {stat.hasBar && (
                <div className="w-full bg-[var(--color-surface-hover)] h-2 rounded-full overflow-hidden mt-4 border border-[var(--color-border)]">
                  <div className="bg-[var(--color-primary)] h-full rounded-full transition-all duration-1000" style={{ width: `${stat.barPercent}%` }} />
                </div>
              )}
              {stat.subtitle && (
                <div className="mt-3 text-xs text-[var(--color-text-subtle)] font-medium">{stat.subtitle}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Team Daily Status */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h3 className="font-semibold text-[var(--color-text)]">Status Diário da Equipe</h3>
          <a href="/admin/assign" className="text-xs font-medium text-[var(--color-primary)] hover:underline cursor-pointer">Atribuir nova tarefa</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[var(--color-text-muted)] border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
              <tr>
                <th className="font-medium py-3 px-4">Membro</th>
                <th className="font-medium py-3 px-4">Pack</th>
                <th className="font-medium py-3 px-4">Modo</th>
                <th className="font-medium py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {assignments?.map((assignment) => {
                const isCompleted = assignment.status === 'completed'
                return (
                  <tr key={assignment.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                    <td className="py-4 px-4 font-medium text-[var(--color-text)] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">
                        {assignment.profiles?.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      {assignment.profiles?.username}
                    </td>
                    <td className="py-4 px-4 text-[var(--color-text-muted)]">
                      {assignment.packs?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="badge bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-[11px]">
                        {assignment.game_mode}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" strokeWidth={2} />
                        )}
                        <span className={`text-xs font-semibold ${isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {isCompleted ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(!assignments || assignments.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[var(--color-text-muted)] text-sm">
                    Nenhuma tarefa diária atribuída hoje.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
