import type { Metadata } from 'next'
import Link from 'next/link'
import { landingFrostedSubtle, landingFrostedSurface, landingRadiusLg, landingSurfaceClass } from '@/lib/landingStyles'

export const metadata: Metadata = {
  title: {
    absolute: 'Privacidade | Kivora English',
  },
  description: 'Práticas de privacidade e segurança da Kivora English.',
}

const practices = [
  {
    title: 'Dados de estudo',
    description:
      'Usamos suas respostas, progresso e preferências apenas para personalizar a experiência de aprendizado dentro da plataforma.',
  },
  {
    title: 'IA ética',
    description:
      'Textos, áudios e interações de estudo não são usados para treinar modelos públicos. O objetivo é corrigir, adaptar e melhorar suas sessões.',
  },
  {
    title: 'Controle da conta',
    description:
      'Você pode alterar dados de perfil, revisar preferências e cancelar planos quando quiser pelas configurações da conta.',
  },
  {
    title: 'Segurança',
    description:
      'Mantemos backups do histórico de progresso e restringimos acesso operacional aos dados necessários para suporte e funcionamento do produto.',
  },
]

export default function PrivacyPage() {
  return (
    <main className="landing-light min-h-screen bg-bg-primary px-4 py-10 font-body text-brand-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/#como-funciona" className="font-heading text-sm font-bold text-brand-dark underline underline-offset-4">
          ← Voltar para a landing
        </Link>

        <section className={`mt-8 ${landingSurfaceClass} ${landingFrostedSurface} p-6 sm:p-10`}>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
            Privacidade
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            Suas práticas, seus dados, seu ritmo
          </h1>
          <p className="mt-5 text-lg leading-8 text-brand-secondary">
            Esta página resume como pensamos privacidade no Kivora English. Mantemos a coleta enxuta,
            usamos dados para personalização e protegemos seu histórico de aprendizado por design.
          </p>

          <div className="mt-10 grid gap-4">
            {practices.map((practice) => (
              <article key={practice.title} className={`${landingRadiusLg} ${landingFrostedSubtle} border border-brand-dark p-5`}>
                <h2 className="font-heading text-xl font-bold text-brand-dark">{practice.title}</h2>
                <p className="mt-2 leading-7 text-brand-secondary">{practice.description}</p>
              </article>
            ))}
          </div>

          <div className={`mt-8 ${landingRadiusLg} border border-brand-dark bg-brand-accent p-5 text-brand-dark`}>
            <p className="font-heading text-sm font-bold uppercase">Contato</p>
            <p className="mt-2 leading-7">
              Para dúvidas sobre privacidade, fale com a equipe pela área de contato da landing.
            </p>
            <Link href="/#contato" className="mt-4 inline-block font-heading text-sm font-bold underline underline-offset-4">
              Falar conosco →
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
