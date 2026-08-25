import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sparkles, Layers3, BookMarked, Target } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getNextLearnerLevel } from '@/features/cefr/lib/cefrLevels'
import { getRoutinePackIds } from '@/features/study/lib/routineAssignments'
import { getAppDateString } from '@/lib/timezone'
import SectionBadge from '@/components/ui/SectionBadge'
import SkillTree from './SkillTree'
import ExploreHeader from './ExploreHeader'
import {
  homeIconBox,
  homeMetricCardClass,
  homeSectionTitleClass,
  homeShellClass,
} from '@/lib/homeStyles'
import {
  exploreFrostedSubtle,
  exploreFrostedSurface,
} from '@/features/explore/lib/explorePageUi'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
  category: string | null
}

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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
    <div className={homeShellClass}>
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
            className={`border-rose-500/25 ${exploreFrostedSurface}`}
            imageWrapClassName={exploreFrostedSubtle}
          />
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`${homeMetricCardClass} ${exploreFrostedSurface} md:min-w-0`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionBadge label="Catálogo" animate={false} />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{typedPacks.length}</p>
              </div>
              <div className={`h-10 w-10 ${homeIconBox}`}>
                <Layers3 className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">
              {levelCount} {levelCount === 1 ? 'nível' : 'níveis'} de proficiência disponíveis.
            </p>
          </article>

          <article className={`${homeMetricCardClass} ${exploreFrostedSurface} md:min-w-0`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionBadge label="Na rotina" animate={false} />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{subscribedCount}</p>
              </div>
              <div className={`h-10 w-10 ${homeIconBox}`}>
                <BookMarked className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">Adicionados à sua rotina de treinamento.</p>
          </article>

          <article className={`${homeMetricCardClass} ${exploreFrostedSurface} md:min-w-0`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionBadge label="Iniciante" animate={false} />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{beginnerCount}</p>
              </div>
              <div className={`h-10 w-10 ${homeIconBox}`}>
                <Sparkles className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">Treinos ideais para nível A1 e A2.</p>
          </article>

          <article className={`${homeMetricCardClass} ${exploreFrostedSurface} md:min-w-0`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionBadge label="Avançado" animate={false} />
                <p className="mt-4 font-heading text-3xl font-bold leading-none text-brand-dark">{intermediateCount}</p>
              </div>
              <div className={`h-10 w-10 ${homeIconBox}`}>
                <Target className="h-5 w-5" strokeWidth={2.4} />
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-brand-secondary">Treinos de nível B1 em diante.</p>
          </article>
        </section>

        <section id="packs" className="space-y-6 pt-4">
          <div>
            <SectionBadge label="Catálogo" />
            <h2 className={`mt-3 ${homeSectionTitleClass}`}>Progresso por nível</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Cada pack pertence a um nível de proficiência. Navegue pelas coleções e avance no seu ritmo.
            </p>
          </div>

          {catalogLoadFailed ? (
            <p className="font-body text-sm text-brand-secondary">
              O catálogo ficará indisponível até a conexão com o servidor ser restabelecida.
            </p>
          ) : (
            <SkillTree
              packs={typedPacks}
              subscribedPackIds={Array.from(subscribedPackIds)}
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
