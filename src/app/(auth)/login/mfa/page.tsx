import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAVerification from '@/components/auth/MFAVerification'
import BrandMark from '@/components/shared/BrandMark'

export default async function MFAPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the MFA factor ID
  const { data: factors, error } = await supabase.auth.mfa.listFactors()
  
  if (error || !factors || factors.all.length === 0) {
    // If no factors, but somehow they got here, redirect to home (or enrollment)
    redirect('/home')
  }

  const factor = factors.all.find(f => f.status === 'verified')
  
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
