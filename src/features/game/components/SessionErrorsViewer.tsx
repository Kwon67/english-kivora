'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertCircle, Clock } from 'lucide-react'
import { formatAppDateTime } from '@/lib/timezone'

import AudioButton from '@/components/ui/AudioButton'

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

/**
 * `defaultOpen` continua true para não mudar quem já usa isto (a página de admin). Em uma LISTA
 * de sessões, porém, abrir tudo de uma vez é o que fazia a área de foco do histórico ocupar
 * 9.324px — 11 telas de rolagem, e uma única partida com 3.426px.
 */
export default function SessionErrorsViewer({
  errors,
  defaultOpen = true,
}: {
  errors: SessionErrorLog[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (!errors || errors.length === 0) return null

  const sortedErrors = [...errors].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Fechado, o mb-4 é margem embaixo de nada: só reserva espaço quando há lista aberta.
  return (
    <div
      className={`${open ? 'mb-4' : ''} mt-2 overflow-hidden rounded-[20px] border-2 border-brand-dark bg-bg-card shadow-[4px_4px_0_var(--color-brand-dark)]`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between border-b border-brand-border px-4 py-3 font-body text-sm font-semibold text-brand-dark transition-colors hover:bg-bg-primary"
      >
        <div className="flex items-center gap-2 text-left">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2.4} />
          {/* Curto de propósito: numa lista de sessões a contagem de erros já aparece como pílula
              logo acima deste botão, e o rótulo antigo ("Falhas da partida: 7 erros registrados")
              repetia o número e quebrava em duas linhas no telefone. */}
          <span>Ver {errors.length === 1 ? 'o erro' : `os ${errors.length} erros`}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div className="px-3 pb-4 pt-1 sm:px-4">
          <p className="mb-3 px-1 font-body text-sm text-brand-secondary">
            Todos os erros desta partida aparecem abaixo em ordem cronológica.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {sortedErrors.map((err, idx) => (
              <div key={err.id || idx} className="rounded-xl border border-brand-border bg-bg-primary p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <p className="mb-1.5 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark">
                      Falha {idx + 1}
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="font-body text-base font-semibold leading-tight text-brand-dark">
                        {err.cards?.english_phrase ?? 'Carta deletada'}
                      </p>
                      {err.cards?.audio_url && (
                        <AudioButton url={err.cards.audio_url} className="-mt-0.5 scale-90" />
                      )}
                    </div>
                    <p className="mt-1.5 font-body text-sm leading-relaxed text-brand-secondary">
                      {err.cards?.portuguese_translation ?? 'Desconhecido'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center self-start gap-1.5 rounded-full border border-brand-border bg-bg-card px-2.5 py-1 font-heading text-[10px] font-bold text-brand-secondary">
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
