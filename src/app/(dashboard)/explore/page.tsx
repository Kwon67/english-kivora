import { getCurriculumState } from '@/features/curriculum/lib/curriculumState'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmptyState from '@/components/ui/EmptyState'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { getNextLearnerLevel } from '@/features/cefr/lib/cefrLevels'
import { getCurriculumGate } from '@/features/learning/lib/levelGate'
import { getRoutinePackIds } from '@/features/study/lib/routineAssignments'
import { getAppDateString } from '@/lib/timezone'
import SkillTree from './SkillTree'
import ExploreHeader from './ExploreHeader'
import {
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
  curriculum_position: number | null
}

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url, category, curriculum_position')
    .or('is_public.eq.true,is_public.is.null')
    .order('curriculum_position', { ascending: true, nullsFirst: false })

  const catalogLoadFailed = Boolean(packsError)
  if (packsError) {
    console.error('Error fetching public packs:', packsError)
  }

  const today = getAppDateString()

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id')
    .eq('user_id', user.id)

  const curriculumLevel = (await getCurriculumState(user.id)).currentLevel
  const gate = getCurriculumGate(curriculumLevel)

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
      <div className="discovery-catalog relative z-10 mx-auto max-w-4xl space-y-5 pb-6">
        <ExploreHeader hasSearch={!catalogLoadFailed && typedPacks.length > 0} featuredPack={catalogLoadFailed ? undefined : featuredPack} />

        {catalogLoadFailed && (
          <EmptyState
            imageSrc="/images/mindmarket/discovery.png"
            imageAlt="Ilustração de erro ao carregar catálogo"
            title="Não foi possível carregar o catálogo."
            description="Houve um problema ao buscar os packs públicos. Atualize a página ou tente novamente em instantes."
            actionHref="/explore"
            actionLabel="Tentar novamente"
            transitionTypes={navForwardTransitionTypes}
            variant="glass"
            className={`border-error/30 ${exploreFrostedSurface}`}
            imageWrapClassName={exploreFrostedSubtle}
          />
        )}

        <dl className="catalog-summary" aria-label="Resumo do catálogo">
          {[
            { label: 'Packs', value: typedPacks.length },
            { label: 'Na rotina', value: subscribedCount },
            { label: 'Iniciante', value: beginnerCount },
            { label: 'B1 em diante', value: intermediateCount },
          ].map(({ label, value }) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>

        <section id="packs" className="space-y-4">
          <header className="catalog-trail-heading">
            <h2 className={homeSectionTitleClass}>Sua trilha por nível</h2>
            <p>{levelCount} níveis de proficiência disponíveis.</p>
            {gate.stretch && <p>Desafios {gate.stretch} disponíveis no seu nível.</p>}
          </header>

          {catalogLoadFailed ? (
            <p className="font-body text-sm text-brand-secondary">
              O catálogo ficará indisponível até a conexão com o servidor ser restabelecida.
            </p>
          ) : (
            <SkillTree
              packs={typedPacks}
              subscribedPackIds={Array.from(subscribedPackIds)}
              gate={gate}
              recommendedLevel={curriculumLevel}
              nextStepLevel={getNextLearnerLevel(curriculumLevel) ?? curriculumLevel}
              assessing={false}
            />
          )}
        </section>
      </div>
    </div>
  )
}
