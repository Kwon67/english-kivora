import { Brain, Headphones, MessageSquareText, Zap } from 'lucide-react'

const practiceFlows = [
  {
    icon: Headphones,
    eyebrow: 'Treino guiado',
    title: 'Pratique a mesma frase de vários jeitos',
    text: 'Passe por flashcards, múltipla escolha, digitação, listening e speaking para trabalhar reconhecimento e produção.',
    tags: ['Flashcards', 'Listening', 'Speaking'],
  },
  {
    icon: Brain,
    eyebrow: 'Memória de longo prazo',
    title: 'Revise mais o que ainda não está firme',
    text: 'A fila de revisão prioriza conteúdos pendentes e palavras problemáticas para concentrar esforço onde ele faz diferença.',
    tags: ['Revisão espaçada', 'Palavras difíceis', 'Retenção'],
  },
  {
    icon: Zap,
    eyebrow: 'Prática dinâmica',
    title: 'Alterne entre desafio rápido e conversa',
    text: 'Use o Blitz para rodadas curtas ou pratique respostas com o tutor de voz quando quiser desenvolver mais espontaneidade.',
    tags: ['Blitz', 'Tutor com IA', 'Combos'],
  },
]

export default function ProductInPractice() {
  return (
    <section id="na-pratica" className="scroll-mt-20 bg-transparent py-16 dark:bg-transparent sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">Na prática</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-text dark:text-text sm:text-4xl">
            Uma rotina que conecta prática, revisão e progresso.
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-muted dark:text-text-muted">
            Cada parte da plataforma tem uma função clara: apresentar conteúdo, testar habilidades e trazer de volta o que precisa ser reforçado.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {practiceFlows.map((flow, index) => {
            const Icon = flow.icon

            return (
              <article key={flow.title} className="scroll-reveal flex min-h-full flex-col rounded-[20px] border border-dashed border-border-muted/22 bg-[#F4F1EA] p-6 shadow-[0_12px_34px_rgba(28, 25, 21,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12">
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-black text-text-subtle">0{index + 1}</span>
                </div>
                <p className="mt-6 text-xs font-black uppercase tracking-[0.12em] text-primary">{flow.eyebrow}</p>
                <h3 className="mt-2 text-xl font-bold tracking-normal text-text dark:text-text">{flow.title}</h3>
                <p className="mt-3 flex-1 leading-7 text-text-muted dark:text-text-muted">{flow.text}</p>
                <div className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-border-muted/18 pt-5 dark:border-border-accent/18">
                  {flow.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary dark:bg-primary/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-[18px] border border-border-muted/18 bg-primary px-5 py-4 text-on-primary dark:border-border-accent/18 dark:bg-[#0b1308]">
          <MessageSquareText className="h-5 w-5 shrink-0 text-on-primary dark:text-[var(--color-on-primary-container)]" />
          <p className="text-sm font-bold text-on-primary dark:text-[var(--color-on-primary-container)]">Você acompanha sequência, desempenho e histórico para saber o que praticar em seguida.</p>
        </div>
      </div>
    </section>
  )
}
