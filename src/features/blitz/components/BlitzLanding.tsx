'use client'

import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, Flame, Heart, Sparkles, Trophy, Zap } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { BlitzLeaderboardEntry } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import {
  blitzGlassPanel,
  blitzGlassTile,
  blitzKicker,
  blitzNestedRow,
  blitzPrimaryBtn,
  blitzSoftBtn,
} from '@/features/blitz/lib/blitzUi'
import {
  CEFR_LEVEL_LABELS,
  LEARNER_CEFR_LEVELS,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'

interface BlitzLandingProps {
  personalBest: number
  bestCombo: number
  leaderboard: BlitzLeaderboardEntry[]
  scoresReady?: boolean
  defaultAiLevel?: LearnerCefrLevel | null
  aiRateLimited?: boolean
  aiRetryAfterSeconds?: number
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '0s'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function BlitzBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center">
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
      <span className="h-px w-7 bg-brand-dark/60" />
      <span className={blitzKicker}>{children}</span>
      <span className="h-px w-7 bg-brand-dark/60" />
      <span className="h-2.5 w-2.5 rounded-[2px] border border-brand-dark bg-brand-accent" />
    </div>
  )
}

export default function BlitzLanding({
  personalBest,
  bestCombo,
  leaderboard,
  scoresReady = true,
  defaultAiLevel = null,
  aiRateLimited = false,
  aiRetryAfterSeconds = 0,
}: BlitzLandingProps) {
  const [selectedMode, setSelectedMode] = useState<'standard' | 'ai'>('standard')
  const [selectedAiLevel, setSelectedAiLevel] = useState<LearnerCefrLevel>(defaultAiLevel ?? 'A2')
  const [secondsLeft, setSecondsLeft] = useState(aiRetryAfterSeconds)
  const isAiMode = selectedMode === 'ai'
  const isLimited = aiRateLimited && secondsLeft > 0
  const playHref = isAiMode
    ? `/blitz/play?mode=ai&level=${selectedAiLevel}`
    : '/blitz/play'

  // Countdown timer that decrements every second while limited; when it hits 0 the banner disappears
  useEffect(() => {
    if (!aiRateLimited || aiRetryAfterSeconds <= 0) return
    setSecondsLeft(aiRetryAfterSeconds)

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [aiRateLimited, aiRetryAfterSeconds])

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      <StudyBreadcrumb
        items={[
          { label: 'Início', href: '/home' },
          { label: 'Blitz' },
        ]}
        className="px-1"
      />

      {!scoresReady && (
        <section className="rounded-2xl border-2 border-brand-dark bg-bg-card px-5 py-4 font-body text-sm text-brand-dark shadow-[4px_4px_0_var(--color-brand-dark)]">
          Ranking e recordes do Blitz estão temporariamente indisponíveis. Você ainda pode jogar
          normalmente — suas partidas serão salvas assim que o recurso for reativado.
        </section>
      )}

      <StaggeredFadeIn>
        <section className={`${blitzGlassPanel} p-6 sm:p-8`}>
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <Zap className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="mt-5">
              <BlitzBadge>Desafio Relâmpago</BlitzBadge>
            </div>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-brand-dark sm:text-4xl">
              Blitz
            </h1>
            <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
              {isAiMode
                ? 'Escolha seu nível de inglês e a IA monta um pack temporário para esta partida. No fim, você escolhe salvar na biblioteca ou descartar.'
                : 'Partida solo rápida com modos mistos, combos e três vidas. Quanto mais acertos seguidos, maior o multiplicador de pontos.'}
            </p>
            {isAiMode && (
              <div className="mt-6">
                {isLimited && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border-2 border-brand-dark bg-bg-card px-4 py-3.5 shadow-[3px_3px_0_var(--color-brand-dark)]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" />
                    <div className="min-w-0">
                      <p className="font-body text-sm font-semibold text-brand-dark">
                        Limite diário de gerações atingido
                      </p>
                      <p className="mt-0.5 font-body text-xs leading-relaxed text-brand-secondary">
                        Você usou todas as 10 gerações de Blitz IA de hoje. O limite será
                        restaurado automaticamente em{' '}
                        <span className="font-bold tabular-nums">{formatCountdown(secondsLeft)}</span>.
                      </p>
                    </div>
                  </div>
                )}
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
                  Nível de inglês
                </p>
                <div
                  className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
                  role="radiogroup"
                  aria-label="Nível de inglês para o Blitz IA"
                >
                  {LEARNER_CEFR_LEVELS.map((level) => {
                    const isSelected = selectedAiLevel === level

                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        data-testid={`blitz-ai-level-${level}`}
                        onClick={() => setSelectedAiLevel(level)}
                        className={`${blitzGlassTile} text-left transition-colors active:scale-[0.985] ${
                          isSelected
                            ? 'bg-brand-accent'
                            : 'hover:bg-bg-primary'
                        }`}
                      >
                        <span className="font-heading text-lg font-bold text-brand-dark">{level}</span>
                        <span className="mt-1 block font-body text-xs font-semibold text-brand-secondary">
                          {CEFR_LEVEL_LABELS[level]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setSelectedMode((mode) => (mode === 'standard' ? 'ai' : 'standard'))}
                className={blitzSoftBtn}
                aria-pressed={isAiMode}
              >
                {isAiMode ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {isAiMode ? 'Modo IA ativo' : 'Modo padrão ativo'}
              </button>
              <Link
                href={playHref}
                data-testid="blitz-play-link"
                className={blitzPrimaryBtn}
                transitionTypes={navForwardTransitionTypes}
              >
                {isAiMode ? <Sparkles className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {isAiMode ? `Jogar com IA (${selectedAiLevel})` : 'Jogar agora'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </StaggeredFadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <StaggeredFadeIn delay={0.05}>
          <section className={`${blitzGlassPanel} p-6`}>
            <p className={blitzKicker}>Seu recorde</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={blitzGlassTile}>
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Melhor score</p>
                <p className="mt-2 flex items-center gap-2 font-heading text-3xl font-bold text-brand-dark">
                  <Trophy className="h-5 w-5 text-brand-dark" />
                  {personalBest}
                </p>
              </div>
              <div className={blitzGlassTile}>
                <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Melhor combo</p>
                <p className="mt-2 flex items-center gap-2 font-heading text-3xl font-bold text-brand-dark">
                  <Flame className="h-5 w-5 text-brand-dark" />
                  {bestCombo}
                </p>
              </div>
            </div>
          </section>
        </StaggeredFadeIn>

        <StaggeredFadeIn delay={0.1}>
          <section className={`${blitzGlassPanel} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <p className={blitzKicker}>Top da semana</p>
              <Link
                href="/blitz/ranking"
                className="font-body text-xs font-semibold text-brand-dark underline underline-offset-4 hover:text-brand-secondary"
                transitionTypes={navForwardTransitionTypes}
              >
                Ver ranking completo
              </Link>
            </div>
            {leaderboard.length === 0 ? (
              <p className="mt-4 font-body text-sm text-brand-secondary">Seja o primeiro a pontuar esta semana.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {leaderboard.map((entry) => (
                  <li key={entry.userId} className={blitzNestedRow}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-dark bg-brand-accent font-heading text-xs font-bold text-brand-dark">
                        {entry.rank}
                      </span>
                      <span className="font-body font-semibold text-brand-dark">{entry.username}</span>
                    </div>
                    <span className="font-heading text-sm font-bold text-brand-dark">{entry.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </StaggeredFadeIn>
      </div>

      <StaggeredFadeIn delay={0.15}>
        <section className={`${blitzGlassPanel} p-6`}>
          <p className={blitzKicker}>Como funciona</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <article className={`${blitzGlassTile} text-left`}>
              <Heart className="h-5 w-5 text-brand-dark" />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">3 vidas</h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">Cada erro custa um coração. Quando acabarem, a partida termina.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Flame className="h-5 w-5 text-brand-dark" />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">Combos</h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">Acertos seguidos aumentam o multiplicador até 5x.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Zap className="h-5 w-5 text-brand-dark" />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">Modos mistos</h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">Múltipla escolha, digitação, combinação e fala no microfone em sequência aleatória.</p>
            </article>
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  )
}
