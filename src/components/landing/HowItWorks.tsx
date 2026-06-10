import { Route, TrendingUp, UserPlus } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Crie sua conta gratuitamente',
    description: 'Entre em poucos minutos e tenha acesso ao ambiente de estudo sem cartão de crédito.',
  },
  {
    icon: Route,
    title: 'Escolha seu nível e trilha',
    description: 'Organize sua jornada por objetivos claros, do vocabulário essencial até conversas avançadas.',
  },
  {
    icon: TrendingUp,
    title: 'Pratique diariamente e evolua',
    description: 'Complete atividades curtas, acompanhe sua evolução e mantenha uma sequência consistente.',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[var(--color-bg)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-normal text-[var(--color-primary)]">Como funciona</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-[var(--color-text)] sm:text-4xl">
            Um caminho simples para estudar com consistência.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <article key={step.title} className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <p className="mt-6 text-sm font-bold text-[var(--color-text-subtle)]">Passo {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold tracking-normal text-[var(--color-text)]">{step.title}</h3>
                <p className="mt-3 leading-7 text-[var(--color-text-muted)]">{step.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
