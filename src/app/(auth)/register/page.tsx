import type { Metadata } from 'next'
import { X } from 'lucide-react'
import Link from 'next/link'
import RegisterFormClient from '@/components/auth/RegisterFormClient'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingCtaCardShadow, landingHeroCardClass , landingRadiusLg} from '@/lib/landingStyles'

export const metadata: Metadata = {
  title: 'Criar conta | Kivora English',
  description: 'Crie sua conta gratuita no Kivora English para começar sua rotina de estudos.',
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const params = await searchParams
  const intentPro = params.plan === 'pro'
  return (
    <main className="landing-light relative min-h-screen overflow-hidden bg-bg-primary px-4 py-8 font-body text-brand-dark sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-[12%] top-28 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute right-[18%] top-44 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute bottom-24 left-[24%] h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <section className={`grid w-full lg:grid-cols-[0.9fr_1.1fr] ${landingHeroCardClass} ${landingCtaCardShadow}`}>
          <div className="col-span-full flex items-center justify-between gap-3 border-b border-brand-dark px-5 py-3">
            <MacTrafficLights />
            <MacWindowControlButtons />
          </div>

          <div className="hidden border-r border-brand-dark p-8 lg:flex lg:flex-col lg:justify-between">
            <Link href="/" className="font-heading text-xl font-bold text-brand-dark">
              Kivora English
            </Link>
            <div className={`my-12 ${landingRadiusLg} border border-brand-dark bg-bg-primary p-6`}>
              <div className={`flex h-16 w-16 items-center justify-center ${landingRadiusLg} border border-brand-dark bg-brand-accent`}>
                <svg viewBox="0 0 48 48" aria-hidden="true" className="h-11 w-11 text-brand-dark" fill="none">
                  <path
                    d="M14 31.5c-2.8-2.2-4.4-5.3-4.4-8.7 0-6.5 6.3-11.8 14.1-11.8 7.9 0 14.3 5.3 14.3 11.8 0 6.6-6.4 11.9-14.3 11.9-1.4 0-2.8-.2-4.1-.5L13 37l1-5.5Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.4"
                  />
                  <path d="M18.4 23.1h.1M24 23.1h.1M29.6 23.1h.1" stroke="currentColor" strokeLinecap="round" strokeWidth="3.6" />
                  <path d="M18.8 17.6c2.9-2.2 7.5-2.2 10.4 0M20.8 28.6c2 1.4 4.4 1.4 6.4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" />
                </svg>
              </div>
              <h2 className="mt-8 font-section text-3xl font-semibold leading-[1.1] text-brand-dark">
                Comece sua jornada de inglês com IA
              </h2>
              <p className="mt-4 text-base leading-7 text-brand-secondary">
                Crie sua conta gratuita, ganhe XP nas primeiras missões e acompanhe sua evolução com dados.
              </p>
            </div>
            <div className={`${landingRadiusLg} border border-brand-dark bg-bg-card p-5`}>
              <p className="font-heading text-sm font-bold text-brand-dark">O que vem depois?</p>
              <p className="mt-2 text-sm leading-6 text-brand-secondary">
                Você confirma o email e acessa flashcards, tutor com IA, revisão espaçada e desafios.
              </p>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <Link
              href="/"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-[13px] border border-brand-dark bg-brand-accent text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
              aria-label="Voltar para a página inicial"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>

            <div className="pr-14">
              <SectionBadge label="Cadastro" animate={false} />
              <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
                Criar conta
              </h1>
              <p className="mt-4 text-sm leading-6 text-brand-secondary sm:text-base">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-bold text-brand-dark underline underline-offset-4">
                  Entrar
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <RegisterFormClient intentPro={intentPro} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
