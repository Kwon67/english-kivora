'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import ModalPortal from '@/components/ui/ModalPortal'
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

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, open])

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
    <ModalPortal
      onClose={onClose}
      className="fixed inset-0 z-[120] flex min-h-[100svh] items-center justify-center overflow-y-auto overscroll-contain bg-brand-dark/20 p-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-pack-title"
        className="my-auto flex max-h-[min(90svh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)]"
      >
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-[0.62rem] font-bold uppercase tracking-widest text-brand-secondary">
                Adicionar à rotina
              </p>
              <h2 id="assign-pack-title" className="mt-2 font-heading text-xl font-bold text-brand-dark">
                {packName}
              </h2>
              <p className="mt-1 font-body text-sm text-brand-secondary">
                Escolha como você quer estudar este pack hoje.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-brand-dark bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white"
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
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                    active
                      ? 'border-brand-dark bg-brand-accent text-brand-dark'
                      : 'border-brand-dark bg-bg-card text-brand-dark hover:bg-bg-primary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
                    <span className="font-body text-sm font-semibold">{mode.label}</span>
                  </div>
                  <p className="mt-1 font-body text-xs leading-relaxed text-brand-secondary">{mode.note}</p>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-bg-card px-4 py-2 font-body text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-4 py-2 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)]"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Adicionar à rotina
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
