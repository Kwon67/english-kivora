'use client'

import { useEffect, useState } from 'react'
import { Compass, Home, ListChecks, X } from 'lucide-react'
import { trackUxEvent } from '@/lib/uxAnalytics'

const STORAGE_KEY = 'kivora_wayfinding_glossary_v1'

const hints = [
  {
    Icon: Home,
    title: 'Início',
    description: 'Dashboard com seu próximo passo do dia.',
  },
  {
    Icon: ListChecks,
    title: 'Rotina',
    description: 'Fila de atividades que você gerencia e inicia.',
  },
  {
    Icon: Compass,
    title: 'Explorar',
    description: 'Catálogo para descobrir e adicionar novos packs.',
  },
] as const

export default function NavWayfindingHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY)
      if (dismissed === '1') return
      setVisible(true)
      trackUxEvent('wayfinding_glossary_shown')
    } catch {
      setVisible(false)
    }
  }, [])

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore quota errors
    }
    trackUxEvent('wayfinding_glossary_dismissed')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <section
      role="note"
      aria-label="Guia de navegação"
      className="relative z-10 mb-6 overflow-hidden rounded-container border border-border-muted/20 bg-card p-4 shadow-[0_12px_34px_rgba(28, 25, 21,0.10)] sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-2xs font-black uppercase tracking-[0.14em] text-primary">
            Como navegar
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Três áreas principais do app — use o menu superior para alternar entre elas.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {hints.map((hint) => {
              const Icon = hint.Icon
              return (
                <div
                  key={hint.title}
                  className="rounded-xl border border-border-muted/18 bg-surface-container-low px-3 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.2} />
                    <span className="text-xs font-bold text-text">{hint.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{hint.description}</p>
                </div>
              )
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-border-muted/20 bg-card px-3 py-1.5 text-xs font-bold text-text-muted transition-colors hover:text-primary"
        >
          <X className="h-3.5 w-3.5" />
          Entendi
        </button>
      </div>
    </section>
  )
}