import { Target, CheckCircle2, Flame, Headphones, Mic, Zap } from 'lucide-react'
import { DecoGlobe } from '@/components/ui/DecorativeSvgs'
import SectionBadge from '@/components/ui/SectionBadge'
import { homeCardClass, homeSectionTitleClass } from '@/lib/homeStyles'

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
        <h2 className={`mt-3 ${homeSectionTitleClass}`}>Missões Diárias</h2>
      </div>
      <div className="learning-card-grid">
        {quests.map((quest) => {
          const meta = QUEST_META[quest.quest_type] || { label: quest.quest_type.replace('_', ' '), icon: Target }
          const Icon = meta.icon
          const isCompleted = quest.status === 'completed'
          const progressPercent = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0

          return (
            <article key={quest.id} data-tone={isCompleted ? "success" : "achievement"} className={`learning-module-card home-frosted-surface p-5 ${homeCardClass}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="tone-icon" aria-hidden="true">
                  <Icon className="h-5 w-5" />
                </div>
                {isCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-success" aria-label="Missão concluída" />
                )}
              </div>

              <h3 className="mt-4 text-sm font-semibold text-brand-dark">
                {meta.label}
              </h3>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                  <span>Progresso</span>
                  <span>{quest.progress} / {quest.target}</span>
                </div>
                <div className="learning-progress" role="progressbar" aria-label={meta.label} aria-valuenow={Math.round(progressPercent)}>
                  <div
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

            </article>
          )
        })}
      </div>
    </section>
  )
}
