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
    <section id="como-funciona" className="scroll-mt-20 bg-transparent py-16 dark:bg-transparent sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">Como funciona</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-text dark:text-text sm:text-4xl">
            Um caminho simples para estudar com consistência.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <article key={step.title} className="rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-6 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12">
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.1em] text-text-subtle dark:text-text-subtle">Passo {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold tracking-normal text-text dark:text-text">{step.title}</h3>
                <p className="mt-3 leading-7 text-text-muted dark:text-text-muted">{step.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
