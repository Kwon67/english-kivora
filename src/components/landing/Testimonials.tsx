import { Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Marina Lopes',
    level: 'Do A2 ao B1',
    initials: 'ML',
    tone: 'from-emerald-100 to-sky-100 text-emerald-900',
    text: 'Em 3 meses já consigo assistir séries com menos dependência de legenda. O progresso diário me ajudou a manter constância.',
  },
  {
    name: 'Rafael Nunes',
    level: 'Conversação B2',
    initials: 'RN',
    tone: 'from-blue-100 to-amber-100 text-blue-900',
    text: 'Eu sempre travava para falar. As atividades curtas de speaking deixaram a prática mais leve e eu passei a responder com mais segurança.',
  },
  {
    name: 'Beatriz Souza',
    level: 'Vocabulário profissional',
    initials: 'BS',
    tone: 'from-amber-100 to-emerald-100 text-amber-900',
    text: 'Usei a trilha para entrevistas e reuniões. O acompanhamento mostrou exatamente quais temas eu precisava revisar antes de avançar.',
  },
]

export default function Testimonials() {
  return (
    <section id="depoimentos" className="bg-[var(--color-bg)] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-normal text-[var(--color-primary)]">Depoimentos</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-normal text-[var(--color-text)] sm:text-4xl">
            Histórias realistas de quem criou rotina.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--color-text-muted)]">
            Estes depoimentos são exemplos fictícios para demonstrar o tipo de resultado que a plataforma busca apoiar.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
              <Quote className="h-8 w-8 text-[var(--color-primary)]" strokeWidth={2.2} />
              <p className="mt-5 min-h-32 leading-7 text-[var(--color-text-muted)]">
                <span aria-hidden="true">&ldquo;</span>
                {testimonial.text}
                <span aria-hidden="true">&rdquo;</span>
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--color-border)] pt-5">
                <div
                  aria-label={`Foto placeholder de ${testimonial.name}`}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.tone} text-sm font-extrabold`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <h3 className="font-bold tracking-normal text-[var(--color-text)]">{testimonial.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[var(--color-text-subtle)]">{testimonial.level}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
