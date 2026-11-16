'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAnimatedDismiss } from '@/components/motion/useAnimatedDismiss'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ArrowUpRight, Brain, CheckCircle2, Home, RotateCcw, Save, Sparkles, Trash2, Trophy, X, Zap } from 'lucide-react'
import { queueBlitzMissesForReview, saveBlitzAiPack } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'
import BlitzMissRecap from '@/features/blitz/components/BlitzMissRecap'
import BlitzCountUpNumber from '@/features/blitz/components/BlitzCountUpNumber'
import { BLITZ_NOTABLE_SCORE } from '@/features/blitz/lib/blitzScoring'
import { blitzKicker, blitzPrimaryBtn, blitzSoftBtn, blitzTile } from '@/features/blitz/lib/blitzUi'
import { getBlitzStudyRecommendation } from '@/features/blitz/lib/blitzRecommendation'
import { getUniqueBlitzMissCardIds, type BlitzMiss } from '@/features/blitz/lib/blitzMisses'

const GOOD_RUN_TONES = new Set(['Sequência forte', 'Bom ritmo', 'Boa marca'])

const QUEST_LABELS: Record<string, string> = {
  any_session: 'Missão diária concluída',
  blitz_session: 'Missão de Blitz concluída',
  blitz_combo: 'Missão de combo concluída',
}

type BlitzResultTone = {
  label: string
  title: string
  description: string
}

function getBlitzResultTone(options: {
  score: number
  maxCombo: number
  cardsAnswered: number
  isNewRecord: boolean
  missedCount: number
}): BlitzResultTone {
  if (options.isNewRecord) {
    return {
      label: 'Recorde',
      title: 'Você subiu o próprio teto.',
      description: 'Essa foi sua melhor marca no Blitz até agora. Vale tentar outra rodada enquanto o ritmo está quente.',
    }
  }

  if (options.maxCombo >= 10) {
    return {
      label: 'Sequência forte',
      title: `Combo ${options.maxCombo} segurou a partida.`,
      description: 'Você manteve uma boa sequência de acertos. O próximo salto está em reduzir os erros finais.',
    }
  }

  if (options.cardsAnswered >= 8 && options.missedCount <= 1) {
    return {
      label: 'Bom ritmo',
      title: 'Rodada limpa e consistente.',
      description: 'Poucos erros e várias respostas em sequência. Mais uma partida pode transformar isso em recorde.',
    }
  }

  if (options.score >= BLITZ_NOTABLE_SCORE) {
    return {
      label: 'Boa marca',
      title: 'Pontuação sólida para uma rodada rápida.',
      description: `Você passou de ${BLITZ_NOTABLE_SCORE} pontos. Foque em combos maiores para multiplicar o score.`,
    }
  }

  return {
    label: 'Aquecimento',
    title: 'Boa rodada para calibrar.',
    description: options.missedCount > 0
      ? 'Revise os erros agora e volte para uma sequência mais longa.'
      : 'Você respondeu sem acumular muitos desafios. A próxima rodada já começa mais afiada.',
  }
}

interface BlitzResultProps {
  score: number
  maxCombo: number
  cardsAnswered: number
  personalBest: number
  isNewRecord: boolean
  streakUpdated?: boolean
  unlockedBadges?: { name: string; icon_name: string | null }[]
  questsCompleted?: string[]
  misses?: BlitzMiss[]
  priorityReviewCardIds?: string[]
  priorityReviewPending?: boolean
  source?: 'standard' | 'ai'
  aiPack?: BlitzAiPackDraft | null
  onPlayAgain: () => void
  onClose: () => void
  onLeaveResult?: () => void
}

