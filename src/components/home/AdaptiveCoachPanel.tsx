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
    <aside className="bg-white border border-slate-100 rounded-[2rem] p-8 md:p-10 editorial-shadow animate-slide-up transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-emerald-500/20 hover:border-emerald-200" style={{ animationDelay: '140ms' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Adaptive coach</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">{plan.title}</h2>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Icon className="h-8 w-8" strokeWidth={2} />
        </div>
      </div>

      <p className="mt-6 text-sm leading-relaxed text-slate-500 font-medium">{plan.summary}</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-400">
          {plan.trackLabel}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700">
          Intensidade {plan.intensityLabel}
        </span>
        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
          {plan.estimatedMinutes} min
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Foco</p>
          <p className="text-sm font-bold text-slate-800">{plan.focusLabel}</p>
          <p className="mt-0.5 text-xs text-slate-500">{plan.focusValue}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 sm:col-span-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Leitura do coach</p>
          <p className="text-sm leading-relaxed text-slate-600 font-medium">{plan.detail}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {plan.signalPills.map((signal) => (
          <span
            key={signal}
            className="text-[10px] font-bold text-slate-500 bg-white border border-slate-100 px-3 py-1.5 rounded-lg"
          >
            {signal}
          </span>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Sparkles className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1.5">Reward nudge</p>
            <p className="text-sm leading-relaxed text-emerald-800 font-medium">{plan.rewardNudge}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={plan.primaryAction.href} transitionTypes={navForwardTransitionTypes} className="btn-primary w-full sm:w-auto px-10">
          {plan.primaryAction.label}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
        {plan.secondaryAction && (
          <Link href={plan.secondaryAction.href} transitionTypes={navForwardTransitionTypes} className="btn-ghost w-full sm:w-auto px-10">
            {plan.secondaryAction.label}
          </Link>
        )}
      </div>
    </aside>
  )
}
