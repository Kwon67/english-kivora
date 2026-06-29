import { Target, CheckCircle2, Flame, Headphones, Mic, Zap } from 'lucide-react'
import { DecoGlobe } from '@/components/ui/DecorativeSvgs'
import SectionBadge from '@/components/ui/SectionBadge'

interface Quest {
  id: string
  quest_type: string
  target: number
  progress: number
  status: string
}

const QUEST_META: Record<string, { label: string; icon: typeof Target }> = {
  any_session: { label: 'Completar qualquer lição', icon: Target },
  listening_game: { label: 'Praticar no modo Escuta', icon: Headphones },
  speaking_game: { label: 'Praticar no modo Fala', icon: Mic },
  perfect_accuracy: { label: 'Conseguir precisão perfeita', icon: Zap },
  blitz_session: { label: 'Jogar uma partida de Blitz', icon: Zap },
  blitz_combo: { label: 'Atingir combo no Blitz', icon: Flame },
}

export default function DailyQuestsWidget({ quests }: { quests: Quest[] }) {
  if (quests.length === 0) return null

  return (
    <section className="content-visibility-section relative space-y-4">
      <DecoGlobe className="absolute -top-1 right-0 h-8 w-8 opacity-20" />
      <div>
        <SectionBadge label="Consistência" />
        <h2 className="mt-3 font-heading text-2xl font-bold text-brand-dark">Missões Diárias</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <article key={quest.id} className="render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card p-5 shadow-[5px_5px_0_var(--color-brand-dark)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-brand-dark" />
                )}
              </div>

              <h3 className="mt-4 font-body text-sm font-semibold text-brand-dark">
                {meta.label}
              </h3>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-border">
                  <div
                    className="h-full rounded-full bg-brand-dark transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <div className="pointer-events-none absolute inset-0 bg-brand-accent/10" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
