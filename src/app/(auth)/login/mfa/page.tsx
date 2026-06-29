import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { X } from 'lucide-react'
import MFAVerification from '@/features/auth/components/MFAVerification'

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

  // Get the MFA factor ID
  const factorsResponse = await withTimeout<FactorsResponse>(
    supabase.auth.mfa.listFactors(),
    3000,
    { data: { all: [] }, error: null }
  ).catch(() => ({ data: { all: [] }, error: null }))

  const factors = factorsResponse?.data
  const error = factorsResponse?.error
  
  if (error || !factors || factors.all.length === 0) {
    // If no factors, but somehow they got here, redirect to home (or enrollment)
    redirect('/home')
  }

  const factor = factors.all.find((f) => f.status === 'verified')
  
  if (!factor) {
    redirect('/home')
  }

  return (
    <main className="landing-light relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg-primary p-4 font-body text-brand-dark sm:p-8">
      <div className="pointer-events-none absolute left-[12%] top-24 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute right-[18%] top-36 h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />
      <div className="pointer-events-none absolute bottom-24 left-[22%] h-3 w-3 rounded-[3px] border border-brand-dark bg-brand-accent" />

      <div
        className="animate-fade-slide-up relative z-10 flex w-full max-w-[480px] flex-col items-stretch rounded-2xl border border-brand-border bg-bg-card p-6 pt-16 text-start sm:p-8 sm:pt-20"
      >
        <Link
          href="/"
          className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border bg-bg-primary text-brand-dark transition-colors hover:bg-brand-accent"
          aria-label="Voltar para a página inicial"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </Link>

        <div className="mb-6 flex flex-col items-start justify-start">
          <p className="mb-4 inline-flex items-center rounded-full border border-brand-border bg-white px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
            Segurança
          </p>
          <h1 className="font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-4xl">
            Verificação
          </h1>
          <p className="mt-3 font-body text-sm leading-6 text-brand-secondary sm:text-base">
            Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador.
          </p>
        </div>

        <div className="w-full">
          <MFAVerification factorId={factor.id} />
        </div>
      </div>
    </main>
  )
}
