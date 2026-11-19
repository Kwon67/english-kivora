import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAVerification from '@/features/auth/components/MFAVerification'
import AuthShell from '@/components/auth/AuthShell'

import { readMfaState } from '@/features/auth/lib/readMfaState'
import { studyReturnPath } from '@/features/auth/lib/studyReturnPath'

export default async function MFAPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const destination = studyReturnPath((await searchParams).next)
  const supabase = await createClient()
  const mfa = await readMfaState(() => supabase.auth.mfa.listFactors())
  if (mfa.status === 'signed-out') redirect('/login')
  if (mfa.status === 'unavailable') {
    return <AuthShell eyebrow="ACESSO SEGURO" title="Verifique seu acesso" description="O serviço de autenticação está temporariamente indisponível.">
      <a className="product-text-link" href={destination ? '/login/mfa?next=' + encodeURIComponent(destination) : '/login/mfa'}>Tentar verificar novamente</a>
    </AuthShell>
  }
  if (mfa.status !== 'required') redirect(destination ?? '/home')

  return (
    <AuthShell
      eyebrow="ACESSO SEGURO"
      title="Verifique seu acesso"
      description="Digite o código do seu aplicativo autenticador."


    >
      <MFAVerification factorId={mfa.factorId} destination={destination ?? '/home'} />
    </AuthShell>
  )
}
