import { BookOpenCheck, Brain, ChartNoAxesCombined, Laptop, ShieldCheck, Volume2 } from 'lucide-react'

const features = [
  {
    icon: BookOpenCheck,
    title: 'Aulas estruturadas por nível',
    description: 'Conteúdo organizado para A1, A2, B1, B2 e níveis avançados, com foco no próximo passo.',
  },
  {
    icon: Brain,
    title: 'Exercícios interativos',
    description: 'Flashcards, múltipla escolha, digitação, escuta e fala para treinar habilidades diferentes.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Acompanhamento de progresso',
    description: 'Indicadores de sequência, revisão e desempenho para você saber onde está evoluindo.',
  },
  {
    icon: ShieldCheck,
    title: 'Plataforma segura e confiável',
    description: 'Autenticação protegida, sessão segura e infraestrutura preparada para o estudo diário.',
  },
  {
    icon: Laptop,
    title: 'Disponível em qualquer dispositivo',
    description: 'Use no computador, tablet ou celular com uma interface responsiva e rápida.',
  },
  {
    icon: Volume2,
    title: 'Treino de listening e speaking',
    description: 'Pratique compreensão oral, pronúncia e respostas em situações próximas do cotidiano.',
  },
]

export default function Features() {
  return (
    <section id="recursos" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[var(--color-primary)]">Recursos</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-[var(--color-text)] sm:text-4xl">
              Tudo para transformar estudo em prática real.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-text-muted)] lg:justify-self-end">
            A plataforma reúne conteúdo guiado, atividades objetivas e dados de evolução para reduzir a dúvida sobre o que estudar em seguida.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-6 shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-secondary-light)] text-[var(--color-secondary)]">
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-normal text-[var(--color-text)]">{feature.title}</h3>
                <p className="mt-3 leading-7 text-[var(--color-text-muted)]">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
