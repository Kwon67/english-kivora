import { createClient } from '@/lib/supabase/server'
import HistoryChart from './HistoryChart'
import type { GameSession, Pack } from '@/types/database.types'
import { BarChart3, Check, X, Percent, Flame, BookOpen } from 'lucide-react'

export default async function HistoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: sessions } = await supabase
    .from('game_sessions')
    .select('*, packs(name)')
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(50)

  const chartData =
    sessions?.map((s: GameSession & { packs: Pick<Pack, 'name'> }) => ({
      date: new Date(s.completed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
      }),
      acerto: s.correct_answers + s.wrong_answers > 0 ? Math.round((s.correct_answers / (s.correct_answers + s.wrong_answers)) * 100) : 0,
      pack: s.packs?.name || '',
    })) ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={2} />
          <h1 className="font-bold tracking-tight text-3xl text-[var(--color-text)]">
            Histórico
          </h1>
        </div>
        <p className="mt-1 text-[var(--color-text-muted)] text-sm">Acompanhe sua evolução</p>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
            Evolução de acertos (%)
          </h2>
          <HistoryChart data={chartData.reverse()} />
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] text-left text-[var(--color-text-muted)]">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Pack</th>
                <th className="px-4 py-3 font-medium text-center">
                  <span className="inline-flex items-center gap-1"><Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} /> Certo</span>
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  <span className="inline-flex items-center gap-1"><X className="w-3.5 h-3.5 text-red-500" strokeWidth={2.5} /> Errado</span>
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  <span className="inline-flex items-center gap-1"><Percent className="w-3.5 h-3.5" strokeWidth={2.5} /> Taxa</span>
                </th>
                <th className="px-4 py-3 font-medium text-center">
                  <span className="inline-flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-500" strokeWidth={2.5} /> Streak</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions && sessions.length > 0 ? (
                sessions.map(
                  (
                    session: GameSession & { packs: Pick<Pack, 'name'> },
                    i: number
                  ) => {
                    const total = session.correct_answers + session.wrong_answers
                    const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0

                    return (
                      <tr
                        key={session.id}
                        className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">
                          {new Date(session.completed_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                          {session.packs?.name}
                        </td>
                        <td className="px-4 py-3 text-center text-emerald-600 font-semibold">
                          {session.correct_answers}
                        </td>
                        <td className="px-4 py-3 text-center text-red-500 font-semibold">
                          {session.wrong_answers}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`badge text-xs ${
                              pct >= 80
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : pct >= 50
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[var(--color-primary)]">
                          {session.max_streak}
                        </td>
                      </tr>
                    )
                  }
                )
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                    <div className="mb-3 flex justify-center">
                      <BookOpen className="w-8 h-8 text-[var(--color-text-subtle)]" strokeWidth={1.5} />
                    </div>
                    Nenhuma sessão registrada. Jogue para ver seu histórico!
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
