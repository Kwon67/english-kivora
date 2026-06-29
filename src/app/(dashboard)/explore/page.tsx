import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Layers3, BookMarked } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getNextLearnerLevel } from '@/features/cefr/lib/cefrLevels'
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
  '/images/home/undraw-winners.svg',
  '/images/home/undraw-learning-to-sketch.svg',
  '/images/home/undraw-sharing-knowledge.svg',
]

const cardClass =
  'relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)]'
const iconClass =
  'flex h-10 w-10 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
const neutralBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'
const accentBadge =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark'

function ExploreBadge({ label }: { label: string }) {
  return (
    <div className="flex w-fit items-center">
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className="rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">
        {label}
      </span>
      <span className="h-px w-8 bg-brand-dark/60" />
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}

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

  const catalogLoadFailed = Boolean(packsError)
  if (packsError) {
    console.error('Error fetching public packs:', packsError)
  }

  const today = getAppDateString()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id')
    .eq('user_id', user.id)

  const cefrProfile = await getUserCefrProfile(supabase, user.id, user.user_metadata)
  const nextStepLevel = cefrProfile.nextLevel ?? getNextLearnerLevel(cefrProfile.level) ?? 'B2'

  const subscribedPackIds = new Set(getRoutinePackIds(assignments || [], today))
  const typedPacks = (packs || []) as PackRow[]
  const subscribedCount = typedPacks.filter((pack) => subscribedPackIds.has(pack.id)).length
  const levelCount = groupPacksByLevel(typedPacks).length

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
    <div className="home-mobile-optimized explorar-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
        <ExploreHeader featuredPack={catalogLoadFailed ? undefined : featuredPack} />

        {catalogLoadFailed && (
          <EmptyState
            imageSrc="/images/home/undraw-online-learning.svg"
            imageAlt="Ilustração de erro ao carregar catálogo"
            title="Não foi possível carregar o catálogo."
            description="Houve um problema ao buscar os packs públicos. Atualize a página ou tente novamente em instantes."
            actionHref="/explore"
            actionLabel="Tentar novamente"
            transitionTypes={navForwardTransitionTypes}
            variant="glass"
            className="border-rose-500/25 bg-rose-500/5"
          />
        )}

        {/* Statistics section */}
        <section className="grid gap-4 sm:grid-cols-3">
          <article className={`${cardClass} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <ExploreBadge label="Catálogo" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{typedPacks.length}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Layers3 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">
              {levelCount} {levelCount === 1 ? 'nível' : 'níveis'} de proficiência disponíveis para estudo.
            </p>
          </article>

          <article className={`${cardClass} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <ExploreBadge label="Na rotina" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{subscribedCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">Adicionados à sua rotina de treinamento.</p>
          </article>

          <article className={`${cardClass} scroll-reveal p-5 transition-transform hover:-translate-y-1 group/stat`}>
            <div className="flex items-center justify-between gap-3 relative z-10">
              <div>
                <ExploreBadge label="Iniciante" />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{beginnerCount}</p>
              </div>
              <div className={`${iconClass} group-hover/stat:scale-110 transition-transform duration-300`}>
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">Treinos ideais para nível A1 e A2.</p>
          </article>
        </section>

        {/* Catálogo Section */}
        <section id="packs" className="space-y-6 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <ExploreBadge label="Catálogo" />
              <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Progresso por Nível</h2>
              <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
                Cada pacote pertence a um nível de proficiência. Navegue pelas coleções e avance no seu ritmo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={accentBadge}>
                {levelCount} {levelCount === 1 ? 'nível' : 'níveis'}
              </span>
              <span className={neutralBadge}>
                {intermediateCount} pacotes B1-B2 ou acima
              </span>
            </div>
          </div>

          {catalogLoadFailed ? (
            <p className="font-body text-sm text-brand-secondary">
              O catálogo ficará indisponível até a conexão com o servidor ser restabelecida.
            </p>
          ) : (
            <SkillTree
              packs={typedPacks}
              subscribedPackIds={Array.from(subscribedPackIds)}
              packArtwork={packArtwork}
              recommendedLevel={cefrProfile.level}
              nextStepLevel={nextStepLevel}
              assessing={cefrProfile.assessing}
            />
          )}
        </section>
      </div>
    </div>
  )
}
