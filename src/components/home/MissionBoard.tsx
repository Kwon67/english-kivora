import {
  Brain,
  Flame,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import type { MissionCard, MissionState } from '@/lib/missions'

function getMissionAccent(accent: MissionCard['accent']) {
  if (accent === 'green') {
    return {
      bar: 'bg-[linear-gradient(90deg,var(--color-primary),#6ca645)]',
      badge: 'bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)] border-[rgba(43,122,11,0.14)]',
    }
  }

  if (accent === 'amber') {
    return {
      bar: 'bg-[linear-gradient(90deg,#d97706,#f59e0b)]',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
    }
  }

  return {
    bar: 'bg-[linear-gradient(90deg,#1d4ed8,#60a5fa)]',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  }
}

const MISSION_ICON_MAP: Record<string, LucideIcon> = {
  'daily-review-burst': Brain,
  'daily-open-loop': Flame,
  'daily-lesson-lock': ShieldCheck,
  'daily-precision': Target,
  'weekly-consistency': Flame,
  'weekly-mastery': Brain,
  'weekly-sharpness': Trophy,
}

function MissionCardView({ mission }: { mission: MissionCard }) {
  const Icon = MISSION_ICON_MAP[mission.id] || Trophy
  const accent = getMissionAccent(mission.accent)
  const progress = mission.target > 0 ? Math.min(100, Math.round((mission.current / mission.target) * 100)) : 0

  return (
    <article className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[var(--color-surface-container)] text-[var(--color-text)]">
            <Icon className="h-5 w-5" strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text)]">{mission.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {mission.description}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${accent.badge}`}>
          +{mission.rewardPoints}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
          Progresso
        </p>
        <p className="text-sm font-semibold text-[var(--color-text)]">
          {Math.min(mission.current, mission.target)}/{mission.target} {mission.unitLabel}
        </p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-[rgba(17,32,51,0.08)]">
        <div className={`h-full rounded-full transition-all duration-500 ${accent.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <p className="mt-3 text-sm font-semibold text-[var(--color-text-muted)]">
        {mission.completed ? 'Recompensa liberada' : `${progress}% do objetivo concluido`}
      </p>
    </article>
  )
}

export default function MissionBoard({
  state,
  showPulse,
}: {
  state: MissionState
  showPulse: boolean
}) {
  return (
    <section className="space-y-4 animate-slide-up" style={{ animationDelay: '120ms' }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Mission board</p>
          <h2 className="mt-4 text-4xl font-semibold text-[var(--color-text)]">
            Metas diarias e semanais com recompensa.
          </h2>
        </div>
        <div className="rounded-full border border-[var(--color-border)] bg-white/78 px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)]">
          {state.totalRewardPoints} pontos destravados
        </div>
      </div>

      {showPulse && (
        <div className="surface-hero p-6 sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="section-kicker">Pulse atualizado</p>
              <h3 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                {state.dailyBundleUnlocked || state.weeklyBundleUnlocked
                  ? 'Recompensa liberada no retorno.'
                  : 'Sessao registrada e placar das missoes atualizado.'}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {state.dailyBundleUnlocked || state.weeklyBundleUnlocked
                  ? [
                      state.dailyBundleUnlocked ? state.dailyBundleLabel : null,
                      state.weeklyBundleUnlocked ? state.weeklyBundleLabel : null,
                    ]
                      .filter(Boolean)
                      .join(' e ')
                  : `${state.completedDaily}/${state.totalDaily} missoes diarias e ${state.completedWeekly}/${state.totalWeekly} semanais estao fechadas agora.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
                <Sparkles className="h-7 w-7" strokeWidth={1.8} />
              </div>
              <div className="rounded-[22px] border border-[var(--color-border)] bg-white/80 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                  Tier atual
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-text)]">{state.rewardTier}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl font-semibold text-[var(--color-text)]">Hoje</h3>
            <span className="badge border border-[var(--color-border)] bg-white/76 text-[var(--color-text-muted)]">
              {state.completedDaily}/{state.totalDaily} completas
            </span>
          </div>
          <div className="grid gap-4">
            {state.daily.map((mission) => (
              <MissionCardView key={mission.id} mission={mission} />
            ))}
          </div>
        </div>

        <div className="card-glow rounded-[2rem] p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-surface-container)] text-[var(--color-text)]">
              <Trophy className="h-6 w-6" strokeWidth={1.9} />
            </div>
            <div>
              <p className="section-kicker">Reward pulse</p>
              <h3 className="mt-3 text-2xl font-semibold text-[var(--color-text)]">Quadro de recompensas</h3>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Pontos
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{state.totalRewardPoints}</p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Tier
              </p>
              <p className="mt-2 text-xl font-semibold text-[var(--color-text)]">{state.rewardTier}</p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Bonus diario
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                {state.dailyBundleUnlocked ? `${state.dailyBundleLabel} liberado` : 'Ainda trancado'}
              </p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Bonus semanal
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                {state.weeklyBundleUnlocked ? `${state.weeklyBundleLabel} liberado` : 'Ainda trancado'}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[var(--color-border)] bg-white/80 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Sparkles className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={2} />
              Bundle bonus
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              Missoes concluidas geram {state.missionPoints} pontos e bundles ativos somam mais {state.bonusPoints}.
            </p>
          </div>

          {state.nextTierLabel && state.nextTierRemaining !== null && (
            <div className="mt-4 rounded-[1.5rem] border border-[rgba(17,32,51,0.08)] bg-white/76 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Proximo tier
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                Faltam {state.nextTierRemaining} pontos para chegar em <span className="font-semibold text-[var(--color-text)]">{state.nextTierLabel}</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold text-[var(--color-text)]">Semana</h3>
          <span className="badge border border-[var(--color-border)] bg-white/76 text-[var(--color-text-muted)]">
            {state.completedWeekly}/{state.totalWeekly} completas
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {state.weekly.map((mission) => (
            <MissionCardView key={mission.id} mission={mission} />
          ))}
        </div>
      </div>
    </section>
  )
}
