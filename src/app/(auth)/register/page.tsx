import type { Metadata } from 'next'
import Link from 'next/link'
import RegisterFormClient from '@/components/auth/RegisterFormClient'
import FlightPaths from '@/components/landing/FlightPaths'

export const metadata: Metadata = {
  title: 'Criar conta | Kivora English',
  description: 'Crie sua conta gratuita no Kivora English para começar sua rotina de estudos.',
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-surface p-4 text-start text-base font-normal leading-6 text-text select-none dark:bg-[#050704] dark:text-text md:items-center md:p-8">
      
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      {/* Decorative flight-path background */}
      <FlightPaths />

      {/* Responsive unified container card - Styled EXACTLY like the reference image */}
      <div
        className="animate-fade-slide-up relative z-10 flex w-full max-w-[440px] flex-col items-stretch justify-start overflow-hidden rounded-[32px] border border-border-muted/20 bg-card p-6 pt-16 text-start text-base font-normal leading-6 tracking-normal text-text opacity-100 shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-border-accent/20 dark:bg-card dark:text-text dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)] sm:p-8 sm:pt-20"
      >
        {/* Top left circular Close Button */}
        <Link
          href="/"
          className="absolute left-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-surface bg-primary/8 text-text-muted dark:text-text-muted hover:bg-hero-lime hover:bg-primary/16 transition-colors"
          aria-label="Voltar para a página inicial"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        {/* Header styling matching the image: left-aligned */}
        <div className="flex flex-col justify-start items-start mb-6">
          <h1 className="font-montserrat text-[28px] font-bold leading-9 tracking-tight text-text dark:text-text">
            Criar conta
          </h1>
          <p className="font-inter text-sm leading-6 text-text-muted dark:text-text-muted mt-1.5">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>

        {/* Register Form */}
        <div className="w-full">
          <RegisterFormClient />
        </div>
      </div>
    </div>
  )
}
