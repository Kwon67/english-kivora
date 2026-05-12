import { Target, CheckCircle2, Headphones, Mic, Zap } from 'lucide-react'
import { DecoGlobe } from '@/components/shared/DecorativeSvgs'

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
}

export default function DailyQuestsWidget({ quests }: { quests: Quest[] }) {
  if (quests.length === 0) return null

  return (
    <section className="relative space-y-4">
      <DecoGlobe className="absolute -top-1 right-0 w-8 h-8 opacity-40" />
      <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Missões Diárias</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <article key={quest.id} className="stitch-panel relative overflow-hidden p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-[var(--color-primary)]" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-bold text-[var(--color-text)]">
                {meta.label}
              </h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-container-high)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <div className="absolute inset-0 bg-[var(--color-primary)]/5 pointer-events-none" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
