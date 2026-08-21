import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Shield, X } from 'lucide-react'
import Link from 'next/link'
import MFAVerification from '@/features/auth/components/MFAVerification'
import SectionBadge from '@/components/ui/SectionBadge'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingCtaCardShadow, landingHeroCardClass , landingRadiusLg} from '@/lib/landingStyles'

type MFAFactor = {
  id: string
  status?: string
}

type UserResponse = {
  data: {
    user: unknown | null
  }
}

type FactorsResponse = {
  data: {
    all: MFAFactor[]
  } | null
  error: unknown | null
}

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
}

export default async function MFAPage() {
  const supabase = await createClient()

  const userResponse = await withTimeout<UserResponse>(
    supabase.auth.getUser(),
    4000,
    { data: { user: null } }
  ).catch(() => ({ data: { user: null } }))
  const user = userResponse?.data?.user

  if (!user) {
    redirect('/login')
  }

  const factorsResponse = await withTimeout<FactorsResponse>(
    supabase.auth.mfa.listFactors(),
    3000,
    { data: { all: [] }, error: null }
  ).catch(() => ({ data: { all: [] }, error: null }))

  const factors = factorsResponse?.data
  const error = factorsResponse?.error

  if (error || !factors || factors.all.length === 0) {
    redirect('/home')
  }

  const factor = factors.all.find((f) => f.status === 'verified')

  if (!factor) {
    redirect('/home')
  }

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
                <Shield className="h-8 w-8 text-brand-dark" aria-hidden="true" />
              </div>
              <h2 className="mt-8 font-section text-3xl font-semibold leading-[1.1] text-brand-dark">
                Confirme que é você
              </h2>
              <p className="mt-4 text-base leading-7 text-brand-secondary">
                Sua conta tem verificação em duas etapas. Insira o código do seu autenticador para continuar.
              </p>
            </div>
            <div className={`${landingRadiusLg} border border-brand-dark bg-bg-card p-5`}>
              <p className="font-heading text-sm font-bold text-brand-dark">Dica de segurança</p>
              <p className="mt-2 text-sm leading-6 text-brand-secondary">
                Nunca compartilhe seu código de autenticação com ninguém.
              </p>
            </div>
          </div>

          <div className="relative p-6 sm:p-8 lg:p-10">
            <Link
              href="/login"
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-control border border-brand-dark bg-brand-accent text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
              aria-label="Voltar para o login"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
            </Link>

            <div className="pr-14">
              <SectionBadge label="Segurança" animate={false} />
              <h1 className="mt-6 font-heading text-4xl font-bold leading-[1.1] text-brand-dark sm:text-5xl">
                Verificação
              </h1>
              <p className="mt-4 text-sm leading-6 text-brand-secondary sm:text-base">
                Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
              </p>
            </div>

            <div className="mt-8">
              <MFAVerification factorId={factor.id} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}