import CefrLevelBadge from '@/features/cefr/components/CefrLevelBadge'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { getUserOnboardingStatus } from '@/features/onboarding/lib/onboardingStatus'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import styles from './Settings.module.css'

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
    <section aria-labelledby="account-progress-title">
      <h2 id="account-progress-title" className={styles.groupLabel}>Seu progresso</h2>
      <dl className={styles.accountSummary}>
        <div>
          <dt>Sequência</dt>
          <dd>{streak} {streak === 1 ? 'dia' : 'dias'}{hasBankedFreeze && <small>Protegida</small>}
            <small>Recorde: {longestStreak} {longestStreak === 1 ? 'dia' : 'dias'}</small>
          </dd>
        </div>
        <div>
          <dt>Meta diária</dt>
          <dd>{dailyGoalMinutes ? `${dailyGoalMinutes} min` : '—'}
            <small>{dailyGoalMinutes ? 'Definida no onboarding.' : 'Ainda não definida.'}</small>
          </dd>
        </div>
        <div>
          <dt>{skippedLevelWithoutAssessment ? 'Nível sugerido' : 'Nível detectado'}</dt>
          <dd><CefrLevelBadge profile={cefrProfile} compact />
            <small>{skippedLevelWithoutAssessment
              ? 'Faça o teste quando quiser.'
              : cefrProfile.nextLevel
                ? `Próximo: ${cefrProfile.nextLevel} (${cefrProfile.progressToNext ?? 0}%)`
                : 'Melhora conforme você pratica.'}</small>
          </dd>
        </div>
      </dl>
    </section>
  )
}
