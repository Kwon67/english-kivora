import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MFAEnrollment from '@/components/auth/MFAEnrollment'
import { Shield } from 'lucide-react'

export default async function SecuritySettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: factors } = await supabase.auth.mfa.listFactors()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <section>
        <div className="section-kicker">Segurança da Conta</div>
        <h1 className="mt-4 text-4xl font-bold text-[var(--color-text)]">Configurações de Segurança</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Gerencie como você protege sua conta e visualize alertas de segurança recentes.
        </p>
      </section>

      <div className="grid gap-6">
        <div className="premium-card p-8 editorial-shadow">
          <MFAEnrollment initialFactors={factors?.all || []} />
        </div>

        <div className="card p-8 bg-[var(--color-surface-container-low)] border-dashed">
          <div className="flex items-center gap-4 text-[var(--color-text-muted)]">
            <Shield className="w-5 h-5" />
            <div>
              <h3 className="font-bold">Proteção Avançada Kivora</h3>
              <p className="text-xs">
                Sua conta está sendo monitorada contra acessos suspeitos. 
                Bloqueios automáticos por IP e rate-limiting estão ativos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
