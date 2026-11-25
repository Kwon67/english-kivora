'use client'

import SpotIllustration from '@/components/illustrations/SpotIllustration'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowRight, ChevronDown, Flame, Heart, Sparkles, Trophy, Zap } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { BlitzLeaderboardEntry } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import { blitzHeroArena, blitzModeOption, blitzPrimaryBtn } from '@/features/blitz/lib/blitzUi'
import { getCefrLevelLabel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { blitzLevelsInScope } from '@/features/blitz/lib/blitzLevelScope'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'

interface BlitzLandingProps {
  personalBest: number
  bestCombo: number
  leaderboard: BlitzLeaderboardEntry[]
  scoresReady?: boolean
  userLevel?: LearnerCefrLevel | null
  aiRateLimited?: boolean
  aiRetryAfterSeconds?: number
}

function BlitzComboTally({ bestCombo }: { bestCombo: number }) {
  const total = Math.min(Math.max(bestCombo, 5), 45)

  return (
    <div className="blitz-entry-tally" aria-hidden="true">
      {Array.from({ length: Math.ceil(total / 5) }, (_, group) => {
        const count = Math.min(5, total - group * 5)
        return (
          <span key={group} data-complete={count === 5}>
            {Array.from({ length: Math.min(4, count) }, (_, mark) => <i key={mark} />)}
          </span>
        )
      })}
    </div>
  )
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
  userLevel = null,
  aiRateLimited = false,
  aiRetryAfterSeconds = 0,
}: BlitzLandingProps) {
  const [selectedMode, setSelectedMode] = useState<'standard' | 'ai'>('standard')
  // Nenhum dos dois modos pergunta dificuldade: os dois usam o nível do usuário como teto. Sem
  // dizer isso na tela, a partida parece só "faltar conteúdo" quando na verdade está respeitando
  // o nível — e no modo IA a pessoa não teria como saber por que o conteúdo mudou.
  const faixaDoUsuario = blitzLevelsInScope(userLevel)
  const teto = faixaDoUsuario[faixaDoUsuario.length - 1]
  const faixaLabel = faixaDoUsuario.length > 1 ? `${faixaDoUsuario[0]}–${teto}` : teto
  const [secondsLeft, setSecondsLeft] = useState(aiRetryAfterSeconds)
  const isAiMode = selectedMode === 'ai'
  const isLimited = aiRateLimited && secondsLeft > 0
  const playHref = isAiMode ? '/blitz/play?mode=ai' : '/blitz/play'

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
    <div className="blitz-overview">
      <StudyBreadcrumb items={[{ label: 'Início', href: '/home' }, { label: 'Blitz' }]} />

      {!scoresReady && (
        <p className="blitz-notice" role="status">
          Ranking e recordes temporariamente indisponíveis. Você ainda pode jogar.
        </p>
      )}

      <header className="blitz-lobby-heading">
        <h1 id="blitz-entry-title">Blitz <SpotIllustration motif="bolt" className="inline-block size-9 align-middle sm:size-12" /></h1>
        <p className="blitz-lead">Pratique inglês em rodadas rápidas. Faixa {faixaLabel}.</p>
      </header>

      <section className={`${blitzHeroArena} blitz-entry-hero`} aria-label="Configurar partida">
        <div className="blitz-entry-content">
          <h2 className="blitz-mode-title">Modo de jogo</h2>

          <div className="blitz-entry-modes" role="group" aria-label="Modo de jogo do Blitz">
            <button type="button" onClick={() => setSelectedMode('standard')} className={blitzModeOption(!isAiMode)} aria-pressed={!isAiMode}>
              <Zap size={16} aria-hidden="true" /> Padrão
            </button>
            <button type="button" onClick={() => setSelectedMode('ai')} className={blitzModeOption(isAiMode)} aria-pressed={isAiMode}>
              <Sparkles size={16} aria-hidden="true" /> Com IA
            </button>
          </div>
          <div className="blitz-entry-mode-detail" aria-live="polite">
            {isAiMode ? (
              <div data-testid="blitz-ai-level-scope">
                <p><strong>Seu nível: {teto}</strong> · {getCefrLevelLabel(teto)}</p>
                <p>Frases inéditas na faixa {faixaLabel}, com foco em {teto}. No fim, você pode salvar ou descartar o pack.</p>
              </div>
            ) : (
              <p>Três vidas, combos e desafios em modos mistos.</p>
            )}
          </div>

          {isAiMode && isLimited && (
            <div className="blitz-notice blitz-notice-inline">
              <AlertCircle size={17} aria-hidden="true" />
              <div>
                <p><strong>Limite diário de 10 gerações atingido.</strong></p>
                <p>Novas gerações em <span className="tabular-nums">{formatCountdown(secondsLeft)}</span>.</p>
              </div>
            </div>
          )}

          <Link href={playHref} data-testid="blitz-play-link" className={blitzPrimaryBtn} transitionTypes={navForwardTransitionTypes}>
            {isAiMode ? `Jogar com IA (${teto})` : 'Entrar na arena'}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="blitz-entry-records">
          <dl>
            <div><dt><Trophy size={15} aria-hidden="true" /> Recorde</dt><dd>{personalBest} <small>pts</small></dd></div>
            <div><dt><Flame size={15} aria-hidden="true" /> Melhor combo</dt><dd>{bestCombo}<small>x</small></dd></div>
          </dl>
          <BlitzComboTally bestCombo={bestCombo} />
        </div>
      </section>

      <section className="blitz-weekly" aria-labelledby="blitz-weekly-title">
        <div className="blitz-section-heading">
          <h2 id="blitz-weekly-title">Top da semana</h2>
          <Link href="/blitz/ranking" className="product-text-link" transitionTypes={navForwardTransitionTypes}>
            Ranking completo <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
        {leaderboard.length === 0 ? (
          <p className="blitz-list-empty">{scoresReady ? 'Seja o primeiro a pontuar esta semana.' : 'A classificação aparecerá quando o ranking voltar.'}</p>
        ) : (
          <ol className="blitz-standing-list">
            {leaderboard.map((entry, index) => (
              <li key={entry.rank} data-leader={index === 0} className="blitz-standing-row">
                <span className="blitz-standing-place">#{entry.rank}</span>
                <span className="blitz-standing-name">{entry.username}</span>
                <strong className="blitz-standing-score">{entry.score} <small>pts</small></strong>
              </li>
            ))}
          </ol>
        )}
      </section>

      <details className="blitz-entry-guide">
        <summary>Como funciona <ChevronDown size={17} aria-hidden="true" /></summary>
        <dl>
          <div><dt><Heart size={16} aria-hidden="true" /> Três vidas</dt><dd>Cada erro custa uma vida. A partida termina quando elas acabam.</dd></div>
          <div><dt><Flame size={16} aria-hidden="true" /> Combos</dt><dd>Acertos seguidos aumentam o multiplicador até 5x.</dd></div>
          <div><dt><Zap size={16} aria-hidden="true" /> Modos mistos</dt><dd>As rodadas podem incluir tradução, escrita, combinação, escuta e fala.</dd></div>
        </dl>
      </details>
    </div>
  )
}
