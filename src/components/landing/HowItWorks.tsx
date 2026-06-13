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
    <section id="como-funciona" className="bg-transparent py-16 dark:bg-transparent sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">Como funciona</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-[#10130f] dark:text-[#f4f7e9] sm:text-4xl">
            Um caminho simples para estudar com consistência.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <article key={step.title} className="rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] p-6 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]">
                  <Icon className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <p className="mt-6 text-sm font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">Passo {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold tracking-normal text-[#10130f] dark:text-[#f4f7e9]">{step.title}</h3>
                <p className="mt-3 leading-7 text-[#425039] dark:text-[#b9c3a4]">{step.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
