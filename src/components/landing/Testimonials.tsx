import { Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marina Lopes',
    level: 'Do A2 ao B1',
    initials: 'ML',
    tone: 'bg-primary-container text-primary dark:bg-primary/12',
    text: 'Em 3 meses já consigo assistir séries com menos dependência de legenda. O progresso diário me ajudou a manter constância.',
  },
  {
    name: 'Rafael Nunes',
    level: 'Conversação B2',
    initials: 'RN',
    tone: 'bg-primary-light text-text-muted dark:bg-primary/8 dark:text-primary-container',
    text: 'Eu sempre travava para falar. As atividades curtas de speaking deixaram a prática mais leve e eu passei a responder com mais segurança.',
  },
  {
    name: 'Beatriz Souza',
    level: 'Vocabulário profissional',
    initials: 'BS',
    tone: 'bg-[#f2e6b8] text-[#5b4510] dark:bg-[#2a2512] dark:text-[#f4d36b]',
    text: 'Usei a trilha para entrevistas e reuniões. O acompanhamento mostrou exatamente quais temas eu precisava revisar antes de avançar.',
  },
]

export default function Testimonials() {
  return (
    <section id="depoimentos" className="bg-transparent py-16 dark:bg-transparent sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-sm font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12">Depoimentos</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-normal text-text dark:text-text sm:text-4xl">
            Histórias realistas de quem criou rotina.
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-muted dark:text-text-muted">
            Estes depoimentos são exemplos fictícios para demonstrar o tipo de resultado que a plataforma busca apoiar.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] p-6 shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)]">
              <Quote className="h-8 w-8 text-primary" strokeWidth={2.2} />
              <p className="mt-5 min-h-32 leading-7 text-text-muted dark:text-text-muted">
                <span aria-hidden="true">&ldquo;</span>
                {testimonial.text}
                <span aria-hidden="true">&rdquo;</span>
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-dashed border-border-muted/18 pt-5 dark:border-border-accent/18">
                <div
                  aria-label={`Foto placeholder de ${testimonial.name}`}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${testimonial.tone} text-sm font-extrabold`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <h3 className="font-bold tracking-normal text-text dark:text-text">{testimonial.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-text-subtle dark:text-text-subtle">{testimonial.level}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
