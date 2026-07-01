'use client'

import Image from 'next/image'
import { Brain, X } from 'lucide-react'
import { m } from 'framer-motion'
import SectionBadge from '@/components/ui/SectionBadge'
import FocusModePlayer from '@/features/game/components/FocusModePlayer'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import {
  reviewHero,
  reviewPill,
  reviewRetentionStrip,
  reviewRetentionStripBar,
  reviewRetentionStripPct,
  reviewRetentionStripTrack,
  reviewCloseBtn,
  reviewIconBox,
  reviewTile,
} from '@/features/review/lib/reviewPageUi'

interface ReviewSessionHeaderProps {
  sessionTitle: string
  isShortDailyReview: boolean
  activePackName: string
  currentStepLabel: string
  completedCount: number
  sessionTotal: number
  sessionProgress: number
  newCards: number
  onClose: () => void
}

export default function ReviewSessionHeader({
  sessionTitle,
  isShortDailyReview,
  activePackName,
  currentStepLabel,
  completedCount,
  sessionTotal,
  sessionProgress,
  newCards,
  onClose,
}: ReviewSessionHeaderProps) {
  const mobileSubtitle = isShortDailyReview
    ? 'Até 10 frases · SM-2 agenda o retorno'
    : `${activePackName} · ${currentStepLabel}`

  const desktopSubtitle = isShortDailyReview
    ? 'Até 10 frases hoje. Revise no seu ritmo — um toque rápido quando precisar e avalie para seguir.'
    : `${activePackName} · ${currentStepLabel}`

  return (
    <header className={`${reviewHero} p-3 sm:p-6 lg:p-8`}>
      <div className="relative z-10 grid min-w-0 gap-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3 lg:hidden">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <SectionBadge label="Repetição espaçada" animate={false} />
              <span className={reviewPill}>
                {isShortDailyReview ? 'Revisão curta' : 'Sessão focada'}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <FocusModePlayer />
              <button type="button" onClick={onClose} className={reviewCloseBtn} aria-label="Fechar revisão">
                <X className="h-4 w-4" strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            <SectionBadge label="Repetição espaçada" animate={false} />
            <span className={reviewPill}>
              {isShortDailyReview ? 'Revisão curta' : 'Sessão focada'}
            </span>
          </div>

          <h1 className="mt-2 font-heading text-xl font-bold leading-[1.1] text-brand-dark sm:mt-4 sm:text-2xl lg:text-4xl">
            {sessionTitle}
          </h1>

          <p className="mt-1.5 truncate font-body text-xs font-medium text-brand-secondary sm:mt-2 sm:text-sm lg:hidden">
            {mobileSubtitle}
          </p>

          <p className="mt-2 hidden font-body text-sm leading-relaxed text-brand-secondary sm:text-base lg:block">
            {desktopSubtitle}
          </p>

          {isShortDailyReview ? (
            <p className="mt-1 hidden font-body text-xs font-semibold text-brand-secondary lg:block">
              {activePackName} · {currentStepLabel}
            </p>
          ) : null}

          <div className={`${reviewRetentionStrip} mt-3 sm:mt-5`}>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Progresso da sessão
              </p>
              <p className="mt-1 break-words font-heading text-sm font-bold leading-snug text-brand-dark sm:text-lg md:text-xl">
                Frase {completedCount + 1} de {sessionTotal}
                {newCards > 0 ? ` · ${newCards} nova${newCards === 1 ? '' : 's'}` : ''}
              </p>
            </div>
            <div className={reviewRetentionStripTrack}>
              <div className={reviewRetentionStripBar}>
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, sessionProgress)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="h-full rounded-full bg-brand-dark"
                />
              </div>
              <span className={reviewRetentionStripPct}>{sessionProgress}%</span>
            </div>
          </div>

          <div className="mt-4 hidden items-center gap-2 lg:flex">
            <FocusModePlayer />
            <button type="button" onClick={onClose} className={reviewCloseBtn} aria-label="Fechar revisão">
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className={`${reviewTile} hidden p-4 sm:p-5 lg:block`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={reviewPill}>Retenção</span>
              <h2 className="mt-3 font-heading text-lg font-bold leading-snug text-brand-dark sm:text-xl">
                Câmara ativa
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                Cada avaliação recalibra o intervalo da frase. Difícil volta rápido; fácil ganha mais dias de descanso.
              </p>
            </div>
            <div className={reviewIconBox}>
              <Brain className={homeIconGlyph} strokeWidth={2.2} />
            </div>
          </div>

          <div
            className={`mt-4 flex min-h-[100px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:min-h-[120px]`}
          >
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[160px] sm:max-w-[180px]"
            >
              <Image
                src="/images/home/undraw-retention-chamber.svg"
                alt="Ilustração de foco e memorização"
                width={280}
                height={220}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Fase</p>
              <p className="mt-1 truncate font-heading text-sm font-bold text-brand-dark">{currentStepLabel}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Pack</p>
              <p className="mt-1 truncate font-heading text-sm font-bold text-brand-dark">{activePackName}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}