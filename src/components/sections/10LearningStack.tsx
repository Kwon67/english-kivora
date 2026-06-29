import { Check, Cpu, Gamepad2, MonitorSmartphone } from 'lucide-react'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

const groups = [
  {
    title: 'Modos de Prática',
    icon: Gamepad2,
    items: ['Flashcard', 'Arena', 'Speaking', 'Listening', 'Story'],
  },
  {
    title: 'Tecnologia',
    icon: Cpu,
    items: ['AI Tutor', 'SRS', 'Gamificação', 'Progresso'],
  },
  {
    title: 'Plataformas',
    icon: MonitorSmartphone,
    items: ['Web', 'Mobile em breve'],
  },
]

export default function LearningStack() {
  return (
    <section id="recursos" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl" stagger>
        <h2 className="text-center font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Nossa Stack de Aprendizado
        </h2>
        <div className="mt-10 overflow-hidden rounded-2xl border border-brand-border bg-bg-card">
          {groups.map((group) => {
            const Icon = group.icon

            return (
              <div key={group.title} className="grid gap-6 border-b border-brand-border p-6 last:border-b-0 md:grid-cols-[260px_1fr]">
                <div className="flex items-center gap-3">
                  <Icon className="h-7 w-7 text-brand-dark" />
                  <h3 className="font-heading text-xl font-bold text-brand-dark">{group.title}</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-border bg-bg-primary">
                        <Check className="h-4 w-4 text-brand-dark" />
                      </span>
                      <span className="font-medium text-brand-dark">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </RevealOnScroll>
    </section>
  )
}
