import { Target, CheckCircle2, Flame, Headphones, Mic, Zap } from 'lucide-react'
import { DecoGlobe } from '@/components/ui/DecorativeSvgs'

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
        <p className="inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">
          Consistência
        </p>
        <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">Missões Diárias</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <article key={quest.id} className="render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-5 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary ring-1 ring-border-muted/18 bg-primary/12 dark:ring-border-accent/18">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-bold text-text dark:text-text">
                {meta.label}
              </h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-text-subtle dark:text-text-subtle">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-border-muted/18 bg-primary-light dark:border-border-accent/18 dark:bg-primary/8">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <div className="pointer-events-none absolute inset-0 bg-primary/5" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
