import { notFound, redirect } from 'next/navigation'
import {
  CEFR_LEVEL_LABELS,
  getCefrLevelWeight,
  isLearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  EXAM_PASS_RATIO,
  EXAM_QUESTION_COUNT,
  getExamCooldownMinutes,
  getNextCurriculumLevel,
} from '@/features/curriculum/lib/curriculum'
import { getCurriculumState } from '@/features/curriculum/lib/curriculumState'
import LevelExamClient from '@/features/curriculum/components/LevelExamClient'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { createClient } from '@/lib/supabase/server'
import { homeShellBelowContentClass } from '@/lib/homeStyles'

export const dynamic = 'force-dynamic'

export default async function LevelExamPage({ params }: { params: Promise<{ level: string }> }) {
  const { level } = await params
  if (!isLearnerCefrLevel(level)) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await getCurriculumState(user.id)

  // Prova de um nível à frente do atual não existe: o caminho é passar na do nível atual primeiro.
  if (getCefrLevelWeight(level) > getCefrLevelWeight(state.currentLevel)) redirect('/home#trilha')

  const [{ data: packs }, { data: assignments }] = await Promise.all([
    supabase.from('packs').select('id').eq('is_public', true).eq('level', level),
    supabase.from('assignments').select('pack_id,status').eq('user_id', user.id),
  ])

  const levelPackIds = new Set((packs || []).map((pack) => pack.id))
  const donePackIds = new Set(
    (assignments || [])
      .filter((row) => row.pack_id && levelPackIds.has(row.pack_id) && isAssignmentCompleted(row.status))
      .map((row) => row.pack_id as string)
  )

  const passed = state.passed.get(level) ?? null

  return (
    <>
      <StudyBreadcrumb
        items={[{ label: 'Trilha', href: '/home#trilha' }, { label: `Prova final do ${level}` }]}
        className="mb-4 px-1"
      />
      <div className={`${homeShellBelowContentClass} min-h-[calc(100svh-5rem)]`}>
        <div className="relative z-10 mx-auto w-full max-w-2xl pb-12">
          <LevelExamClient
            level={level}
            levelLabel={CEFR_LEVEL_LABELS[level]}
            nextLevel={getNextCurriculumLevel(level)}
            totalPacks={levelPackIds.size}
            donePacks={donePackIds.size}
            questionCount={EXAM_QUESTION_COUNT}
            passMark={Math.ceil(EXAM_QUESTION_COUNT * EXAM_PASS_RATIO)}
            cooldownMinutes={getExamCooldownMinutes(state.lastFailedAt)}
            passedResult={passed ? { score: passed.score, total: passed.total } : null}
          />
        </div>
      </div>
    </>
  )
}
