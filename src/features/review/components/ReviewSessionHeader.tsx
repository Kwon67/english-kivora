'use client'

import { ChevronDown, PanelRightOpen, X } from 'lucide-react'
import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'
import {
  reviewCloseBtn,
  reviewHero,
  reviewRetentionStrip,
  reviewRetentionStripBar,
  reviewRetentionStripPct,
  reviewRetentionStripTrack,
  reviewSoftBtn,
} from '@/features/review/lib/reviewPageUi'

interface ReviewSessionHeaderProps {
  sessionTitle: string
  completedCount: number
  sessionTotal: number
  sessionProgress: number
  detailsOpen: boolean
  onToggleDetails: () => void
  onClose: () => void
}

export default function ReviewSessionHeader({
  sessionTitle,
  completedCount,
  sessionTotal,
  sessionProgress,
  detailsOpen,
  onToggleDetails,
  onClose,
}: ReviewSessionHeaderProps) {
  const chevron = useRef<HTMLSpanElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const reduced = useHydratedReducedMotion()
  useGSAP(() => {
    gsap.to(chevron.current, { rotation: detailsOpen ? 180 : 0, duration: reduced ? 0 : 0.2, overwrite: true })
  }, { scope: chevron, dependencies: [detailsOpen, reduced] })
  useGSAP(() => {
    gsap.to(bar.current, { width: `${Math.max(8, sessionProgress)}%`, duration: reduced ? 0 : 0.5, ease: 'power2.out', overwrite: true })
  }, { scope: bar, dependencies: [sessionProgress, reduced] })
  return (
    <header className={`${reviewHero} p-3 sm:p-4`}>
      <div className="relative z-10 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-bold leading-tight text-brand-dark sm:text-xl">
              {sessionTitle}
            </h1>
            <p className="mt-1 font-body text-xs font-medium text-brand-secondary sm:text-sm">
              Frase {completedCount + 1} de {sessionTotal}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleDetails}
              aria-expanded={detailsOpen}
              aria-controls="review-session-details"
              aria-label={detailsOpen ? 'Ocultar detalhes da sessão' : 'Ver detalhes da sessão'}
              className={`${reviewSoftBtn} !px-3 !py-2 text-xs font-bold sm:text-sm`}
            >
              <PanelRightOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
              Detalhes
              <span ref={chevron}>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
              </span>
            </button>
            <button type="button" onClick={onClose} className={reviewCloseBtn} aria-label="Fechar revisão">
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className={reviewRetentionStrip}>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
              Progresso
            </p>
          </div>
          <div className={reviewRetentionStripTrack}>
            <div className={reviewRetentionStripBar}>
              <div ref={bar} style={{ width: 0 }}
                className="h-full rounded-full bg-brand-dark"
              />
            </div>
            <span className={reviewRetentionStripPct}>{sessionProgress}%</span>
          </div>
        </div>
      </div>
    </header>
  )
}
