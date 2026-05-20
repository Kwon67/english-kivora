import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Layers3, BookMarked } from 'lucide-react'
import { subscribeToPack } from '@/app/actions'
import SkillTree from './SkillTree'
import ExploreHeader from './ExploreHeader'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

const packArtwork = [
  '/images/home/undraw-studying.svg',
  '/images/home/undraw-online-learning.svg',
  '/images/arena/undraw-game-day.svg',
  '/images/home/undraw-learning-to-sketch.svg',
  '/images/home/undraw-sharing-knowledge.svg',
]

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all public packs (including legacy packs where is_public might be null)
  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url')
    .or('is_public.eq.true,is_public.is.null')
    .order('created_at', { ascending: false })

  if (packsError) {
    console.error('Error fetching public packs:', packsError)
  }

  // Fetch current user assignments to check what they already have
  const { data: assignments } = await supabase
    .from('assignments')
    .select('pack_id, game_mode')
    .eq('user_id', user.id)

  const subscribedPackIds = new Set(assignments?.map((assignment) => assignment.pack_id))
  const typedPacks = (packs || []) as PackRow[]
  const subscribedCount = typedPacks.filter((pack) => subscribedPackIds.has(pack.id)).length
  
  const beginnerCount = typedPacks.filter((pack) => {
    const lvl = (pack.level || '').toUpperCase()
    return lvl.includes('A1') || lvl.includes('A2')
  }).length

  const intermediateCount = typedPacks.filter((pack) => {
    const lvl = (pack.level || '').toUpperCase()
    return lvl.includes('B1') || lvl.includes('B2') || lvl.includes('C1') || lvl.includes('C2')
  }).length
  
  const featuredPack = typedPacks[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-fade-in">
      <ExploreHeader featuredPack={featuredPack} />

      {/* Statistics section with premium designs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="premium-card p-5 hover:scale-[1.01] hover:border-[var(--color-primary)]/20 transition-all duration-300 relative overflow-hidden group/stat">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[var(--color-primary)]/[0.02] rounded-full blur-2xl group-hover/stat:bg-[var(--color-primary)]/[0.04] transition-colors" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              <p className="section-kicker">Catálogo</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-text)] leading-none">{typedPacks.length}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-[var(--color-primary)] group-hover/stat:scale-110 transition-transform duration-300">
              <Layers3 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--color-text-subtle)]">Pacotes públicos disponíveis para estudo.</p>
        </article>

        <article className="premium-card p-5 hover:scale-[1.01] hover:border-[var(--color-primary)]/20 transition-all duration-300 relative overflow-hidden group/stat">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[var(--color-primary)]/[0.02] rounded-full blur-2xl group-hover/stat:bg-[var(--color-primary)]/[0.04] transition-colors" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              <p className="section-kicker">Inscritos</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-primary)] leading-none">{subscribedCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] group-hover/stat:scale-110 transition-transform duration-300">
              <BookMarked className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--color-text-subtle)]">Adicionados à sua rotina de treinamento.</p>
        </article>

        <article className="premium-card p-5 hover:scale-[1.01] hover:border-[var(--color-primary)]/20 transition-all duration-300 relative overflow-hidden group/stat">
          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-[var(--color-primary)]/[0.02] rounded-full blur-2xl group-hover/stat:bg-[var(--color-primary)]/[0.04] transition-colors" />
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div>
              <p className="section-kicker">Iniciante</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-text)] leading-none">{beginnerCount}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-amber-500 group-hover/stat:scale-110 transition-transform duration-300">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-4 text-xs font-semibold text-[var(--color-text-subtle)]">Treinos ideais para nível A1 e A2.</p>
        </article>
      </section>

      {/* Catálogo Section */}
      <section id="packs" className="space-y-6 pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--color-border)]/40 pb-4">
          <div>
            <p className="section-kicker">Catálogo</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-text)]">Progresso de Aprendizado</h2>
          </div>
          <div className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider bg-[var(--color-surface-container)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]/50">
            {intermediateCount} pacotes B1-B2 ou acima
          </div>
        </div>

        <SkillTree
          packs={typedPacks}
          subscribedPackIds={Array.from(subscribedPackIds)}
          packArtwork={packArtwork}
          subscribeAction={async (packId) => {
            'use server'
            await subscribeToPack(packId, 'flashcard')
          }}
        />
      </section>
    </div>
  )
}
