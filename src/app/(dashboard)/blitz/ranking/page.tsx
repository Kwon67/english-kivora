import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Trophy } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import BlitzShell from '@/features/blitz/components/BlitzShell'
import { isBlitzTableReady } from '@/features/blitz/lib/blitzTable'
import {
  getUserWeeklyBlitzRank,
  getWeeklyBlitzLeaderboard,
} from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import { blitzHeroArena, blitzPrimaryBtn } from '@/features/blitz/lib/blitzUi'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const podiumLabels = ['Campeão', 'Vice', 'Top 3']

export default async function BlitzRankingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const weeklyStart = shiftAppDate(getAppDateString(), -7)
  const windowStartIso = `${weeklyStart}T00:00:00.000Z`

  const [leaderboard, myRank, scoresReady] = await Promise.all([
    getWeeklyBlitzLeaderboard(supabase, windowStartIso, 50),
    getUserWeeklyBlitzRank(supabase, windowStartIso, user.id),
    isBlitzTableReady(supabase),
  ])

  const averageScore = leaderboard.length
    ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.score, 0) / leaderboard.length)
    : 0

  return (
    <BlitzShell>
      <div className="blitz-overview">
        <StudyBreadcrumb items={[{ label: 'Blitz', href: '/blitz' }, { label: 'Ranking' }]} />
        {!scoresReady && (
          <p className="blitz-notice" role="status">
            Ranking temporariamente indisponível. Você ainda pode jogar.
          </p>
        )}

        <header className={`${blitzHeroArena} blitz-ranking-hero blitz-entry-hero`}>
          <div className="blitz-entry-content">
            <p className="blitz-period">Últimos 7 dias</p>
            <h1>Melhores da semana</h1>
            <p className="blitz-lead">Vale a melhor partida de cada jogador. O combo decide o desempate.</p>
            <Link href="/blitz/play" className={blitzPrimaryBtn} transitionTypes={navBackTransitionTypes}>
              Jogar Blitz <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="blitz-entry-records">
            <dl>
              <div><dt>Participantes no top 50</dt><dd>{leaderboard.length}</dd></div>
              <div><dt>Média de pontos</dt><dd>{averageScore}</dd></div>
            </dl>
          </div>
        </header>

        <section className="blitz-weekly" aria-labelledby="blitz-ranking-title">
          <div className="blitz-section-heading">
            <h2 id="blitz-ranking-title">Classificação</h2>
            <p className="blitz-self-rank">
              <Trophy size={16} aria-hidden="true" />
              {myRank ? `Você: #${myRank.rank} · ${myRank.score} pts` : 'Você ainda não tem posição'}
            </p>
          </div>
          {leaderboard.length > 0 ? (
            <ol className="blitz-standing-list">
              {leaderboard.map((entry, index) => (
                <li key={entry.rank} data-leader={index === 0} data-current={entry.userId === user.id} className="blitz-standing-row">
                  <span className="blitz-standing-place">#{entry.rank}</span>
                  <span className="blitz-standing-name">
                    {entry.userId === user.id ? 'Você' : entry.username}
                    <small>{podiumLabels[index] ? `${podiumLabels[index]} · ` : ''}Combo {entry.maxCombo}</small>
                  </span>
                  <strong className="blitz-standing-score">{entry.score} <small>pts</small></strong>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState
              imageSrc="/images/mindmarket/discovery.png"
              imageAlt="Ilustração de ranking vazio"
              title={scoresReady ? 'Ranking ainda vazio.' : 'Classificação indisponível'}
              description={scoresReady ? 'Seja o primeiro a pontuar no Blitz esta semana.' : 'Os resultados aparecerão quando o ranking voltar.'}
              actionHref="/blitz/play"
              actionLabel="Jogar Blitz"
              variant="compact"
              className="blitz-ranking-empty"
              imageWrapClassName="blitz-ranking-empty-art"
            />
          )}
        </section>
        <Link href="/blitz" className="product-text-link blitz-back-link" transitionTypes={navBackTransitionTypes}>
          Voltar ao Blitz
        </Link>
      </div>
    </BlitzShell>
  )
}
