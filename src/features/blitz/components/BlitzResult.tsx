'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { m } from 'motion/react'
import { Brain, CheckCircle2, Flame, Home, RotateCcw, Save, Sparkles, Trash2, Trophy, X, Zap } from 'lucide-react'
import { queueBlitzMissesForReview, saveBlitzAiPack } from '@/app/actions'
import type { BlitzAiPackDraft } from '@/app/actions'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'
import { VOICES } from '@/lib/voices'
import BlitzMissRecap from '@/features/blitz/components/BlitzMissRecap'
import BlitzCountUpNumber from '@/features/blitz/components/BlitzCountUpNumber'
import { BLITZ_NOTABLE_SCORE } from '@/features/blitz/lib/blitzScoring'
import { blitzHeroArena, blitzKicker, blitzPrimaryBtn, blitzSoftBtn, blitzTile } from '@/features/blitz/lib/blitzUi'
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
  source = 'standard',
  aiPack = null,
  onPlayAgain,
  onClose,
  onLeaveResult,
}: BlitzResultProps) {
  const router = useRouter()
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [isReviewPending, startReviewTransition] = useTransition()
  const [packMessage, setPackMessage] = useState<string | null>(null)
  const [packError, setPackError] = useState<string | null>(null)
  const [isPackPending, startPackTransition] = useTransition()
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES[0].id)
  const missCardIds = getUniqueBlitzMissCardIds(misses)
  const isAiResult = source === 'ai' && Boolean(aiPack)
  const canReviewMisses = source !== 'ai'
  const resultTone = getBlitzResultTone({
    score,
    maxCombo,
    cardsAnswered,
    isNewRecord,
    missedCount: missCardIds.length,
  })

  const handleReviewMisses = () => {
    if (missCardIds.length === 0 || !canReviewMisses) return

    setReviewError(null)
    startReviewTransition(async () => {
      const result = await queueBlitzMissesForReview(missCardIds)
      if (!result.success) {
        setReviewError(result.error)
        return
      }

      onLeaveResult?.()
      router.push(result.reviewPath)
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
    onLeaveResult?.()
    setPackError(null)
    router.push('/blitz', { transitionTypes: navBackTransitionTypes })
  }

  useEffect(() => {
    void import('canvas-confetti').then(({ default: confetti }) => {
      const colors = ['rgb(28,25,21)', 'rgb(213,224,107)', 'rgb(244,241,234)', 'rgb(107,101,96)']
      const isBigCelebration = isNewRecord || (unlockedBadges && unlockedBadges.length > 0)

      if (isBigCelebration) {
        confetti({ particleCount: 120, spread: 72, origin: { y: 0.65 }, colors })
        return
      }

      if (GOOD_RUN_TONES.has(resultTone.label)) {
        confetti({ particleCount: 45, spread: 55, startVelocity: 28, origin: { y: 0.65 }, colors })
      }
    })
  }, [isNewRecord, unlockedBadges, resultTone.label])

  const rewardMessages = [
    ...(streakUpdated ? ['Sequência diária mantida!'] : []),
    ...(unlockedBadges || []).map((badge) => `Badge desbloqueado: ${badge.name}`),
    ...(questsCompleted || []).map((quest) => QUEST_LABELS[quest] || 'Missão concluída'),
  ]

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.94, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className={`${blitzHeroArena} relative mx-auto my-auto max-h-[min(92svh,700px)] w-full max-w-xl overflow-y-auto overscroll-contain p-4 pt-11 text-center sm:p-6 sm:pt-12 md:p-8`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blitz-result-title"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark transition-colors hover:bg-brand-dark hover:text-white sm:right-4 sm:top-4"
        aria-label="Fechar resultado"
      >
        <X className="h-4 w-4" />
      </button>

      <p className={blitzKicker}>Fim de jogo</p>
      <h1 id="blitz-result-title" className="mt-3 font-heading text-2xl font-bold text-brand-dark sm:mt-4 sm:text-3xl">
        {isNewRecord ? 'Novo recorde!' : 'Boa partida!'}
      </h1>
      <p className="mt-2 font-body text-sm text-brand-secondary sm:mt-3">
        {cardsAnswered} desafios respondidos nesta rodada.
      </p>

      <div className={`${blitzTile} mt-4 text-left sm:mt-6`}>
        <div className="flex items-center gap-2">
          <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark">
            {isNewRecord && (
              <m.span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-lg bg-brand-dark"
                animate={{ opacity: [0.25, 0, 0.25], scale: [1, 1.4, 1] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              />
            )}
            {isNewRecord ? <Trophy className="relative h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-heading text-[0.65rem] font-bold uppercase tracking-widest text-brand-dark">
              {resultTone.label}
            </p>
            <h2 className="mt-1 font-body text-base font-semibold leading-tight text-brand-dark">{resultTone.title}</h2>
          </div>
        </div>
        <p className="mt-3 font-body text-sm leading-relaxed text-brand-secondary">{resultTone.description}</p>
      </div>

      <BlitzMissRecap misses={misses} />

      {isAiResult && (
        <div className={`${blitzTile} mt-4 text-left sm:mt-5`}>
          <p className={blitzKicker}>Pack gerado por IA</p>
          <h3 className="mt-3 font-heading text-base font-bold text-brand-dark">{aiPack?.name}</h3>
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
            <p className="smooth-appear mt-3 font-body text-sm font-semibold text-rose-600">{packError}</p>
          )}
        </div>
      )}

      {rewardMessages.length > 0 && (
        <div className="mt-4 space-y-2 text-left sm:mt-5">
          {rewardMessages.map((message) => (
            <p
              key={message}
              className="smooth-appear flex items-center gap-2 rounded-xl border border-brand-dark bg-brand-accent px-3 py-2 font-body text-sm font-semibold text-brand-dark"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {message}
            </p>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
        <div className={blitzTile}>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Pontuação</p>
          <p className="mt-2 font-heading text-3xl font-bold text-brand-dark">
            <BlitzCountUpNumber value={score} />
          </p>
        </div>
        <div className={blitzTile}>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Melhor combo</p>
          <p className="mt-2 flex items-center justify-center gap-1 font-heading text-3xl font-bold text-brand-dark">
            <Flame className="h-5 w-5 text-brand-dark" />
            <BlitzCountUpNumber value={maxCombo} delay={0.1} />
          </p>
        </div>
        <div className={blitzTile}>
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">Recorde</p>
          <p className="mt-2 flex items-center justify-center gap-1 font-heading text-3xl font-bold text-brand-dark">
            <Trophy className="h-5 w-5 text-brand-dark" />
            <BlitzCountUpNumber value={personalBest} delay={0.2} />
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3 sm:mt-8">
        <button type="button" onClick={onPlayAgain} className={`${blitzPrimaryBtn} inline-flex w-full justify-center`}>
          <RotateCcw className="h-4 w-4" />
          Jogar de novo
        </button>

        {missCardIds.length > 0 && canReviewMisses && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleReviewMisses}
              disabled={isReviewPending}
              className={`${blitzSoftBtn} inline-flex w-full justify-center disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Brain className="h-4 w-4" />
              {isReviewPending
                ? 'Enfileirando revisão...'
                : `Revisar ${missCardIds.length} ${missCardIds.length === 1 ? 'erro' : 'erros'}`}
            </button>
            {reviewError ? (
              <p className="text-center font-body text-xs font-semibold text-rose-600">{reviewError}</p>
            ) : (
              <p className="text-center font-body text-xs text-brand-secondary">
                Os cards vão para sua fila de revisão e dificuldades.
              </p>
            )}
          </div>
        )}

        {missCardIds.length > 0 && !canReviewMisses && (
          <p className="home-frosted-subtle rounded-container border border-brand-border px-3 py-2 text-center font-body text-xs text-brand-secondary">
            Para revisar os erros deste Blitz IA depois, salve o pack na sua biblioteca.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/blitz/ranking"
            onClick={onLeaveResult}
            className={`${blitzSoftBtn} inline-flex w-full justify-center`}
            transitionTypes={navBackTransitionTypes}
          >
            <Trophy className="h-4 w-4" />
            Ranking Blitz
          </Link>
          <Link
            href="/blitz"
            onClick={onLeaveResult}
            className={`${blitzSoftBtn} inline-flex w-full justify-center`}
            transitionTypes={navBackTransitionTypes}
          >
            <Zap className="h-4 w-4" />
            Início do Blitz
          </Link>
          <Link
            href="/home"
            onClick={onLeaveResult}
            className={`${blitzSoftBtn} inline-flex w-full justify-center`}
            transitionTypes={navBackTransitionTypes}
          >
            <Home className="h-4 w-4" />
            Ir para Home
          </Link>
        </div>
      </div>
    </m.div>
  )
}
