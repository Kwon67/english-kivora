import type { Metadata } from 'next'
import Link from 'next/link'
import LoginIllustration from '@/features/auth/components/LoginIllustration'
import RegisterFormClient from '@/components/auth/RegisterFormClient'

export const metadata: Metadata = {
  title: 'Criar conta | Kivora English',
  description: 'Crie sua conta gratuita no Kivora English para começar sua rotina de estudos.',
}

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f4f5e8] p-4 text-start text-base font-normal leading-6 text-[#10130f] select-none dark:bg-[#050704] dark:text-[#f4f7e9] md:items-center md:p-8">
      
      {/* Background mesh grid - Landing page style */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14] z-0" />

      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)] z-0" />

      {/* Curved dashed lines (flight paths) running behind the card */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden="true">
        <svg className="absolute top-[15%] left-[-10%] w-[120%] h-[35%] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M -5 30 C 30 75, 70 15, 105 45" fill="none" stroke="var(--color-flight-path)" strokeWidth="1.6" strokeDasharray="4 8" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
        </svg>
        <svg className="absolute bottom-[15%] left-[-10%] w-[120%] h-[35%] opacity-70" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 105 35 C 70 80, 30 15, -5 55" fill="none" stroke="var(--color-flight-path)" strokeWidth="1.6" strokeDasharray="4 8" strokeLinecap="round" style={{ vectorEffect: 'non-scaling-stroke' }} />
        </svg>
      </div>

      <div
        className="animate-fade-slide-up relative z-10 flex h-auto min-h-0 w-full flex-col items-stretch justify-start overflow-hidden rounded-[32px] border border-[#172113]/20 bg-[#fbfcf2] text-start text-base font-normal leading-6 tracking-normal text-[#10130f] opacity-100 shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:text-[#f4f7e9] dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)] md:mx-0 md:h-[700px] md:min-h-0 md:w-full md:max-w-[900px] md:flex-row md:rounded-[32px] md:p-0"
      >
        <div className="relative flex h-[150px] w-full items-center justify-center overflow-hidden md:hidden">
          <div className="absolute left-1/2 top-[-58px] h-[529px] w-[384px] -translate-x-1/2 scale-[0.52] origin-top shrink-0 sm:scale-[0.6]">
            <LoginIllustration />
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-[#172113]/14 bg-gradient-to-b from-[#eef3d6]/40 to-transparent dark:border-[#d5e6a9]/14 dark:from-[#1a2513]/40 md:flex">
          <div className="absolute left-8 top-8 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-4 py-2 text-xs font-black uppercase tracking-normal text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]">
            Comece grátis
          </div>
          <div className="relative h-[529px] w-[384px] origin-center scale-[0.92] lg:scale-100">
            <LoginIllustration />
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col justify-between p-6 md:w-[460px] md:flex-none md:shrink-0 md:p-8">
          <div className="my-auto flex w-full flex-col items-start justify-center">
            <div className="flex self-stretch flex-col items-start justify-start pb-6">
              <div className="flex self-stretch flex-col items-center justify-start gap-1">
                <h1 className="text-center font-montserrat text-2xl font-bold leading-8 text-[#10130f] dark:text-[#f4f7e9]">
                  Criar conta
                </h1>
                <p className="text-center font-inter text-sm leading-6 text-[#425039] dark:text-[#b9c3a4]">
                  Comece sua rotina no Kivora English.
                </p>
              </div>
            </div>

            <div className="w-full self-stretch">
              <RegisterFormClient />
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium leading-5 text-[#425039] dark:text-[#b9c3a4]">
            Já tem uma conta?{' '}
            <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
