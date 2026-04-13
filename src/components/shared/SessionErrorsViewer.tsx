'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react'

export type SessionErrorLog = {
  id: string
  created_at: string
  card_id: string
  cards: {
    english_phrase: string
    portuguese_translation: string
  } | null
}

export default function SessionErrorsViewer({ errors }: { errors: SessionErrorLog[] }) {
  const [open, setOpen] = useState(false)

  if (!errors || errors.length === 0) return null

  return (
    <div className="mx-6 mb-4 mt-2 overflow-hidden rounded-[16px] border border-red-100 bg-red-50/50">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100/50"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" strokeWidth={2.4} />
          Analise de desempenho: {errors.length} {errors.length === 1 ? 'falha detectada' : 'falhas detectadas'}
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1">
          <div className="grid gap-2 sm:grid-cols-2">
            {errors.map((err, idx) => (
              <div key={err.id || idx} className="rounded-xl border border-red-100 bg-white p-3.5 shadow-[0_2px_8px_-4px_rgba(239,68,68,0.2)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-[var(--color-text)]">
                      {err.cards?.english_phrase ?? 'Carta deletada'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {err.cards?.portuguese_translation ?? 'Desconhecido'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5" strokeWidth={2.4} />
                    {new Date(err.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
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
