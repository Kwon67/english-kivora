import { Flame, Snowflake, Target } from 'lucide-react'
import CefrLevelBadge from '@/features/cefr/components/CefrLevelBadge'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getUserOnboardingStatus } from '@/features/onboarding/lib/onboardingStatus'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homePillClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import {
  settingsFrostedSubtle,
  settingsFrostedSurface,
} from '@/features/profile/lib/settingsPageUi'

/**
 * Nível, meta diária e sequência.
 *
 * Isto ficava na página inicial, em um carrossel de três cards. São informações de consulta, não
 * de ação: ninguém abre o app para olhar a própria sequência — abre para estudar. Na Home elas
 * empurravam o plano do dia para baixo da dobra. Aqui elas ficam onde se procura por elas.
 */
export default async function AccountProgress() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const [streakResult, cefrProfile, onboardingStatus] = await Promise.all([
    supabase
      .from('user_streaks')
      .select('current_streak,longest_streak,last_activity_date,streak_frozen_until')
      .eq('user_id', user.id)
      .maybeSingle(),
    getUserCefrProfile(supabase, user.id),
    getUserOnboardingStatus(supabase, user.id),
  ])

  const streakRow = streakResult.data as {
    current_streak: number | null
    longest_streak: number | null
    last_activity_date: string | null
    streak_frozen_until: string | null
  } | null

  const today = getAppDateString(new Date().toISOString())
  const yesterday = shiftAppDate(today, -1)
  const streakStatus =
    streakRow?.last_activity_date === today
      ? 'normal'
      : streakRow?.last_activity_date === yesterday && (streakRow.current_streak ?? 0) > 0
        ? 'risk'
        : 'lost'
  const streak = streakStatus === 'lost' ? 0 : streakRow?.current_streak ?? 0
  const longestStreak = streakRow?.longest_streak ?? streak
  const hasBankedFreeze =
    !!streakRow?.streak_frozen_until && streakRow.streak_frozen_until >= today

  const goal = onboardingStatus.row?.daily_goal_minutes
  const dailyGoalMinutes = goal === 5 || goal === 10 || goal === 15 ? goal : null
  const skippedLevelWithoutAssessment =
    onboardingStatus.row?.level_source === 'skipped' && !cefrProfile.assessing

  return (
    <section className={`${homeCardClass} ${settingsFrostedSurface} p-5 sm:p-6`} aria-labelledby="account-progress-title">
      <div className="flex items-center gap-3">
        <span className={homeIconBox}>
          <Flame className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <h2 id="account-progress-title" className="font-heading text-lg font-bold text-brand-dark">
          Seu progresso
        </h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className={`${homeNestedCardClass} ${settingsFrostedSubtle} p-4`}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={homePillClass}>Sequência</p>
            {hasBankedFreeze ? (
              <span className={`${homeSmallPillClass} gap-1`}>
                <Snowflake className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                Protegida
              </span>
            ) : null}
          </div>
          <p className="mt-3 font-heading text-2xl font-bold leading-tight text-brand-dark">
            {streak} {streak === 1 ? 'dia' : 'dias'}
          </p>
          <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
            Recorde: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}
          </p>
        </article>

        <article className={`${homeNestedCardClass} ${settingsFrostedSubtle} p-4`}>
          <p className={homePillClass}>Meta diária</p>
          <p className="mt-3 flex items-center gap-2 font-heading text-2xl font-bold text-brand-dark">
            <Target className="h-5 w-5 shrink-0" strokeWidth={2.4} />
            {dailyGoalMinutes ? `${dailyGoalMinutes} min` : '—'}
          </p>
          <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
            {dailyGoalMinutes ? 'Por dia, definida no onboarding.' : 'Ainda não definida.'}
          </p>
        </article>

        <article className={`${homeNestedCardClass} ${settingsFrostedSubtle} p-4`}>
          <p className={homePillClass}>
            {skippedLevelWithoutAssessment ? 'Nível sugerido' : 'Nível detectado'}
          </p>
          <div className="mt-3">
            <CefrLevelBadge profile={cefrProfile} compact />
          </div>
          <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
            {skippedLevelWithoutAssessment
              ? 'Faça o teste quando quiser.'
              : cefrProfile.nextLevel
                ? `Próximo: ${cefrProfile.nextLevel} (${cefrProfile.progressToNext ?? 0}%)`
                : 'Melhora conforme você pratica.'}
          </p>
        </article>
      </div>
    </section>
  )
}
