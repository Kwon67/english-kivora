import type { Metadata } from 'next'
import { KeyRound, X } from 'lucide-react'
import Link from 'next/link'
import ForgotPasswordFormClient from '@/components/auth/ForgotPasswordFormClient'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingFrostedSubtle, landingFrostedSurface, landingHeroCardClass, landingRadiusLg } from '@/lib/landingStyles'

export const metadata: Metadata = {
  title: 'Recuperar senha | Kivora English',
  description: 'Receba um link de recuperação de senha para voltar ao Kivora English.',
}

export default function ForgotPasswordPage() {
  return (
    <main className="landing-light relative min-h-screen overflow-hidden bg-bg-primary px-4 py-8 font-body text-brand-dark sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[12%] top-28 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute right-[18%] top-44 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute bottom-24 left-[24%] h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className={`grid w-full lg:grid-cols-[0.9fr_1.1fr] ${landingHeroCardClass} ${landingFrostedSurface}`}>
          <div className="col-span-full flex items-center justify-between gap-3 border-b border-brand-dark px-5 py-3">
            <MacTrafficLights />
            <MacWindowControlButtons />
          </div>

          <div className="hidden border-r border-brand-dark p-8 lg:flex lg:flex-col lg:justify-between">
            <Link href="/" className="font-heading text-xl font-bold text-brand-dark">
              Kivora English
            </Link>
            <div className={`my-12 ${landingRadiusLg} ${landingFrostedSubtle} border border-brand-dark p-6`}>
              <div className={`flex h-16 w-16 items-center justify-center ${landingRadiusLg} border border-brand-dark bg-brand-accent`}>
                <KeyRound className="h-8 w-8 text-brand-dark" aria-hidden="true" />
              </div>
              <h2 className="mt-8 font-section text-3xl font-semibold leading-[1.1] text-brand-dark">
                Recupere seu acesso em minutos
              </h2>
              <p className="mt-4 text-base leading-7 text-brand-secondary">
                Enviamos um link seguro para o seu email. Sua sequência, seu XP e suas revisões continuam esperando.
              </p>
            </div>
            <div className={`${landingRadiusLg} ${landingFrostedSubtle} border border-brand-dark p-5`}>
              <p className="font-heading text-sm font-bold text-brand-dark">Não recebeu o link?</p>
              <p className="mt-2 text-sm leading-6 text-brand-secondary">
                Confira a caixa de spam e confirme se o email é o mesmo usado no cadastro.
              </p>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <Link
              href="/"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-control border border-brand-dark bg-brand-accent text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
              aria-label="Voltar para a página inicial"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>

            <div className="pr-14">
              <SectionBadge label="Recuperação" animate={false} />
              <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
                Recuperar senha
              </h1>
              <p className="mt-4 text-sm leading-6 text-brand-secondary sm:text-base">
                Lembrou sua senha?{' '}
                <Link href="/login" className="font-bold text-brand-dark underline underline-offset-4">
                  Entrar
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <ForgotPasswordFormClient />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
