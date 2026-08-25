import type { LucideIcon } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AlertCircle, AlertTriangle, Brain, CheckCircle2 } from 'lucide-react'
import ProblemWordsList from '@/features/review/components/ProblemWordsList'
import { createClient } from '@/lib/supabase/server'
import { formatAppDateTime, getAppDayStartUtcIso, getAppDateString, shiftAppDate } from '@/lib/timezone'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  getProblemWordSeverity,
  problemWordsPanel,
  problemWordsFrostedSubtle,
  problemWordsSectionTitle,
  problemWordsShell,
  problemWordsTelemetryBand,
  problemWordsTelemetryCell,
} from '@/features/review/lib/problemWordsUi'
import ProblemWordsHeader from './ProblemWordsHeader'
import LeechSection from './LeechSection'
import { getLeechCards } from '@/features/review/lib/leechCards'
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

function TelemetryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string | number
  icon: LucideIcon
}) {
  return (
    <div className={problemWordsTelemetryCell}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-xl font-bold tabular-nums leading-none text-brand-dark sm:text-2xl">{value}</p>
    </div>
  )
}

export default async function ProblemWordsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const since = shiftAppDate(getAppDateString(), -30)

  const [leechCards, [sessionsResult, reviewsResult]] = await Promise.all([
    getLeechCards(supabase as unknown as Parameters<typeof getLeechCards>[0], user.id),
    Promise.all([
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
    ]),
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
  const criticalCount = topProblemWords.filter((word) => getProblemWordSeverity(word.count) === 'CRÍTICO').length
  const mediumCount = topProblemWords.filter((word) => getProblemWordSeverity(word.count) === 'MÉDIO').length
  const almostMastered = reviews
    .filter((review) => review.cards && review.repetitions >= 2 && review.quality >= 3)
    .slice(0, 4)

  return (
    <div className={problemWordsShell}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-3xl space-y-6 pb-12 animate-fade-in sm:space-y-8">
        <ProblemWordsMotionSection>
          <ProblemWordsHeader
            problemCount={topProblemWords.length}
            criticalCount={criticalCount}
          />
        </ProblemWordsMotionSection>

        <ProblemWordsMotionSection className={problemWordsTelemetryBand} stagger>
          <ProblemWordsMotionItem>
            <TelemetryMetric label="Em foco" value={topProblemWords.length} icon={Brain} />
          </ProblemWordsMotionItem>
          <ProblemWordsMotionItem>
            <TelemetryMetric label="Críticos" value={criticalCount} icon={AlertTriangle} />
          </ProblemWordsMotionItem>
          <ProblemWordsMotionItem>
            <TelemetryMetric label="Médios" value={mediumCount} icon={AlertCircle} />
          </ProblemWordsMotionItem>
          <ProblemWordsMotionItem>
            <TelemetryMetric label="Quase OK" value={almostMastered.length} icon={CheckCircle2} />
          </ProblemWordsMotionItem>
        </ProblemWordsMotionSection>

        <ProblemWordsMotionSection>
          <LeechSection cards={leechCards} />
        </ProblemWordsMotionSection>

        <ProblemWordsMotionSection id="termos">
          <div className="mb-4 sm:mb-5">
            <SectionBadge label="Termos críticos" />
            <h2 className={`${problemWordsSectionTitle} mt-3`}>Pratique onde você erra</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Ordenados por frequência de erro nos últimos 30 dias. A barra lateral indica a severidade.
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
          <ProblemWordsMotionSection className={problemWordsPanel} stagger>
            <SectionBadge label="Quase dominadas" />
            <h2 className={`${problemWordsSectionTitle} mt-3`}>Consolidação leve</h2>
            <p className="mt-2 max-w-xl font-body text-sm text-brand-secondary">
              Termos com boa retenção — uma revisão rápida pode fixá-los de vez.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {almostMastered.map((review) => (
                <ProblemWordsMotionItem key={review.card_id}>
                  <div className={`rounded-control border border-brand-dark bg-bg-primary p-4 transition-transform hover:-translate-y-0.5 ${problemWordsFrostedSubtle}`}>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.2} />
                      <div className="min-w-0">
                        <p className="font-heading text-sm font-bold text-brand-dark">{review.cards?.english_phrase}</p>
                        <p className="mt-1 font-body text-sm text-brand-secondary">{review.cards?.portuguese_translation}</p>
                        <p className="mt-3 font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                          Próxima revisão: {formatAppDateTime(review.next_review_date)}
                        </p>
                      </div>
                    </div>
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
