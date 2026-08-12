'use client'

import { ChevronDown, PanelRightOpen, X } from 'lucide-react'
import { m } from 'framer-motion'
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
              <PanelRightOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.2} />
              Detalhes
              <m.span animate={{ rotate: detailsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.4} />
              </m.span>
            </button>
            <button type="button" onClick={onClose} className={reviewCloseBtn} aria-label="Fechar revisão">
              <X className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className={reviewRetentionStrip}>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
              Progresso
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
      </div>
    </header>
  )
}