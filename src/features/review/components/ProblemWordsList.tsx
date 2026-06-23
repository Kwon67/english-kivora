'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Play, Search } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'

import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export type ProblemWord = {
  id: string
  en: string
  pt: string
  count: number
  lastSeen: string
  lastSeenLabel: string
}

function getSeverity(count: number) {
  if (count >= 3) return 'CRÍTICO'
  if (count === 2) return 'MÉDIO'
  return 'LEVE'
}

function getSeverityClass(severity: string) {
  if (severity === 'CRÍTICO') return 'bg-[rgba(186,26,26,0.08)] text-[var(--color-error)]'
  if (severity === 'MÉDIO') return 'bg-[rgba(115,88,2,0.08)] text-[var(--color-accent)]'
  return 'bg-[var(--color-surface-container)] text-text-subtle'
}

interface ProblemWordsListProps {
  words: ProblemWord[]
}

export default function ProblemWordsList({ words }: ProblemWordsListProps) {
  const [query, setQuery] = useState('')

  const filteredWords = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return words

    return words.filter(
      (word) =>
        word.en.toLowerCase().includes(normalized) ||
        word.pt.toLowerCase().includes(normalized)
    )
  }, [query, words])

  if (words.length === 0) {
    return (
      <EmptyState
        imageSrc="/images/home/undraw-online-learning.svg"
        imageAlt="Ilustração unDraw de estudo sem palavras problemáticas"
        title="Nenhuma dificuldade registrada"
        description="Quando você errar cards nas sessões, eles aparecerão aqui para revisão focada."
        actionHref="/review"
        actionLabel="Ir para revisão"
        transitionTypes={navForwardTransitionTypes}
        variant="glass"
      />
    )
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-[1rem] bg-[var(--color-surface-container-low)] px-4 py-3">
        <Search className="h-4 w-4 shrink-0 text-text-subtle" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por inglês ou português..."
          className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
          aria-label="Buscar palavras críticas"
        />
      </label>

      {filteredWords.length === 0 ? (
        <EmptyState
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Nenhum resultado na busca"
          title="Nenhum resultado"
          description={`Nenhum resultado para "${query.trim()}".`}
          variant="glass"
          className="py-5"
          imageClassName="max-w-24"
        />
      ) : (
        <div className="space-y-3">
          {filteredWords.map((word) => {
            const severity = getSeverity(word.count)

            return (
              <article key={word.id} className="premium-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-text">{word.en}</h2>
                      <span className={`stitch-pill ${getSeverityClass(severity)}`}>{severity}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-text-muted">{word.pt}</p>
                    <p className="mt-3 text-xs text-text-subtle">
                      Último erro: {word.lastSeenLabel}
                    </p>
                  </div>
                  <Link
                    href={`/review?source=problem&cards=${word.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Praticar agora
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}