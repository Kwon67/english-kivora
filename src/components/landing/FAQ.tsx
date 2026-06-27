const questions = [
  {
    question: 'Preciso saber meu nível antes de começar?',
    answer:
      'Não. Você pode começar com conteúdos compatíveis com seu momento e ajustar a trilha conforme percebe facilidade ou dificuldade.',
  },
  {
    question: 'Que habilidades consigo praticar?',
    answer:
      'A plataforma reúne vocabulário, leitura, digitação, listening e speaking em diferentes formatos de exercício.',
  },
  {
    question: 'Como funciona a revisão espaçada?',
    answer:
      'Os conteúdos que precisam de reforço voltam para a fila de revisão. Assim, você não depende apenas de repetir tudo na mesma frequência.',
  },
  {
    question: 'Consigo usar no celular?',
    answer:
      'Sim. O Kivora é responsivo e pode ser instalado como aplicativo em dispositivos compatíveis, mantendo uma experiência próxima à de um app.',
  },
  {
    question: 'O que são o Blitz e o tutor com IA?',
    answer:
      'O Blitz oferece rodadas rápidas com pontuação e modos variados. O tutor permite praticar conversas e receber apoio contextual com voz e IA.',
  },
  {
    question: 'Preciso informar cartão para criar a conta?',
    answer:
      'Não. O cadastro inicial não exige cartão de crédito.',
  },
]

export default function FAQ() {
  return (
    <section id="duvidas" className="scroll-mt-20 border-t border-border-muted/14 bg-transparent py-16 dark:border-border-accent/16 sm:py-20 lg:py-24">
      <div className="mx-auto grid w-full max-w-[var(--page-width)] gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <div className="max-w-xl">
          <p className="inline-flex rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">
            Dúvidas frequentes
          </p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-text dark:text-text sm:text-4xl">
            O essencial antes de começar.
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-muted dark:text-text-muted">
            Entenda como a prática funciona e escolha seu primeiro passo com clareza.
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((item) => (
            <details
              key={item.question}
              className="scroll-fade group rounded-[18px] border border-border-muted/18 bg-[#f7f8ef] px-5 py-4 shadow-[0_8px_24px_rgba(31,43,18,0.07)] dark:border-border-accent/18 dark:bg-card dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-text marker:content-none">
                {item.question}
                <span aria-hidden="true" className="text-xl text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-3xl pr-8 leading-7 text-text-muted dark:text-text-muted">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
