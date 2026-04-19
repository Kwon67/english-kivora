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
      bar: 'bg-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    }
  }

  if (accent === 'amber') {
    return {
      bar: 'bg-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    }
  }

  return {
    bar: 'bg-slate-600',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
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
    <article className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-emerald-500/20 hover:border-emerald-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 border border-slate-100">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900">{mission.title}</p>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">
              {mission.description}
            </p>
          </div>
        </div>
        <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${accent.badge}`}>
          +{mission.rewardPoints}
        </span>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Progresso
        </p>
        <p className="text-xs font-bold text-slate-700">
          {Math.min(mission.current, mission.target)}/{mission.target} {mission.unitLabel}
        </p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100 border border-slate-50">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${accent.bar}`} style={{ width: `${progress}%` }} />
      </div>

      <p className="mt-4 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
        {mission.completed ? 'Recompensa liberada' : `${progress}% do objetivo concluído`}
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
    <section className="space-y-6 animate-slide-up" style={{ animationDelay: '120ms' }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-2">
        <div>
          <p className="section-kicker">Mission board</p>
          <h2 className="mt-4 text-3xl font-bold text-slate-900 tracking-tight">
            Metas diárias e semanais
          </h2>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
          {state.totalRewardPoints} pts destravados
        </div>
      </div>

      {showPulse && (
        <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4">Pulse atualizado</div>
              <h3 className="text-3xl font-bold text-white leading-tight">
                {state.dailyBundleUnlocked || state.weeklyBundleUnlocked
                  ? 'Recompensa liberada!'
                  : 'Sessão registrada com sucesso.'}
              </h3>
              <p className="mt-3 text-slate-400 font-medium leading-relaxed">
                {state.dailyBundleUnlocked || state.weeklyBundleUnlocked
                  ? [
                      state.dailyBundleUnlocked ? state.dailyBundleLabel : null,
                      state.weeklyBundleUnlocked ? state.weeklyBundleLabel : null,
                    ]
                      .filter(Boolean)
                      .join(' e ')
                  : `${state.completedDaily}/${state.totalDaily} missões diárias e ${state.completedWeekly}/${state.totalWeekly} semanais fechadas.`}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Sparkles className="h-8 w-8" strokeWidth={2} />
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Tier atual</p>
                <p className="mt-1 text-xl font-black text-white">{state.rewardTier}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-2">
            <h3 className="text-xl font-bold text-slate-800">Hoje</h3>
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-400">
              {state.completedDaily}/{state.totalDaily} completas
            </span>
          </div>
          <div className="grid gap-4">
            {state.daily.map((mission) => (
              <MissionCardView key={mission.id} mission={mission} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:ring-2 hover:ring-indigo-500/20 hover:border-indigo-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Trophy className="h-7 w-7" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Reward pulse</p>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Recompensas</h3>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pontos totais</p>
              <p className="mt-2 text-4xl font-black text-slate-900 tracking-tighter">{state.totalRewardPoints}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nível atual</p>
              <p className="mt-2 text-xl font-black text-slate-900 uppercase">{state.rewardTier}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bônus diário</p>
              <p className="mt-2 text-xs font-bold text-slate-700 leading-tight">
                {state.dailyBundleUnlocked ? state.dailyBundleLabel : 'Em progresso'}
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bônus semanal</p>
              <p className="mt-2 text-xs font-bold text-slate-700 leading-tight">
                {state.weeklyBundleUnlocked ? state.weeklyBundleLabel : 'Em progresso'}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <div className="flex items-center gap-3 text-sm font-bold text-indigo-900">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2.5} />
              </div>
              Sistema de Recompensas
            </div>
            <p className="mt-3 text-sm leading-relaxed text-indigo-700/80 font-medium">
              Missões concluídas geram {state.missionPoints} pontos e bônus ativos somam mais {state.bonusPoints}.
            </p>
          </div>

          {state.nextTierLabel && state.nextTierRemaining !== null && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Próximo objetivo</p>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">
                Faltam {state.nextTierRemaining} pontos para atingir o tier <span className="font-black text-slate-900">{state.nextTierLabel}</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 px-2">
          <h3 className="text-xl font-bold text-slate-800">Semana</h3>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white border border-slate-100 text-slate-400">
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
