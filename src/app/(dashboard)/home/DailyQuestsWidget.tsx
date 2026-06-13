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
      <DecoGlobe className="absolute -top-1 right-0 h-8 w-8 opacity-20" />
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
          Consistência
        </p>
        <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Missões Diárias</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = Math.min(100, (quest.progress / quest.target) * 100)

          return (
            <article key={quest.id} className="render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-5 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] ring-1 ring-[#172113]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-[#183b16] dark:text-[#b8ff5c]" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">
                {meta.label}
              </h3>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#5a664e] dark:text-[#9ea98b]">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-[#172113]/18 bg-[#eef3d6] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/8">
                  <div
                    className="h-full rounded-full bg-[#183b16] transition-all duration-500 dark:bg-[#b8ff5c]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {isCompleted && (
                <div className="pointer-events-none absolute inset-0 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5" />
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
