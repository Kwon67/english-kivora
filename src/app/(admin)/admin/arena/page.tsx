import { createAdminClient, createClient } from '@/lib/supabase/server'
import { Swords } from 'lucide-react'
import ArenaDashboardClient from './ArenaDashboardClient'

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
      <section className="surface-hero p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-red-100 text-red-600">
            <Swords className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-[var(--color-text)]">
              Modo Arena
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              Desafie dois membros online para um duelo em tempo real de Matching Game.
            </p>
          </div>
        </div>
      </section>

      <ArenaDashboardClient packs={packs} profiles={profiles} />
    </div>
  )
}
