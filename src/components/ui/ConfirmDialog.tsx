'use client'

import { useEffect, useId, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

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
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-[rgba(186,26,26,0.22)] bg-[rgba(186,26,26,0.1)] px-4 py-2 text-sm font-bold text-[var(--color-error)] shadow-sm transition-all hover:bg-[rgba(186,26,26,0.16)] focus:outline-none focus:ring-2 focus:ring-[var(--color-error)]/25 active:scale-95',
  warning:
    'inline-flex min-h-[2.75rem] items-center justify-center rounded-xl border border-[rgba(154,91,19,0.22)] bg-[var(--color-accent-light)] px-4 py-2 text-sm font-bold text-[var(--color-warning)] shadow-sm transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-[var(--color-warning)]/25 active:scale-95',
}

const iconWrapClasses = {
  danger: 'bg-[rgba(186,26,26,0.1)] text-[var(--color-error)]',
  warning: 'bg-[var(--color-accent-light)] text-[var(--color-warning)]',
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
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050704]/15 p-4 backdrop-blur-2xl dark:bg-black/50"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="premium-card relative w-full max-w-sm overflow-hidden shadow-[var(--shadow-xl)]"
      >
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
        <div className="relative border-b border-border bg-[var(--color-surface-container-low)] px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconWrapClasses[variant]}`}
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="section-kicker">Confirmação</p>
              <h2 id={titleId} className="mt-2 font-montserrat text-lg font-bold leading-tight text-text">
                {title}
              </h2>
            </div>
          </div>
        </div>

        <div className="relative px-5 py-5 sm:px-6 sm:py-6">
          <p id={descriptionId} className="text-sm leading-relaxed text-text-muted">
            {description}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="btn-ghost w-full sm:w-auto">
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
    </div>
  )
}