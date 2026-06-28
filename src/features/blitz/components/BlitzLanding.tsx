'use client'

import { useState, useEffect } from 'react'
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
        <section className="rounded-[20px] border border-dashed border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-text">
          Ranking e recordes do Blitz estão temporariamente indisponíveis. Você ainda pode jogar
          normalmente — suas partidas serão salvas assim que o recurso for reativado.
        </section>
      )}

      <StaggeredFadeIn>
        <section className={`${blitzGlassPanel} p-6 sm:p-8`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.75),rgba(251,252,242,0.18)_42%,transparent)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.10),rgba(17,22,14,0)_48%)]" />
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border-muted/22 bg-primary-container text-primary shadow-sm dark:border-border-accent/18 dark:bg-primary/12">
              <Zap className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className={`${blitzKicker} mt-5`}>Desafio Relâmpago</p>
            <h1 className="mt-4 font-montserrat text-3xl font-bold leading-tight text-text sm:text-4xl">
              Blitz
            </h1>
            <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base">
              {isAiMode
                ? 'Escolha seu nível de inglês e a IA monta um pack temporário para esta partida. No fim, você escolhe salvar na biblioteca ou descartar.'
                : 'Partida solo rápida com modos mistos, combos e três vidas. Quanto mais acertos seguidos, maior o multiplicador de pontos.'}
            </p>
            {isAiMode && (
              <div className="mt-6">
                {isLimited && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-dashed border-rose-500/35 bg-rose-500/8 px-4 py-3.5 dark:border-rose-400/25 dark:bg-rose-500/10">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                        Limite diário de gerações atingido
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-rose-600/80 dark:text-rose-400/80">
                        Você usou todas as 10 gerações de Blitz IA de hoje. O limite será
                        restaurado automaticamente em{' '}
                        <span className="font-bold tabular-nums">{formatCountdown(secondsLeft)}</span>.
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">
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
                            ? 'border-primary bg-primary-container ring-1 ring-primary/30 dark:border-primary dark:bg-primary/15'
                            : 'hover:border-primary/20 hover:bg-primary/5 active:bg-primary/10'
                        }`}
                      >
                        <span className="text-lg font-black text-text">{level}</span>
                        <span className="mt-1 block text-xs font-semibold text-text-muted">
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-border-muted/22 bg-card px-5 py-3 text-sm font-black text-text shadow-sm transition-colors hover:border-primary/30 hover:text-primary dark:border-border-accent/20"
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
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Melhor score</p>
                <p className="mt-2 flex items-center gap-2 text-3xl font-black text-text">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {personalBest}
                </p>
              </div>
              <div className={blitzGlassTile}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Melhor combo</p>
                <p className="mt-2 flex items-center gap-2 text-3xl font-black text-text">
                  <Flame className="h-5 w-5 text-orange-500" />
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
                className="text-xs font-bold text-primary hover:underline"
                transitionTypes={navForwardTransitionTypes}
              >
                Ver ranking completo
              </Link>
            </div>
            {leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">Seja o primeiro a pontuar esta semana.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {leaderboard.map((entry) => (
                  <li key={entry.userId} className={blitzNestedRow}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border-muted/18 bg-primary-container text-xs font-black text-primary dark:border-border-accent/18 dark:bg-primary/12">
                        {entry.rank}
                      </span>
                      <span className="font-bold text-text">{entry.username}</span>
                    </div>
                    <span className="text-sm font-black text-text">{entry.score}</span>
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
              <Heart className="h-5 w-5 text-rose-500" />
              <h3 className="mt-3 font-bold text-text">3 vidas</h3>
              <p className="mt-2 text-sm text-text-muted">Cada erro custa um coração. Quando acabarem, a partida termina.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="mt-3 font-bold text-text">Combos</h3>
              <p className="mt-2 text-sm text-text-muted">Acertos seguidos aumentam o multiplicador até 5x.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-bold text-text">Modos mistos</h3>
              <p className="mt-2 text-sm text-text-muted">Múltipla escolha, digitação, combinação e fala no microfone em sequência aleatória.</p>
            </article>
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  )
}
