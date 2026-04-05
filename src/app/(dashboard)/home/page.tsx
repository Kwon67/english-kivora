import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StreakBadge from '@/components/shared/StreakBadge'
import type { Assignment, Pack } from '@/types/database.types'
import { Target, Layers, Keyboard, Puzzle, ArrowRight, CheckCircle2, BookOpen, Clock, Settings } from 'lucide-react'
import MotivationalCarousel from '@/components/shared/MotivationalCarousel'

const gameModeConfig: Record<string, { label: string; icon: typeof Target }> = {
  multiple_choice: { label: 'Múltipla Escolha', icon: Target },
  flashcard: { label: 'Flashcard', icon: Layers },
  typing: { label: 'Digitação', icon: Keyboard },
  matching: { label: 'Combinação', icon: Puzzle },
}

const difficultyConfig: Record<string, { label: string; className: string }> = {
  easy: { label: 'Fácil', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  medium: { label: 'Médio', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  hard: { label: 'Difícil', className: 'bg-red-50 text-red-700 border border-red-200' },
}

async function getStreak(userId: string) {
  const supabase = await createClient()
  const today = new Date()
  let streak = 0

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const { data } = await supabase
      .from('assignments')
      .select('status')
      .eq('user_id', userId)
      .eq('assigned_date', dateStr)
      .eq('status', 'completed')
      .limit(1)

    if (data && data.length > 0) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const { data: assignments } = await supabase
    .from('assignments')
    .select('*, packs(*)')
    .eq('user_id', user.id)
    .or(`assigned_date.gte.${today},status.eq.pending`)
    .order('assigned_date', { ascending: true })
    .order('status', { ascending: false }) // 'pending' comes after 'completed' if string-ordered (p > c), wait. 
    // Status in DB: 'pending', 'completed'. p > c is correct if we want pending first.
    // Actually alphabetically 'pending' > 'completed'. So descending would put pending first? No, p is after c.
    // P (16th letter), C (3rd letter). P > C. Descending: P then C. 
    // Wait, line 72 says: .order('status', { ascending: false })
    // If pending is 'p' and completed is 'c', p > c. Ascending false means p first. Correct.

  const streak = await getStreak(user.id)
  const pendingCount = assignments?.filter((a: Assignment & { packs: Pack }) => a.status !== 'completed').length || 0

  return (
    <div className="space-y-6 sm:space-y-10 pb-20 animate-fade-in px-4 sm:px-0">
      {/* Header */}
      <div className="glass-card p-4 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold tracking-tight text-2xl sm:text-3xl text-[var(--color-text)] mb-1.5">
            Olá, {profile?.username || 'Estudante'}
          </h1>
          <p className="text-sm sm:text-[15px] text-[var(--color-text-muted)] leading-relaxed">
            {pendingCount > 0
              ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'lição pendente' : 'lições pendentes'} hoje.`
              : 'Todas as tarefas de hoje foram concluídas.'}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          {profile?.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="btn-ghost text-[var(--color-primary)] border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] cursor-pointer text-sm sm:text-base"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <StreakBadge count={streak} />
        </div>
      </div>

      {/* Motivational Carousel */}
      <MotivationalCarousel />

      {/* Section title */}
      <div className="flex items-center gap-3">
        <Clock className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Tarefas do Dia</h2>
      </div>

      {/* Tasks */}
      {assignments && assignments.length > 0 ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {assignments.map(
            (
              assignment: Assignment & { packs: Pack },
              index: number
            ) => {
              const mode = gameModeConfig[assignment.game_mode] || gameModeConfig.multiple_choice
              const level = assignment.packs?.level || 'easy'
              const difficulty = difficultyConfig[level] || difficultyConfig.easy
              const Icon = mode.icon
              const isCompleted = assignment.status === 'completed'

              return (
                <div
                  key={assignment.id}
                  className={`glass-card p-4 sm:p-6 flex flex-col justify-between animate-slide-up ${
                    isCompleted ? 'bg-emerald-50/50 border-emerald-200' : ''
                  }`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`badge text-[10px] sm:text-[11px] ${difficulty.className}`}>
                            {difficulty.label}
                          </span>
                          <span className="badge bg-[var(--color-surface-hover)] text-[var(--color-text-muted)] border border-[var(--color-border)] text-[10px] sm:text-[11px]">
                            {mode.label}
                          </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text)] tracking-tight leading-snug">
                          {assignment.packs?.name}
                        </h3>
                        {assignment.packs?.description && (
                          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                            {assignment.packs.description}
                          </p>
                        )}
                      </div>

                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
                        ) : (
                          <Icon className="w-6 h-6" strokeWidth={1.5} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    {!isCompleted ? (
                      <Link
                        href={`/play/${assignment.id}`}
                        className="btn-primary w-full py-3 text-sm cursor-pointer"
                      >
                        Iniciar Treinamento
                        <ArrowRight className="w-4 h-4" strokeWidth={2} />
                      </Link>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 rounded-[var(--radius-lg)] bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
                        <span className="font-semibold text-sm">Concluído</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
          )}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <div className="mb-5 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center">
              <BookOpen className="w-8 h-8" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Tudo pronto por hoje</h2>
          <p className="text-[var(--color-text-muted)] text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            O administrador ainda não atribuiu novas lições.
            Que tal revisitar o que você já aprendeu?
          </p>
          <Link
            href="/history"
            className="btn-ghost cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            Ver Histórico
          </Link>
        </div>
      )}
    </div>
  )
}

// Import needed for empty state
import { BarChart3 } from 'lucide-react'
