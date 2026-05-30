import { Target, CheckCircle2, Headphones, Mic, Zap } from 'lucide-react'
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
}

export default function DailyQuestsWidget({ quests }: { quests: Quest[] }) {
  if (quests.length === 0) return null

  return (
    <section className="content-visibility-section relative space-y-4">
      <DecoGlobe className="absolute -top-1 right-0 h-8 w-8 opacity-30" />
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-50/65 px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-emerald-800">
          Consistência
        </p>
        <h2 className="mt-3 font-montserrat text-2xl font-bold text-zinc-900">Missões Diárias</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <article key={quest.id} className="render-contained relative overflow-hidden rounded-[32px] border border-zinc-200/55 bg-white/40 p-5 shadow-[0_22px_64px_rgba(24,32,29,0.10)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50/80 text-emerald-800 ring-1 ring-emerald-900/10">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-emerald-800" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-bold text-zinc-900">
                {meta.label}
              </h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-zinc-200/70 bg-white/45">
                  <div
                    className="h-full rounded-full bg-emerald-800 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <div className="pointer-events-none absolute inset-0 bg-emerald-800/5" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
