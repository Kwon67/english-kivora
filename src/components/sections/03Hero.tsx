import Button from '@/components/ui/Button'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

export default function Hero() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <RevealOnScroll className="mx-auto grid max-w-7xl gap-8 rounded-3xl border border-brand-border bg-bg-card p-6 sm:p-8 lg:grid-cols-[1.02fr_0.98fr] lg:p-12">
        <div className="flex flex-col justify-center">
          <SectionBadge label="Kivora English" />
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold leading-tight text-brand-dark sm:text-5xl lg:text-6xl">
            Aprenda inglês de verdade com IA
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-brand-secondary">
            IA + gamificação + revisão espaçada. Evolua no seu ritmo, prove com dados.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button href="/register">Começar grátis →</Button>
            <a
              href="#contato"
              className="font-heading text-sm font-bold uppercase text-brand-dark underline underline-offset-4"
            >
              Quer saber mais? Fale conosco
            </a>
          </div>
        </div>
        <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-brand-border bg-brand-border">
          <div className="absolute left-7 top-7 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brand-dark bg-brand-accent">
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
              className="h-11 w-11 text-brand-dark"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 31.5c-2.8-2.2-4.4-5.3-4.4-8.7 0-6.5 6.3-11.8 14.1-11.8 7.9 0 14.3 5.3 14.3 11.8 0 6.6-6.4 11.9-14.3 11.9-1.4 0-2.8-.2-4.1-.5L13 37l1-5.5Z"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.4 23.1h.1M24 23.1h.1M29.6 23.1h.1"
                stroke="currentColor"
                strokeWidth="3.6"
                strokeLinecap="round"
              />
              <path
                d="M18.8 17.6c2.9-2.2 7.5-2.2 10.4 0M20.8 28.6c2 1.4 4.4 1.4 6.4 0"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="absolute right-8 top-10 rounded-full border border-brand-dark bg-bg-card px-4 py-2 font-heading text-xs font-bold uppercase">
            XP +120
          </div>
          <div className="absolute bottom-8 left-8 right-8 rounded-2xl border-2 border-brand-dark bg-bg-primary p-5">
            <p className="font-heading text-lg font-bold">AI Tutor</p>
            <p className="mt-2 text-sm leading-6 text-brand-secondary">
              Corrige pronúncia, sugere frases e adapta a próxima missão ao seu nível.
            </p>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  )
}
