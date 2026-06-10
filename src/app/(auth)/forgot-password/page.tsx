import type { Metadata } from 'next'
import Link from 'next/link'
import LoginIllustration from '@/features/auth/components/LoginIllustration'
import ForgotPasswordFormClient from '@/components/auth/ForgotPasswordFormClient'

export const metadata: Metadata = {
  title: 'Recuperar senha | Kivora English',
  description: 'Receba um link de recuperação de senha para voltar ao Kivora English.',
}

export default function ForgotPasswordPage() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-zinc-50 p-4 text-start text-base font-normal leading-6 text-text select-none md:items-center md:p-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,#065f46_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="animate-float-1 absolute -top-[10%] left-[5%] h-[300px] w-[300px] rounded-full bg-emerald-500/12 blur-[85px]" />
        <div className="animate-float-2 absolute -bottom-[10%] right-[5%] h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[95px]" />
      </div>

      <div
        className="animate-fade-slide-up relative z-10 flex h-auto min-h-0 w-full flex-col items-stretch justify-start overflow-hidden rounded-[32px] bg-white text-start text-base font-normal leading-6 tracking-normal text-text opacity-100 md:mx-0 md:h-[620px] md:min-h-0 md:w-full md:max-w-[850px] md:flex-row md:rounded-[32px] md:p-0"
        style={{
          background: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 32px 64px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div className="relative flex h-[150px] w-full items-center justify-center overflow-hidden md:hidden">
          <div className="absolute left-1/2 top-[-58px] h-[529px] w-[384px] -translate-x-1/2 scale-[0.52] origin-top shrink-0 sm:scale-[0.6]">
            <LoginIllustration />
          </div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden border-r border-zinc-200/40 bg-gradient-to-b from-emerald-50/20 to-transparent md:flex">
          <div className="relative h-[529px] w-[384px] origin-center scale-[0.9] lg:scale-100">
            <LoginIllustration />
          </div>
        </div>

        <div className="flex w-full flex-1 flex-col justify-between p-6 md:w-[460px] md:flex-none md:shrink-0 md:p-8">
          <div className="my-auto flex w-full flex-col items-start justify-center">
            <div className="flex self-stretch flex-col items-start justify-start pb-6">
              <div className="flex self-stretch flex-col items-center justify-start gap-1">
                <h1 className="text-center font-montserrat text-2xl font-bold leading-8 text-zinc-900">
                  Recuperar senha
                </h1>
                <p className="max-w-xs text-center font-inter text-sm leading-6 text-zinc-500">
                  Informe seu email para receber um link de recuperação.
                </p>
              </div>
            </div>

            <div className="w-full self-stretch">
              <ForgotPasswordFormClient />
            </div>
          </div>

          <p className="mt-6 text-center text-xs font-medium leading-5 text-zinc-500">
            Lembrou sua senha?{' '}
            <Link href="/login" className="font-bold text-[var(--color-primary)] hover:underline">
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
