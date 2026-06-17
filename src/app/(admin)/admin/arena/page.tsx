import { createAdminClient, createClient } from '@/lib/supabase/server'
import ArenaDashboardClient from '@/features/arena/components/ArenaDashboardClient'

export const dynamic = 'force-dynamic'

export default async function ArenaAdminPage() {
  const supabase = createAdminClient() ?? await createClient()

  const { data: packs } = await supabase.from('packs').select('*').order('name')
  const { data: profiles } = await supabase.from('profiles').select('*').order('username')

  if (!packs || !profiles) {
    return <div>Erro ao carregar dados.</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Modo Arena</h1>
          <p className="mt-1 text-sm text-text-muted">
            Gerencie duelos em tempo real entre membros do programa.
          </p>
        </div>
      </section>

      <ArenaDashboardClient packs={packs} profiles={profiles} />
    </div>
  )
}
