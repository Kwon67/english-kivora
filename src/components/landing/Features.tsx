import { Bot, Brain, ChartNoAxesCombined, Gamepad2, Layers3, Volume2 } from 'lucide-react'

const features = [
  {
    icon: Layers3,
    title: 'Packs e trilhas organizadas',
    description: 'Estude conteúdos por nível e objetivo sem precisar montar sua rotina do zero.',
  },
  {
    icon: Brain,
    title: 'Revisão espaçada',
    description: 'O sistema recupera palavras e frases no momento certo para fortalecer a retenção.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Acompanhamento de progresso',
    description: 'Indicadores de sequência, revisão e desempenho para você saber onde está evoluindo.',
  },
  {
    icon: Gamepad2,
    title: 'Modo Blitz',
    description: 'Rodadas rápidas com modos variados, combos e pontuação para praticar com mais ritmo.',
  },
  {
    icon: Bot,
    title: 'Tutor de voz com IA',
    description: 'Converse, tire dúvidas e receba apoio contextual para praticar respostas em inglês.',
  },
  {
    icon: Volume2,
    title: 'Listening e speaking',
    description: 'Ouça frases, pratique pronúncia e treine respostas próximas de conversas reais.',
  },
]

export default function Features() {
  return (
    <section id="recursos" className="scroll-mt-20 bg-transparent py-16 dark:bg-transparent sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">Recursos</p>
            <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-text dark:text-text sm:text-4xl">
              Tudo para transformar estudo em prática real.
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-text-muted dark:text-text-muted lg:justify-self-end">
            A plataforma reúne conteúdo guiado, atividades objetivas e dados de evolução para reduzir a dúvida sobre o que estudar em seguida.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article
                key={feature.title}
                className="scroll-reveal rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-6 shadow-[0_12px_34px_rgba(31,43,18,0.10)] transition-transform hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(31,43,18,0.13)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12">
                  <Icon className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-xl font-bold tracking-normal text-text dark:text-text">{feature.title}</h3>
                <p className="mt-3 leading-7 text-text-muted dark:text-text-muted">{feature.description}</p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
