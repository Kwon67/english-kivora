import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  type LucideIcon,
  Layers,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import type { AdaptiveCoachPlan } from '@/lib/adaptiveCoach'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

const PLAN_ICON_MAP: Record<AdaptiveCoachPlan['mode'], LucideIcon> = {
  stabilize: Layers,
  clearance: ShieldAlert,
  precision: Target,
  advance: TrendingUp,
  maintenance: Brain,
}

export default function AdaptiveCoachPanel({ plan }: { plan: AdaptiveCoachPlan }) {
  const Icon = PLAN_ICON_MAP[plan.mode]

  return (
    <aside className="surface-hero p-8 animate-slide-up" style={{ animationDelay: '140ms' }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">Adaptive coach</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">{plan.title}</h2>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </div>
      </div>

      <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-muted)]">{plan.summary}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="badge border border-[var(--color-border)] bg-white/78 text-[var(--color-text-muted)]">
          {plan.trackLabel}
        </span>
        <span className="badge border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.08)] text-[var(--color-primary)]">
          Intensidade {plan.intensityLabel}
        </span>
        <span className="badge border border-[rgba(17,32,51,0.08)] bg-white/78 text-[var(--color-text-muted)]">
          {plan.estimatedMinutes} min
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="surface-muted p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Foco
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{plan.focusLabel}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{plan.focusValue}</p>
        </div>
        <div className="surface-muted p-4 sm:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Leitura do coach
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{plan.detail}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {plan.signalPills.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-[var(--color-border)] bg-white/76 px-3 py-1.5 text-xs font-semibold text-[var(--color-text-muted)]"
          >
            {signal}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Reward nudge
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{plan.rewardNudge}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={plan.primaryAction.href} transitionTypes={navForwardTransitionTypes} className="btn-primary w-full sm:w-auto">
          {plan.primaryAction.label}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        {plan.secondaryAction && (
          <Link href={plan.secondaryAction.href} transitionTypes={navForwardTransitionTypes} className="btn-ghost w-full sm:w-auto">
            {plan.secondaryAction.label}
          </Link>
        )}
      </div>
    </aside>
  )
}
