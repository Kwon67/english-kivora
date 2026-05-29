import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAVerification from '@/features/auth/components/MFAVerification'
import BrandMark from '@/components/ui/BrandMark'

async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timeoutPromise = new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    if (timer.unref) timer.unref()
  })
  return Promise.race([promise, timeoutPromise])
}

export default async function MFAPage() {
  const supabase = await createClient()

  const userResponse = await withTimeout<any>(
    supabase.auth.getUser(),
    4000,
    { data: { user: null } }
  ).catch(() => ({ data: { user: null } }))
  const user = userResponse?.data?.user

  if (!user) {
    redirect('/login')
  }

  // Get the MFA factor ID
  const factorsResponse = await withTimeout<any>(
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

  const factor = factors.all.find((f: any) => f.status === 'verified')
  
  if (!factor) {
    redirect('/home')
  }

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[var(--color-surface-container-lowest)] p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <BrandMark tone="default" />
        </div>
        
        <div className="premium-card p-8 editorial-shadow">
          <MFAVerification factorId={factor.id} />
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Não tem acesso ao seu autenticador? <br/>
          Entre em contato com o administrador.
        </p>
      </div>
    </div>
  )
}
