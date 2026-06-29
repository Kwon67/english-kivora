import { Bot, Gamepad2, Swords, TimerReset } from 'lucide-react'
import Card from '@/components/ui/Card'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

const items = [
  {
    icon: Gamepad2,
    title: '7 Modos de Jogo',
    description: 'Flashcard, Arena, Fill-in-blank, Listening, Speaking, Story e Blitz para variar a prática.',
  },
  {
    icon: Bot,
    title: 'AI Tutor Pessoal',
    description: 'Converse em inglês, receba correções em tempo real e mantenha seu progresso salvo.',
  },
  {
    icon: TimerReset,
    title: 'Revisão Espaçada (SRS)',
    description: 'Um algoritmo identifica quando você vai esquecer e antecipa a prática certa.',
  },
  {
    icon: Swords,
    title: 'Arena: Duelos ao Vivo',
    description: 'Desafie outros alunos, suba no ranking, ganhe XP e transforme constância em jogo.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-5xl" stagger>
        <SectionBadge label="Como funciona" />
        <h2 className="mt-8 text-center font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Uma plataforma, todos os modos
        </h2>
        <div className="mt-10 overflow-hidden rounded-2xl border border-brand-border bg-bg-card">
          {items.map((item) => {
            const Icon = item.icon

            return (
              <Card key={item.title} className="grid gap-5 rounded-none border-0 border-b border-brand-border bg-transparent last:border-b-0 sm:grid-cols-[64px_1fr]">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-border bg-bg-primary">
                  <Icon className="h-6 w-6 text-brand-dark" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-brand-dark">{item.title}</h3>
                  <p className="mt-2 leading-7 text-brand-secondary">{item.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
      </RevealOnScroll>
    </section>
  )
}
