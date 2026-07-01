'use client'

import { useEffect, useId, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import ModalPortal from '@/components/ui/ModalPortal'

type ConfirmDialogProps = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}

const confirmButtonClasses = {
  danger:
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card px-4 py-2 font-heading text-sm font-bold text-[var(--color-error)] transition-all hover:border-red-500/40 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/25 active:scale-95',
  warning:
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-[13px] border border-brand-dark bg-brand-accent px-4 py-2 font-heading text-sm font-bold text-brand-dark transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-dark/25 active:scale-95',
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    firstFocusable?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key !== 'Tab') return

      const focusableElements = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      )

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
        return
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [onCancel])

  return (
    <ModalPortal onClose={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative my-auto w-full max-w-sm overflow-hidden rounded-[13px] border border-brand-dark bg-bg-card shadow-[6px_6px_0_#1C1915]"
      >
        <div className="relative border-b border-brand-dark px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] ${iconWrapClasses[variant]}`}
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
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
              className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card px-4 py-2 font-heading text-sm font-bold text-brand-dark transition-all hover:bg-brand-dark hover:text-white sm:w-auto"
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
