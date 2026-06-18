import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Layers3, BookMarked } from 'lucide-react'

import { groupPacksByFolder } from '@/features/cards/lib/packFolders'
import { getRoutinePackIds } from '@/features/study/lib/routineAssignments'
import { getAppDateString } from '@/lib/timezone'
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
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12'
const neutralBadge =
  'inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted shadow-sm'
const accentBadge =
  'inline-flex items-center rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-primary shadow-sm'

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

  const today = getAppDateString()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id')
    .eq('user_id', user.id)

  const subscribedPackIds = new Set(getRoutinePackIds(assignments || [], today))
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
    <div className="home-mobile-optimized explorar-root relative -mx-4 -my-6 overflow-hidden bg-surface px-4 py-6 pb-12 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-text">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <ExploreHeader featuredPack={featuredPack} />

        {/* Statistics section */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Catálogo</p>
                <p className="mt-3 text-3xl font-black text-text dark:text-text leading-none">{typedPacks.length}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">
              {folderCount} {folderCount === 1 ? 'pasta' : 'pastas'} com pacotes públicos para estudo.
            </p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Na rotina</p>
                <p className="mt-3 text-3xl font-black text-primary leading-none">{subscribedCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">Adicionados à sua rotina de treinamento.</p>
          </article>

          <article className={`${glassTile} p-5 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300 relative overflow-hidden group/stat`}>
            <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <p className={softKicker}>Iniciante</p>
                <p className="mt-3 text-3xl font-black text-text dark:text-text leading-none">{beginnerCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-text-muted dark:text-text-muted">Treinos ideais para nível A1 e A2.</p>
          </article>
        </section>

        {/* Catálogo Section */}
        <section id="packs" className="space-y-6 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={softKicker}>Catálogo</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold text-text dark:text-text">Progresso por Pasta</h2>
              <p className="mt-2 max-w-xl text-sm text-text-muted dark:text-text-muted">
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
          />
        </section>
      </div>
    </div>
  )
}
