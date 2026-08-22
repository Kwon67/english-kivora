'use client'

import { useId, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import ModalPortal from '@/components/ui/ModalPortal'
import { useFocusTrap } from '@/hooks/useFocusTrap'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  surfaceClassName?: string
  onConfirm: () => void
  onCancel: () => void
}

const confirmButtonClasses = {
  danger:
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-control border border-brand-dark bg-bg-card px-4 py-2 font-heading text-sm font-bold text-[var(--color-error)] transition-all hover:border-red-500/40 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/25 active:scale-95',
  warning:
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-control border border-brand-dark bg-brand-accent px-4 py-2 font-heading text-sm font-bold text-brand-dark transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-dark/25 active:scale-95',
}

const iconWrapClasses = {
  danger: 'border border-brand-dark bg-bg-card text-[var(--color-error)]',
  warning: 'border border-brand-dark bg-brand-accent text-brand-dark',
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  surfaceClassName = '',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)

  // This component is only mounted while the dialog is open, so the trap is always active.
  useFocusTrap({ active: true, containerRef: dialogRef, onClose: onCancel })

  return (
    <ModalPortal onClose={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={`relative my-auto w-full max-w-sm overflow-hidden rounded-container border border-brand-dark bg-bg-card shadow-offset-lg ${surfaceClassName}`}
      >
        <div className="relative border-b border-brand-dark px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${iconWrapClasses[variant]}`}
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                Confirmação
              </p>
              <h2 id={titleId} className="mt-2 font-heading text-lg font-bold leading-tight text-brand-dark">
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <p id={descriptionId} className="font-body text-sm leading-relaxed text-brand-secondary">
            {description}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-control border border-brand-dark bg-bg-card px-4 py-2 font-heading text-sm font-bold text-brand-dark transition-all hover:bg-brand-dark hover:text-white sm:w-auto"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full sm:w-auto ${confirmButtonClasses[variant]}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
