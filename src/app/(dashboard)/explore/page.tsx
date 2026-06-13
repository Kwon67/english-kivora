import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Layers3, BookMarked } from 'lucide-react'
import { subscribeToPack } from '@/app/actions'
import { groupPacksByFolder } from '@/features/cards/lib/packFolders'
import SkillTree from './SkillTree'
import ExploreHeader from './ExploreHeader'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
  category: string | null
}

const packArtwork = [
  '/images/home/undraw-studying.svg',
  '/images/home/undraw-online-learning.svg',
  '/images/arena/undraw-game-day.svg',
  '/images/home/undraw-learning-to-sketch.svg',
  '/images/home/undraw-sharing-knowledge.svg',
]

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'
const neutralBadge =
  'inline-flex items-center rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2] dark:bg-[#11160e] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4] shadow-sm'
const accentBadge =
  'inline-flex items-center rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#183b16] dark:text-[#b8ff5c] shadow-sm'

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all public packs (including legacy packs where is_public might be null)
  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url, category')
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
  const folderCount = groupPacksByFolder(typedPacks).length

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
    <div className="home-mobile-optimized explorar-root relative -mx-4 -my-6 overflow-hidden bg-[#f4f5e8] px-4 py-6 pb-12 text-[#10130f] sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-[#f4f7e9]">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <ExploreHeader featuredPack={featuredPack} />

        {/* Statistics section */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-[#183b16]/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-[#b8ff5c]/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Catálogo</p>
                <p className="mt-3 text-3xl font-black text-[#10130f] dark:text-[#f4f7e9] leading-none">{typedPacks.length}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#425039] dark:text-[#b9c3a4]">
              {folderCount} {folderCount === 1 ? 'pasta' : 'pastas'} com pacotes públicos para estudo.
            </p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-[#183b16]/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-[#b8ff5c]/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Inscritos</p>
                <p className="mt-3 text-3xl font-black text-[#183b16] dark:text-[#b8ff5c] leading-none">{subscribedCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#425039] dark:text-[#b9c3a4]">Adicionados à sua rotina de treinamento.</p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-[#183b16]/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-[#b8ff5c]/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Iniciante</p>
                <p className="mt-3 text-3xl font-black text-[#10130f] dark:text-[#f4f7e9] leading-none">{beginnerCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#425039] dark:text-[#b9c3a4]">Treinos ideais para nível A1 e A2.</p>
          </article>
        </section>

        {/* Catálogo Section */}
        <section id="packs" className="space-y-6 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={softKicker}>Catálogo</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-[#10130f] dark:text-[#f4f7e9]">Progresso por Pasta</h2>
              <p className="mt-2 max-w-xl text-sm text-[#425039] dark:text-[#b9c3a4]">
                Cada pacote pertence a uma pasta de estudo. Navegue pelas coleções e avance no seu ritmo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={accentBadge}>
                {folderCount} {folderCount === 1 ? 'pasta' : 'pastas'}
              </span>
              <span className={neutralBadge}>
                {intermediateCount} pacotes B1-B2 ou acima
              </span>
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
    </div>
  )
}
