'use client'

import Image from 'next/image'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenCheck,
  Brain,
  CalendarClock,
  Layers,
  Target,
  Zap,
} from 'lucide-react'
import { m, AnimatePresence } from 'motion/react'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import type { GameMode } from '@/types/database.types'
import {
  reviewIconBox,
  reviewKbd,
  reviewKicker,
  reviewPanel,
  reviewPill,
  reviewSessionBanner,
  reviewStatRow,
  reviewStatRowAccent,
  reviewTelemetryBand,
  reviewTelemetryCell,
  reviewTile,
} from '@/features/review/lib/reviewPageUi'

type ReviewPhase = 'mode' | 'rate'

type ReviewStats = {
  newCards: number
  learning: number
  review: number
  sessionLimit: number
}

function TelemetryMetric({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string
  value: string
  icon: LucideIcon
  accent?: boolean
}) {
  return (
    <div className={`${reviewTelemetryCell}${accent ? ' border-brand-dark bg-brand-accent/40' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">{label}</p>
        <Icon className="h-3.5 w-3.5 shrink-0 text-brand-dark" strokeWidth={2.2} aria-hidden />
      </div>
      <p className="font-heading text-base font-bold leading-none text-brand-dark sm:text-lg">{value}</p>
    </div>
  )
}

function PhaseGuide({
  reviewPhase,
  currentStepLabel,
  activeReviewModes,
}: {
  reviewPhase: ReviewPhase
  currentStepLabel: string
  activeReviewModes: GameMode[]
}) {
  const isRating = reviewPhase === 'rate'
  const isQuickReview = activeReviewModes.length === 0

  return (
    <section className={reviewSessionBanner}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark">
            {isRating ? 'Avalie a retenção' : 'Um toque rápido'}
          </p>
          <p className="mt-1 font-body text-sm font-semibold leading-snug text-brand-secondary">
            {isRating
              ? isQuickReview
                ? 'Frase madura: avalie direto e siga. Difícil volta rápido; fácil ganha mais intervalo.'
                : 'Escolha como foi lembrar esta frase. Difícil volta rápido; fácil ganha mais intervalo.'
              : `Complete ${currentStepLabel} e avalie em seguida.`}
          </p>
        </div>
        <span className={`${reviewPill} shrink-0 bg-bg-card`}>
          {isRating ? 'Difícil · Bom · Fácil' : '1 exercício'}
        </span>
      </div>
    </section>
  )
}

interface ReviewSessionDetailsProps {
  isOpen: boolean
  isShortDailyReview: boolean
  activePackName: string
  currentStepLabel: string
  completedCount: number
  sessionTotal: number
  sessionProgress: number
  newCards: number
  stats: ReviewStats
  comboCount: number
  reviewPhase: ReviewPhase
  activeReviewModes: GameMode[]
}

export default function ReviewSessionDetails({
  isOpen,
  isShortDailyReview,
  activePackName,
  currentStepLabel,
  completedCount,
  sessionTotal,
  sessionProgress,
  newCards,
  stats,
  comboCount,
  reviewPhase,
  activeReviewModes,
}: ReviewSessionDetailsProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <m.div
          id="review-session-details"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="space-y-3 pt-1 sm:space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <SectionBadge label="Repetição espaçada" animate={false} />
              <span className={reviewPill}>{isShortDailyReview ? 'Revisão curta' : 'Sessão focada'}</span>
            </div>

            <p className="font-body text-sm leading-relaxed text-brand-secondary">
              {isShortDailyReview
                ? 'Até 10 frases hoje. Cada avaliação define quando a frase volta a aparecer.'
                : `${activePackName} · ${currentStepLabel}. Cada avaliação ajusta quando a frase volta.`}
            </p>

            <PhaseGuide
              reviewPhase={reviewPhase}
              currentStepLabel={currentStepLabel}
              activeReviewModes={activeReviewModes}
            />

            <div className={reviewTelemetryBand}>
              <TelemetryMetric label="Novos" value={String(stats.newCards)} icon={Layers} />
              <TelemetryMetric label="Aprendendo" value={String(stats.learning)} icon={Brain} />
              <TelemetryMetric label="Revisão" value={String(stats.review)} icon={BookOpenCheck} />
              <TelemetryMetric label="Meta curta" value={String(stats.sessionLimit)} icon={CalendarClock} />
              <TelemetryMetric label="Frase" value={`${completedCount + 1}/${sessionTotal}`} icon={Target} />
              <TelemetryMetric label="Combo" value={`${comboCount}x`} icon={Zap} accent={comboCount >= 2} />
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <section className={reviewPanel}>
                <p className={reviewKicker}>Fila de revisão</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                  <div className={reviewStatRow}>
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-brand-dark" />
                      <span className="font-body text-sm font-semibold text-brand-secondary">Novos</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-brand-dark">{stats.newCards}</span>
                  </div>
                  <div className={reviewStatRow}>
                    <div className="flex items-center gap-3">
                      <Brain className="h-4 w-4 text-brand-dark" />
                      <span className="font-body text-sm font-semibold text-brand-secondary">Aprendendo</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-brand-dark">{stats.learning}</span>
                  </div>
                  <div className={reviewStatRow}>
                    <div className="flex items-center gap-3">
                      <BookOpenCheck className="h-4 w-4 text-brand-dark" />
                      <span className="font-body text-sm font-semibold text-brand-secondary">Revisão</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-brand-dark">{stats.review}</span>
                  </div>
                  <div className={reviewStatRowAccent}>
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-4 w-4 text-brand-dark" />
                      <span className="font-body text-sm font-semibold text-brand-dark">Meta curta</span>
                    </div>
                    <span className="font-heading text-lg font-bold text-brand-dark">{stats.sessionLimit}</span>
                  </div>
                </div>
              </section>

              <section className={reviewPanel}>
                <p className={reviewKicker}>Atalhos</p>
                <div className="mt-4 space-y-2 font-body text-sm font-semibold text-brand-secondary">
                  <div className="flex items-center justify-between gap-3">
                    <span>Revelar resposta</span>
                    <kbd className={reviewKbd}>Space</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Difícil</span>
                    <kbd className={reviewKbd}>1</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Bom</span>
                    <kbd className={reviewKbd}>2</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Fácil</span>
                    <kbd className={reviewKbd}>3</kbd>
                  </div>
                  <p className="pt-1 font-body text-xs font-medium text-brand-secondary">
                    No celular: deslize ← difícil · centro bom · fácil →
                  </p>
                </div>
              </section>
            </div>

            <section className={`${reviewTile} p-4 sm:p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className={reviewPill}>Retenção</span>
                  <h2 className="mt-3 font-heading text-lg font-bold leading-snug text-brand-dark">
                    Como funciona
                  </h2>
                  <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">
                    Difícil traz a frase de volta em minutos. Bom mantém o ritmo atual. Fácil aumenta o intervalo
                    até a próxima revisão.
                  </p>
                  <p className="mt-3 font-heading text-sm font-bold text-brand-dark">
                    Progresso: {sessionProgress}% · Frase {completedCount + 1} de {sessionTotal}
                    {newCards > 0 ? ` · ${newCards} nova${newCards === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <div className={reviewIconBox}>
                  <Brain className={homeIconGlyph} strokeWidth={2.2} />
                </div>
              </div>

              <div
                className={`mt-4 flex min-h-[88px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:min-h-[100px]`}
              >
                <Image
                  src="/images/home/undraw-retention-chamber.svg"
                  alt="Ilustração de foco e memorização"
                  width={220}
                  height={180}
                  unoptimized
                  className="mx-auto h-auto w-full max-w-[140px] object-contain select-none sm:max-w-[160px]"
                />
              </div>
            </section>
          </div>
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}