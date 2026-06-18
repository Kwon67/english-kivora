'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { selfAssignPackAction } from '@/app/member-assign-actions'
import { GAME_MODE_OPTIONS } from '@/features/game/lib/gameModes'
import { notify } from '@/lib/toast'
import type { GameMode } from '@/types/database.types'

type AssignPackModalProps = {
  packId: string
  packName: string
  open: boolean
  onClose: () => void
  redirectToPlay?: boolean
}

export default function AssignPackModal({
  packId,
  packName,
  open,
  onClose,
  redirectToPlay = false,
}: AssignPackModalProps) {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<GameMode>('flashcard')
  const [isPending, startTransition] = useTransition()

  const handleConfirm = useCallback(() => {
    startTransition(async () => {
      const result = await selfAssignPackAction({ packId, gameMode: selectedMode })

      if (!result.success) {
        notify.error(result.error)
        return
      }

      notify.success('Pack adicionado à sua rotina')
      onClose()

      if (redirectToPlay) {
        router.push(`/play/${result.assignmentId}`)
        return
      }

      router.refresh()
    })
  }, [onClose, packId, redirectToPlay, router, selectedMode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-[rgba(16,19,15,0.55)] p-4 backdrop-blur-[2px] sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-pack-title"
        className="w-full max-w-lg rounded-[1.25rem] border border-border-muted/20 bg-card p-5 shadow-[var(--shadow-xl)] dark:border-border-accent/20 dark:bg-card sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.14em] text-text-subtle">
              Adicionar à rotina
            </p>
            <h2 id="assign-pack-title" className="mt-2 font-montserrat text-xl font-bold text-text">
              {packName}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Escolha como você quer estudar este pack hoje.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-container-low hover:text-text"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {GAME_MODE_OPTIONS.map((mode) => {
            const Icon = mode.icon
            const active = selectedMode === mode.id

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSelectedMode(mode.id)}
                className={`rounded-[0.9rem] border px-3 py-3 text-left transition-colors ${
                  active
                    ? 'border-primary/30 bg-primary-light text-primary dark:border-primary/30 dark:bg-primary/12'
                    : 'border-border-muted/18 bg-surface-container-lowest text-text hover:border-primary/20 dark:border-border-accent/18 dark:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                  <span className="text-sm font-bold">{mode.label}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-muted">{mode.note}</p>
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost min-h-10"
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="btn-primary min-h-10"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Adicionar à rotina
          </button>
        </div>
      </div>
    </div>
  )
}