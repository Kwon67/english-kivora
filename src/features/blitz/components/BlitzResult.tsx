'use client'

import { CELEBRATION_COLORS } from '@/lib/brandColors'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAnimatedDismiss } from '@/components/motion/useAnimatedDismiss'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { ArrowUpRight, Brain, CheckCircle2, Home, RotateCcw, Save, Trash2, Trophy, X, Zap } from 'lucide-react'
import { queueBlitzMissesForReview, saveBlitzAiPack } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'
import BlitzMissRecap from '@/features/blitz/components/BlitzMissRecap'
import BlitzCountUpNumber from '@/features/blitz/components/BlitzCountUpNumber'
import { BLITZ_NOTABLE_SCORE } from '@/features/blitz/lib/blitzScoring'
import { blitzKicker, blitzPrimaryBtn, blitzSoftBtn } from '@/features/blitz/lib/blitzUi'
import { getBlitzStudyRecommendation } from '@/features/blitz/lib/blitzRecommendation'
import { getUniqueBlitzMissCardIds, type BlitzMiss } from '@/features/blitz/lib/blitzMisses'

const QUEST_LABELS: Record<string, string> = {
  any_session: 'Missão diária concluída',
  blitz_session: 'Missão de Blitz concluída',
  blitz_combo: 'Missão de combo concluída',
}

type BlitzResultTone = {
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
      title: 'Sua melhor pontuação',
      description: 'Você superou seu recorde no Blitz.',
    }
  }

  if (options.maxCombo >= 10) {
    return {
      title: `Combo de ${options.maxCombo}`,
      description: 'Acertos seguidos aumentaram seu multiplicador.',
    }
  }

  if (options.cardsAnswered >= 8 && options.missedCount <= 1) {
    return {
      title: 'Boa sequência de respostas',
      description: 'Você respondeu a vários desafios com poucos erros.',
    }
  }

  if (options.score >= BLITZ_NOTABLE_SCORE) {
    return {
      title: 'Boa pontuação',
      description: `Você passou de ${BLITZ_NOTABLE_SCORE} pontos. Combos maiores multiplicam os pontos.`,
    }
  }

  return {
    title: 'Continue praticando',
    description: options.missedCount > 0
      ? 'Revise os erros agora e volte para uma sequência mais longa.'
      : 'Jogue outra rodada para praticar mais frases.',
  }
}

interface BlitzResultProps {
  score: number
  saveStatus: 'pending' | 'saved' | 'failed'
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
  saveStatus,
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
    if (!isNewRecord && !unlockedBadges?.length) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let resetConfetti: (() => void) | undefined
    void import('canvas-confetti').then(({ default: confetti }) => {
      if (cancelled) return
      const celebrate = confetti.create(undefined, { resize: true, useWorker: false })
      resetConfetti = celebrate.reset
      void celebrate({
        disableForReducedMotion: true,
        particleCount: 26,
        spread: 52,
        startVelocity: 26,
        origin: { y: 0.65 },
        colors: CELEBRATION_COLORS,
      })
    })
    return () => {
      cancelled = true
      resetConfetti?.()
    }
  }, [isNewRecord, unlockedBadges?.length])

  const rewardMessages = [
    ...(streakUpdated ? ['Sequência diária mantida!'] : []),
    ...(unlockedBadges || []).map((badge) => badge.name),
    ...(questsCompleted || []).map((quest) => QUEST_LABELS[quest] || 'Missão concluída'),
  ]

  return (
    <div
      ref={panel}
      className="blitz-result"
      data-record={isNewRecord}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blitz-result-title"
    >
      <header className="blitz-result-header" style={{ backgroundColor: 'var(--brand-sage)' }}>
        <div>
          <p className={blitzKicker}>{isNewRecord ? <Trophy size={15} aria-hidden="true" /> : <Zap size={15} aria-hidden="true" />} Fim de jogo</p>
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
          <div><dt>Pontuação</dt><dd><BlitzCountUpNumber value={score} duration={0.35} /></dd></div>
          <div><dt>Melhor combo</dt><dd>{maxCombo}</dd></div>
          <div><dt>Recorde</dt><dd>{personalBest}</dd></div>
        </dl>

        {saveStatus === 'pending' && <p role="status" className="blitz-result-detail">Salvando partida…</p>}
        {saveStatus === 'failed' && <p role="alert" className="blitz-result-detail">Salvamento da partida no ranking não confirmado.</p>}

        <div className="blitz-result-note">
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
          <section className="blitz-result-pack">
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
              <p role="status" className="mt-3 flex items-center gap-2 font-body text-sm font-semibold text-brand-dark">
                <CheckCircle2 className="h-4 w-4" />
                {packMessage}
              </p>
            )}
            {packError && (
              <p role="alert" className="mt-3 font-body text-sm font-semibold text-error">{packError}</p>
            )}
          </section>
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
