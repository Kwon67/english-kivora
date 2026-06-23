import { redirect } from 'next/navigation'
import DashboardShell from '@/components/layout/DashboardShell'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import ProblemWordsList from '@/features/review/components/ProblemWordsList'
import { glassPanel, glassTile, softKicker } from '@/lib/dashboardUi'
import { createClient } from '@/lib/supabase/server'
import { formatAppDateTime, getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ProblemSession = {
  completed_at: string
  session_errors: Array<{
    id: string
    created_at: string
    card_id: string | null
    cards: {
      english_phrase: string
      portuguese_translation: string
      audio_url?: string | null
    } | null
  }>
}

type ReviewCard = {
  card_id: string
  repetitions: number
  quality: number
  next_review_date: string
  cards: {
    english_phrase: string
    portuguese_translation: string
  } | null
}

export default async function ProblemWordsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const since = shiftAppDate(getAppDateString(), -30)

  const [sessionsResult, reviewsResult] = await Promise.all([
    supabase
      .from('game_sessions')
      .select('completed_at,session_errors(id,created_at,card_id,cards(english_phrase,portuguese_translation,audio_url))')
      .eq('user_id', user.id)
      .gte('completed_at', getAppDayStartUtcIso(since))
      .order('completed_at', { ascending: false })
      .limit(40),
    supabase
      .from('card_reviews')
      .select('card_id,repetitions,quality,next_review_date,cards(english_phrase,portuguese_translation)')
      .eq('user_id', user.id)
      .order('next_review_date', { ascending: true })
      .limit(80),
  ])

  const sessions = (sessionsResult.data as unknown as ProblemSession[] | null) || []
  const reviews = (reviewsResult.data as unknown as ReviewCard[] | null) || []

  const problemMap = new Map<
    string,
    { id: string; en: string; pt: string; count: number; lastSeen: string }
  >()

  for (const session of sessions) {
    for (const error of session.session_errors || []) {
      if (!error.card_id || !error.cards) continue
      const existing = problemMap.get(error.card_id) || {
        id: error.card_id,
        en: error.cards.english_phrase,
        pt: error.cards.portuguese_translation,
        count: 0,
        lastSeen: error.created_at,
      }
      existing.count += 1
      if (new Date(error.created_at).getTime() > new Date(existing.lastSeen).getTime()) {
        existing.lastSeen = error.created_at
      }
      problemMap.set(error.card_id, existing)
    }
  }

  const topProblemWords = [...problemMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)
  const almostMastered = reviews
    .filter((review) => review.cards && review.repetitions >= 2 && review.quality >= 3)
    .slice(0, 4)

  return (
    <DashboardShell maxWidthClass="max-w-3xl">
      <div className="space-y-5 pb-8 animate-fade-in">
        <section className={`${glassPanel} p-6 sm:p-7`}>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Dificuldades' },
            ]}
            className="mb-4"
          />
          <p className={softKicker}>Revisão focada</p>
          <h1 className="mt-3 font-montserrat text-4xl font-extrabold text-text">Dificuldades</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-text-muted">
            Termos que você erra com frequência — pratique para melhorar sua precisão.
          </p>
        </section>

        <section>
          <ProblemWordsList
            words={topProblemWords.map((word) => ({
              ...word,
              lastSeenLabel: formatAppDateTime(word.lastSeen),
            }))}
          />
        </section>

        {almostMastered.length > 0 && (
          <section className={`${glassPanel} p-6 sm:p-7`}>
            <p className={softKicker}>Quase dominadas</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {almostMastered.map((review) => (
                <div key={review.card_id} className={`${glassTile} p-4`}>
                  <p className="text-sm font-bold text-text">{review.cards?.english_phrase}</p>
                  <p className="mt-1 text-sm text-text-muted">{review.cards?.portuguese_translation}</p>
                  <p className="mt-3 text-xs text-text-subtle">
                    Próxima revisão: {formatAppDateTime(review.next_review_date)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  )
}
