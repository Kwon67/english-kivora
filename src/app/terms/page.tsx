import type { Metadata } from 'next'
import Link from 'next/link'
import { landingFrostedSubtle, landingFrostedSurface, landingRadiusLg, landingSurfaceClass } from '@/lib/landingStyles'

export const metadata: Metadata = {
  title: {
    absolute: 'Termos de uso | Kivora English',
  },
  description: 'Termos de uso da Kivora English.',
}

const terms = [
  {
    title: 'Uso da plataforma',
    description:
      'Você pode usar o Kivora English para estudar inglês, praticar com IA, revisar vocabulário e acompanhar seu progresso individual.',
  },
  {
    title: 'Conta e segurança',
    description:
      'Mantenha seus dados de acesso protegidos. Atividades feitas na sua conta são de sua responsabilidade.',
  },
  {
    title: 'Planos e cancelamento',
    description:
      'Recursos gratuitos e pagos podem variar conforme o plano. Assinaturas podem ser canceladas conforme as opções disponíveis na conta.',
  },
  {
    title: 'Conteúdo e IA',
    description:
      'As respostas geradas por IA ajudam na prática e correção, mas devem ser usadas como apoio ao estudo, não como avaliação oficial de proficiência.',
  },
]

export default function TermsPage() {
  return (
    <main className="landing-light min-h-screen bg-bg-primary px-4 py-10 font-body text-brand-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/register" className="font-heading text-sm font-bold text-brand-dark underline underline-offset-4">
          ← Voltar para criar conta
        </Link>

        <section className={`mt-8 ${landingSurfaceClass} ${landingFrostedSurface} p-6 sm:p-10`}>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Termos de uso
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            Regras simples para aprender melhor
          </h1>
          <p className="mt-5 text-lg leading-8 text-brand-secondary">
            Estes termos resumem as condições principais para usar o Kivora English. O objetivo é
            manter a experiência clara, segura e focada em aprendizado.
          </p>

          <div className="mt-10 grid gap-4">
            {terms.map((term) => (
              <article key={term.title} className={`${landingRadiusLg} ${landingFrostedSubtle} border border-brand-dark p-5`}>
                <h2 className="font-heading text-xl font-bold text-brand-dark">{term.title}</h2>
                <p className="mt-2 leading-7 text-brand-secondary">{term.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