export default function BlitzResult({
  score,
  maxCombo,
  cardsAnswered,
  personalBest,
  isNewRecord,
  streakUpdated,
  unlockedBadges,
  questsCompleted,
  misses = [],
  priorityReviewCardIds = [],
  priorityReviewPending = false,
  source = 'standard',
  aiPack = null,
  onPlayAgain,
  onClose,
  onLeaveResult,
}: BlitzResultProps) {
  const router = useRouter()
  const panel = useRef<HTMLDivElement>(null)
  const dismiss = useAnimatedDismiss(panel)
  const close = () => dismiss(onClose)
  useFocusTrap({ active: true, containerRef: panel, onClose: close })
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [isReviewPending, startReviewTransition] = useTransition()
  const [packMessage, setPackMessage] = useState<string | null>(null)
  const [packError, setPackError] = useState<string | null>(null)
  const [isPackPending, startPackTransition] = useTransition()
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES[0].id)
  const missCardIds = getUniqueBlitzMissCardIds(misses)
  const isAiResult = source === 'ai' && Boolean(aiPack)
  const canReviewMisses = source !== 'ai'
  const recommendation = getBlitzStudyRecommendation(misses)
  const unqueuedMisses = missCardIds.filter(id => !priorityReviewCardIds.includes(id))
  const resultTone = getBlitzResultTone({
    score,
    maxCombo,
    cardsAnswered,
    isNewRecord,
    missedCount: missCardIds.length,
  })

  const handleReviewMisses = () => {
    if (missCardIds.length === 0 || !canReviewMisses || priorityReviewPending) return

    setReviewError(null)
    startReviewTransition(async () => {
      if (unqueuedMisses.length) {
        const result = await queueBlitzMissesForReview(unqueuedMisses)
        if (!result.success) {
          setReviewError(result.error)
          return
        }
      }
      dismiss(() => { onLeaveResult?.(); router.push(`/review?source=blitz&cards=${missCardIds.join(',')}`) })
    })
  }

  const handleSaveAiPack = () => {
    if (!aiPack) return

    setPackError(null)
    setPackMessage(null)
    startPackTransition(async () => {
      const result = await saveBlitzAiPack(aiPack, selectedVoice)
      if (!result.success) {
        setPackError(result.error)
        return
      }

      onLeaveResult?.()
      setPackMessage(`Pack salvo na sua biblioteca com ${result.cardCount} cards.`)
    })
  }

  const handleDiscardAiPack = () => {
    dismiss(() => {
      onLeaveResult?.()
      setPackError(null)
      router.push('/blitz', { transitionTypes: navBackTransitionTypes })
    })
  }

  useEffect(() => {
    const isBigCelebration = isNewRecord || Boolean(unlockedBadges?.length)
    if (!isBigCelebration && !GOOD_RUN_TONES.has(resultTone.label)) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let resetConfetti: (() => void) | undefined
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      const celebrate = confetti.create(undefined, { resize: true, useWorker: false })
      resetConfetti = celebrate.reset
      void celebrate({
        disableForReducedMotion: true,
        particleCount: isBigCelebration ? 120 : 45,
        spread: isBigCelebration ? 72 : 55,
        startVelocity: isBigCelebration ? 45 : 28,
        origin: { y: 0.65 },
        colors: CELEBRATION_COLORS,
      })
    })
    return () => {
      cancelled = true
      resetConfetti?.()
    }
  }, [isNewRecord, unlockedBadges?.length, resultTone.label])

  const rewardMessages = [
    ...(streakUpdated ? ['Sequência diária mantida!'] : []),
    ...(unlockedBadges || []).map((badge) => badge.name),
    ...(questsCompleted || []).map((quest) => QUEST_LABELS[quest] || 'Missão concluída'),
  ]

  return (
    <div
      ref={panel}
      className="blitz-result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="blitz-result-title"
    >
      <header className="blitz-result-header">
        <div>
          <p className={blitzKicker}><Zap size={14} aria-hidden="true" /> Fim de jogo</p>
          <h1 id="blitz-result-title">{isNewRecord ? 'Novo recorde!' : 'Boa partida!'}</h1>
          <p className="blitz-result-count">
            {cardsAnswered} {cardsAnswered === 1 ? 'desafio respondido' : 'desafios respondidos'}
          </p>
        </div>
        <button type="button" onClick={close} className="blitz-close" aria-label="Fechar resultado">
          <X size={18} aria-hidden="true" />
        </button>
      </header>

      <div className="blitz-result-body" tabIndex={0} role="region" aria-label="Detalhes da partida">
        <dl className="blitz-result-metrics">
          <div><dt>Pontuação</dt><dd><BlitzCountUpNumber value={score} /></dd></div>
          <div><dt>Melhor combo</dt><dd><BlitzCountUpNumber value={maxCombo} delay={0.1} /></dd></div>
          <div><dt>Recorde</dt><dd><BlitzCountUpNumber value={personalBest} delay={0.2} /></dd></div>
        </dl>

        <div className="blitz-result-note">
          <span className="blitz-result-note-icon" aria-hidden="true">
            {isNewRecord ? <Trophy size={18} /> : <Sparkles size={18} />}
          </span>
          <div>
            <h2>{resultTone.title}</h2>
            <p>{resultTone.description}</p>
          </div>
        </div>

        {recommendation && (
          <section className="blitz-result-recommendation">
            <p className={blitzKicker}>Antes da próxima partida</p>
            <h2>{recommendation.title}</h2>
            <p className="blitz-result-detail">{recommendation.detail}</p>
            <Link href={recommendation.href} className="blitz-result-guide"
              onNavigate={event => {
                event.preventDefault()
                dismiss(() => { onLeaveResult?.(); router.push(recommendation.href) })
              }}>
              {recommendation.action}
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </section>
        )}

        <BlitzMissRecap misses={misses} />

        {priorityReviewPending && <p role="status" className="blitz-result-detail">Verificando quais respostas precisam de reforço…</p>}
        {priorityReviewCardIds.length > 0 && (
          <p role="status" className="blitz-result-saved">
            <CheckCircle2 size={16} className="shrink-0" aria-hidden="true" />
            {priorityReviewCardIds.length === 1
              ? '1 frase entrou automaticamente na fila de revisão.'
              : `${priorityReviewCardIds.length} frases entraram automaticamente na fila de revisão.`}
          </p>
        )}
        {missCardIds.length > 0 && !canReviewMisses && (
          <p className="blitz-result-detail">Salve o pack na sua biblioteca para revisar as frases desta partida depois.</p>
        )}

        {isAiResult && (
          <div className={`${blitzTile} text-left`}>
            <p className={blitzKicker}>Pack gerado por IA</p>
            <h2 className="mt-3 font-heading text-base font-bold text-brand-dark">{aiPack?.name}</h2>
            <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
              Este pack foi usado só nesta partida. Salve na biblioteca para praticar depois (com áudio gerado), ou descarte para apagar o draft.
            </p>

            <div className="mt-4">
              <label
                htmlFor="blitz-save-voice"
                className="mb-1.5 block font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary"
              >
                Voz para áudio em inglês
              </label>
              <select
                id="blitz-save-voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={isPackPending || Boolean(packMessage)}
                className="w-full rounded-lg border-2 border-brand-dark bg-bg-primary px-3 py-2 font-body text-sm font-semibold text-brand-dark outline-none focus:bg-white"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} · {v.meta}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleSaveAiPack}
                disabled={isPackPending || Boolean(packMessage)}
                className={`${blitzPrimaryBtn} inline-flex justify-center disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Save className="h-4 w-4" />
                {isPackPending ? 'Salvando com voz...' : 'Salvar na biblioteca'}
              </button>
              <button
                type="button"
                onClick={handleDiscardAiPack}
                disabled={isPackPending || Boolean(packMessage)}
                className={`${blitzSoftBtn} inline-flex justify-center disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Trash2 className="h-4 w-4" />
                Descartar pack
              </button>
            </div>
            {packMessage && (
              <p className="smooth-appear mt-3 flex items-center gap-2 font-body text-sm font-semibold text-brand-dark">
                <CheckCircle2 className="h-4 w-4" />
                {packMessage}
              </p>
            )}
            {packError && (
              <p className="smooth-appear mt-3 font-body text-sm font-semibold text-error">{packError}</p>
            )}
          </div>
        )}

        {rewardMessages.length > 0 && (
          <section className="blitz-result-rewards">
            <h2>Conquistas da partida</h2>
            <ul>
              {rewardMessages.map((message) => (
                <li key={message}><CheckCircle2 size={15} aria-hidden="true" />{message}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <footer className="blitz-result-footer">
        {reviewError && <p role="alert" className="mb-2 text-sm font-semibold text-error">{reviewError}</p>}
        <div className="blitz-result-actions">
          <button type="button" onClick={() => dismiss(onPlayAgain)} className={blitzPrimaryBtn}>
            <RotateCcw size={16} aria-hidden="true" />
            Jogar de novo
          </button>
          {missCardIds.length > 0 && canReviewMisses && (
            <button
              type="button"
              onClick={handleReviewMisses}
              disabled={isReviewPending || priorityReviewPending}
              className={blitzSoftBtn}
            >
              <Brain size={16} aria-hidden="true" />
              {isReviewPending ? 'Preparando…' : `Revisar ${missCardIds.length} ${missCardIds.length === 1 ? 'frase' : 'frases'}`}
            </button>
          )}
        </div>
        <nav aria-label="Depois da partida" className="blitz-result-nav">
          {[
            { href: '/blitz/ranking', label: 'Ranking', Icon: Trophy },
            { href: '/blitz', label: 'Início do Blitz', Icon: Zap },
            { href: '/home', label: 'Home', Icon: Home },
          ].map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onNavigate={event => {
                event.preventDefault()
                dismiss(() => { onLeaveResult?.(); router.push(href, { transitionTypes: navBackTransitionTypes }) })
              }}
              transitionTypes={navBackTransitionTypes}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  )
}
