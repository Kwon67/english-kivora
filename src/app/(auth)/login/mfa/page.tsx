import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAVerification from '@/features/auth/components/MFAVerification'
import AuthShell from '@/components/auth/AuthShell'

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

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
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
    { data: { user: null } },
  ).catch(() => ({ data: { user: null } }))
  const user = userResponse?.data?.user

  if (!user) {
    redirect('/login')
  }

  const factorsResponse = await withTimeout<FactorsResponse>(
    supabase.auth.mfa.listFactors(),
    3000,
    { data: { all: [] }, error: null },
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
    <AuthShell
      eyebrow="ACESSO SEGURO"
      title="Verifique seu acesso"
      description="Digite o código do seu aplicativo autenticador."


    >
      <MFAVerification factorId={factor.id} />
    </AuthShell>
  )
}
