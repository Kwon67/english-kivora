import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="border-t border-border-muted/14 bg-transparent py-24 dark:border-border-accent/16 dark:bg-transparent">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="rounded-[24px] border border-border-muted/20 bg-[#F4F1EA] px-6 py-12 shadow-[0_18px_48px_rgba(28, 25, 21,0.12)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)] sm:px-10">
        <h2 className="text-4xl font-bold tracking-normal text-text dark:text-text sm:text-5xl">
          Transforme alguns minutos por dia em prática consistente.
        </h2>
        <p className="mx-auto mt-4 text-lg font-normal leading-8 text-text-muted dark:text-text-muted">
          Crie sua conta, escolha um conteúdo e deixe o Kivora organizar prática, revisão e progresso.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-bold text-on-primary shadow-[0_16px_34px_rgba(28, 25, 21,0.22)] transition-colors hover:bg-primary-dark"
          >
            Criar conta gratuita
          </Link>
        </div>
        <p className="mt-5 text-center text-sm text-text-subtle dark:text-text-subtle">Sem cartão de crédito. Comece em minutos.</p>
        </div>
      </div>
    </section>
  )
}
