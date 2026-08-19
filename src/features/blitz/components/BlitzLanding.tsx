'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { m } from 'framer-motion'
import { AlertCircle, ArrowRight, ChevronDown, Flame, Heart, HelpCircle, Sparkles, Trophy, Zap } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { BlitzLeaderboardEntry } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import BlitzCountUpNumber from '@/features/blitz/components/BlitzCountUpNumber'
import {
  blitzCard,
  blitzHeroArena,
  blitzIconBox,
  blitzKicker,
  blitzModeOption,
  blitzModeSwitch,
  blitzNestedRow,
  blitzPrimaryBtn,
  blitzScoreTicker,
  blitzTile,
} from '@/features/blitz/lib/blitzUi'
import { type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import {
  BLITZ_DIFFICULTIES,
  DEFAULT_BLITZ_DIFFICULTY,
  difficultyFromCefr,
  getBlitzDifficulty,
  type BlitzDifficulty,
} from '@/features/blitz/lib/blitzDifficulty'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
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

const speedBarDelays = [0, 0.15, 0.3, 0.45, 0.6]

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<BlitzDifficulty>(
    (defaultAiLevel ? difficultyFromCefr(defaultAiLevel) : null) ?? DEFAULT_BLITZ_DIFFICULTY
  )
  const [secondsLeft, setSecondsLeft] = useState(aiRetryAfterSeconds)
  const isAiMode = selectedMode === 'ai'
  const isLimited = aiRateLimited && secondsLeft > 0
  const playHref = isAiMode
    ? `/blitz/play?mode=ai&level=${selectedDifficulty}`
    : '/blitz/play'

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
    <div className="min-w-0 space-y-5 pb-4 animate-fade-in sm:space-y-6">
      <StudyBreadcrumb
        items={[
          { label: 'Início', href: '/home' },
          { label: 'Blitz' },
        ]}
        className="px-0.5"
      />

      {!scoresReady && (
        <section className={`${blitzCard} px-4 py-4 font-body text-sm text-brand-dark sm:px-5`}>
          Ranking e recordes do Blitz estão temporariamente indisponíveis. Você ainda pode jogar
          normalmente — suas partidas serão salvas assim que o recurso for reativado.
        </section>
      )}

      <StaggeredFadeIn>
        <section className={`${blitzHeroArena} p-4 sm:p-8 lg:p-10`}>
          <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1fr_5.5rem] lg:items-stretch lg:gap-8">
            <div className="min-w-0">
              {/* "Desafio Relâmpago" + "Pronto para jogar" + the H1 were three labels for one
                  screen. The live dot already says the game is ready to start. */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className={blitzIconBox}>
                  <Zap className="h-6 w-6" strokeWidth={2.2} />
                </div>
                <span className={`${blitzKicker} gap-2 bg-bg-card`}>
                  <span className="blitz-live-dot h-2 w-2 shrink-0 rounded-full bg-brand-accent" aria-hidden />
                  Pronto para jogar
                </span>
              </div>

              <h1 className="mt-5 font-heading text-[2.75rem] font-bold leading-[0.95] tracking-tight text-brand-dark sm:mt-6 sm:text-6xl lg:text-7xl">
                Blitz
              </h1>

              <div className={`${blitzScoreTicker} mt-5 sm:mt-6`}>
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                    <Trophy className="h-3.5 w-3.5 shrink-0" />
                    Recorde
                  </span>
                  <span className="mt-1 block font-heading text-2xl font-bold tabular-nums text-brand-dark sm:text-3xl">
                    <BlitzCountUpNumber value={personalBest} />
                    <span className="ml-1 text-sm font-bold text-brand-secondary">pts</span>
                  </span>
                </div>
                <div className="min-w-0 sm:border-l sm:border-brand-dark/20 sm:pl-3">
                  <span className="flex items-center gap-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                    <Flame className="h-3.5 w-3.5 shrink-0" />
                    Combo máx.
                  </span>
                  <span className="mt-1 block font-heading text-2xl font-bold tabular-nums text-brand-dark sm:text-3xl">
                    <BlitzCountUpNumber value={bestCombo} delay={0.15} />
                    <span className="ml-1 text-sm font-bold text-brand-secondary">x</span>
                  </span>
                </div>
              </div>

              <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
                {isAiMode
                  ? 'Escolha a dificuldade e a IA monta um pack temporário para esta partida. No fim, você escolhe salvar na biblioteca ou descartar.'
                  : 'Partida solo rápida com modos mistos, combos e três vidas. Quanto mais acertos seguidos, maior o multiplicador de pontos.'}
              </p>

              <div className="mt-5 sm:mt-6">
                <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                  Modo de jogo
                </p>
                <div
                  className={`${blitzModeSwitch} mt-2`}
                  role="group"
                  aria-label="Modo de jogo do Blitz"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMode('standard')}
                    className={blitzModeOption(!isAiMode)}
                    aria-pressed={!isAiMode}
                  >
                    <Zap className="h-4 w-4 shrink-0" />
                    Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMode('ai')}
                    className={blitzModeOption(isAiMode)}
                    aria-pressed={isAiMode}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    Com IA
                  </button>
                </div>
              </div>

              {isAiMode && (
                <div className="mt-5 sm:mt-6">
                  {isLimited && (
                    <div className={`${blitzCard} mb-4 flex items-start gap-3 px-3 py-3.5 sm:mb-5 sm:px-4`}>
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
                  <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                    Dificuldade
                  </p>
                  {/* Três opções no lugar de A1/A2/B1/B2: quem não conhece a escala CEFR não tem
                      como escolher entre quatro siglas, e escolher errado estraga a partida
                      inteira porque o conteúdo é gerado na hora. */}
                  <div
                    className="mt-3 grid gap-2.5 sm:grid-cols-3 sm:gap-3"
                    role="radiogroup"
                    aria-label="Dificuldade do Blitz IA"
                  >
                    {BLITZ_DIFFICULTIES.map((opcao) => {
                      const isSelected = selectedDifficulty === opcao.id

                      return (
                        <button
                          key={opcao.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          data-testid={`blitz-ai-difficulty-${opcao.id}`}
                          onClick={() => setSelectedDifficulty(opcao.id)}
                          className={`${blitzTile} text-left transition-colors active:scale-[0.985] ${
                            isSelected ? 'bg-brand-accent' : 'hover:bg-bg-primary'
                          }`}
                        >
                          <span className="font-heading text-base font-bold text-brand-dark sm:text-lg">
                            {opcao.label}
                          </span>
                          <span className="mt-0.5 block font-body text-[11px] font-semibold leading-tight text-brand-secondary sm:mt-1 sm:text-xs">
                            {opcao.hint}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="relative mt-6 inline-block w-full sm:mt-8 sm:w-auto">
                <m.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[13px] bg-brand-accent"
                  animate={{ opacity: [0.35, 0.75, 0.35], scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                  style={{ filter: 'blur(10px)' }}
                />
                <Link
                  href={playHref}
                  data-testid="blitz-play-link"
                  className={`${blitzPrimaryBtn} relative`}
                  transitionTypes={navForwardTransitionTypes}
                >
                  {isAiMode ? <Sparkles className="h-4 w-4 shrink-0" /> : <Zap className="h-4 w-4 shrink-0" />}
                  <span className="truncate">
                    {isAiMode ? (
                      <>
                        <span className="sm:hidden">IA · {getBlitzDifficulty(selectedDifficulty).label}</span>
                        <span className="hidden sm:inline">
                          Jogar com IA ({getBlitzDifficulty(selectedDifficulty).label})
                        </span>
                      </>
                    ) : (
                      'Entrar na arena'
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </div>

            <div
              className="hidden items-end justify-center gap-1.5 rounded-[13px] border border-brand-dark bg-bg-primary px-3 py-4 lg:flex lg:flex-col"
              aria-hidden
            >
              {speedBarDelays.map((delay, index) => (
                <m.div
                  key={index}
                  animate={{ scaleY: [0.2, 1, 0.35] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.9,
                    delay,
                    ease: 'easeInOut',
                  }}
                  className="h-10 w-2 origin-bottom rounded-full bg-brand-dark"
                />
              ))}
            </div>
          </div>
        </section>
      </StaggeredFadeIn>

      <StaggeredFadeIn delay={0.05}>
        <section className={`${blitzCard} p-4 sm:p-6`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <SectionBadge label="Top da semana" animate={false} />
              <h2 className="mt-3 font-heading text-lg font-bold text-brand-dark sm:text-2xl">
                Quem está no topo
              </h2>
            </div>
            <Link
              href="/blitz/ranking"
              className="shrink-0 font-body text-xs font-semibold text-brand-dark underline underline-offset-4 hover:text-brand-secondary"
              transitionTypes={navForwardTransitionTypes}
            >
              Ranking completo
            </Link>
          </div>

          {leaderboard.length === 0 ? (
            <p className="mt-4 font-body text-sm text-brand-secondary">Seja o primeiro a pontuar esta semana.</p>
          ) : (
            <ol className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
              {leaderboard.map((entry, index) => (
                <li
                  key={entry.userId}
                  className={`${blitzNestedRow} ${
                    index === 0
                      ? 'border-brand-dark bg-brand-accent'
                      : index === 1
                        ? 'bg-bg-primary'
                        : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-dark font-heading text-xs font-bold ${
                        index === 0 ? 'bg-brand-dark text-white' : 'bg-bg-card text-brand-dark'
                      }`}
                    >
                      {index === 0 ? (
                        <Trophy className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden />
                      ) : (
                        entry.rank
                      )}
                    </span>
                    <span className="min-w-0 truncate font-body font-semibold text-brand-dark">{entry.username}</span>
                    {index === 0 ? (
                      <span className={`${blitzKicker} shrink-0`}>Líder</span>
                    ) : null}
                  </div>
                  <span className="shrink-0 self-end font-heading text-sm font-bold tabular-nums text-brand-dark sm:self-auto">
                    {entry.score} pts
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </StaggeredFadeIn>

      {/* Rules are onboarding, not a standing need — you read them once. Collapsed, they stop
          costing a full phone screen on every visit but stay one tap away. */}
      <StaggeredFadeIn delay={0.1}>
        <details className={`${blitzCard} group overflow-hidden`}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:content-none sm:p-5">
            <span className="flex min-w-0 items-center gap-2.5">
              <HelpCircle className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.4} />
              <span className="font-heading text-sm font-bold text-brand-dark sm:text-base">
                Como funciona
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-brand-secondary transition-transform duration-300 group-open:rotate-180"
              strokeWidth={2.4}
            />
          </summary>
          <div className="grid gap-3 border-t border-brand-dark/15 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
            <article className={`${blitzTile} text-left`}>
              <Heart className="h-5 w-5 text-brand-dark" strokeWidth={2.2} />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">3 vidas</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">Cada erro custa um coração. Quando acabarem, a partida termina.</p>
            </article>
            <article className={`${blitzTile} text-left`}>
              <Flame className="h-5 w-5 text-brand-dark" strokeWidth={2.2} />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">Combos</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">Acertos seguidos aumentam o multiplicador até 5x.</p>
            </article>
            <article className={`${blitzTile} text-left`}>
              <Zap className="h-5 w-5 text-brand-dark" strokeWidth={2.2} />
              <h3 className="mt-3 font-body font-semibold text-brand-dark">Modos mistos</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">Múltipla escolha, digitação, combinação e fala no microfone em sequência aleatória.</p>
            </article>
          </div>
        </details>
      </StaggeredFadeIn>
    </div>
  )
}