import { redirect } from 'next/navigation'
import ProblemWordsList from '@/features/review/components/ProblemWordsList'
import { createClient } from '@/lib/supabase/server'
import { formatAppDateTime, getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'
import { LibraryBadge } from '@/features/profile/lib/libraryUi'
import ProblemWordsHeader from './ProblemWordsHeader'
import { ProblemWordsMotionItem, ProblemWordsMotionSection } from './ProblemWordsMotion'

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

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[6px_6px_0_var(--color-brand-dark)] transition-all duration-300'
const nestedCardClass =
  'rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[3px_3px_0_var(--color-brand-dark)]'

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
  const criticalCount = topProblemWords.filter((word) => word.count >= 3).length
  const almostMastered = reviews
    .filter((review) => review.cards && review.repetitions >= 2 && review.quality >= 3)
    .slice(0, 4)

  return (
    <div className="home-mobile-optimized dificuldades-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-3xl space-y-8 pb-12 animate-fade-in">
        <ProblemWordsMotionSection>
          <ProblemWordsHeader
            problemCount={topProblemWords.length}
            criticalCount={criticalCount}
            almostMasteredCount={almostMastered.length}
          />
        </ProblemWordsMotionSection>

        <ProblemWordsMotionSection id="termos">
          <div className="mb-4">
            <LibraryBadge label="Termos críticos" />
            <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Pratique onde você erra</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Ordenados por frequência de erro nos últimos 30 dias.
            </p>
          </div>
          <ProblemWordsList
            words={topProblemWords.map((word) => ({
              ...word,
              lastSeenLabel: formatAppDateTime(word.lastSeen),
            }))}
          />
        </ProblemWordsMotionSection>

        {almostMastered.length > 0 && (
          <ProblemWordsMotionSection className={`${glassTile} p-6 sm:p-7`} stagger>
            <LibraryBadge label="Quase dominadas" />
            <p className="mt-4 max-w-xl font-body text-sm text-brand-secondary">
              Termos com boa retenção — uma revisão leve pode consolidá-los de vez.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {almostMastered.map((review) => (
                <ProblemWordsMotionItem key={review.card_id}>
                  <div className={nestedCardClass}>
                    <p className="font-heading text-sm font-bold text-brand-dark">{review.cards?.english_phrase}</p>
                    <p className="mt-1 font-body text-sm text-brand-secondary">{review.cards?.portuguese_translation}</p>
                    <p className="mt-3 font-body text-xs text-brand-secondary">
                      Próxima revisão: {formatAppDateTime(review.next_review_date)}
                    </p>
                  </div>
                </ProblemWordsMotionItem>
              ))}
            </div>
          </ProblemWordsMotionSection>
        )}
      </div>
    </div>
  )
}
