'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react'
import { formatAppDateTime } from '@/lib/timezone'

import AudioButton from './AudioButton'

export type SessionErrorLog = {
  id: string
  created_at: string
  card_id: string
  cards: {
    english_phrase: string
    portuguese_translation: string
    audio_url?: string | null
  } | null
}

export default function SessionErrorsViewer({ errors }: { errors: SessionErrorLog[] }) {
  const [open, setOpen] = useState(true)

  if (!errors || errors.length === 0) return null

  const sortedErrors = [...errors].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="mb-4 mt-2 overflow-hidden rounded-[16px] border border-[rgba(186,26,26,0.15)] bg-[rgba(186,26,26,0.04)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[rgba(186,26,26,0.08)]"
      >
        <div className="flex items-center gap-2 text-left">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          <span>Falhas da partida: {errors.length} {errors.length === 1 ? 'erro registrado' : 'erros registrados'}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-4 pt-1 sm:px-4">
          <p className="mb-3 px-1 text-sm text-[var(--color-text-muted)]">
            Todos os erros desta partida aparecem abaixo em ordem cronológica.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedErrors.map((err, idx) => (
              <div key={err.id || idx} className="rounded-xl border border-[rgba(186,26,26,0.1)] bg-[var(--color-surface-container)] p-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-error)]">
                      Falha {idx + 1}
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="text-base font-bold leading-tight text-[var(--color-text)]">
                        {err.cards?.english_phrase ?? 'Carta deletada'}
                      </p>
                      {err.cards?.audio_url && (
                        <AudioButton url={err.cards.audio_url} className="-mt-0.5 scale-90" />
                      )}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {err.cards?.portuguese_translation ?? 'Desconhecido'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center self-start gap-1.5 rounded-full bg-[var(--color-surface-container-low)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-text-subtle)]">
                    <Clock className="h-3 w-3" strokeWidth={2.4} />
                    {formatAppDateTime(err.created_at, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
