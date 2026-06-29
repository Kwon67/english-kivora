'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Search } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

export type ProblemWord = {
  id: string
  en: string
  pt: string
  count: number
  lastSeen: string
  lastSeenLabel: string
}

const emptyCardClass =
  'rounded-2xl border-2 border-brand-dark bg-bg-card p-6 text-center shadow-[6px_6px_0_var(--color-brand-dark)] sm:p-8'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-5 py-2.5 font-body text-sm font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)] transition hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0_var(--color-brand-accent)]'

function BrandEmpty({
  imageSrc,
  imageAlt,
  title,
  description,
  actionHref,
  actionLabel,
  imageClassName = 'max-w-36',
}: {
  imageSrc: string
  imageAlt: string
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  imageClassName?: string
}) {
  return (
    <div className={emptyCardClass}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={849}
        height={842}
        unoptimized
        className={`mx-auto h-auto w-full object-contain ${imageClassName}`}
      />
      <h3 className="mt-4 font-heading text-lg font-bold text-brand-dark sm:text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md font-body text-sm leading-relaxed text-brand-secondary">{description}</p>
      {actionHref && actionLabel ? (
        <div className="mt-6">
          <Link href={actionHref} transitionTypes={navForwardTransitionTypes} className={primaryBtn}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function getSeverity(count: number) {
  if (count >= 3) return 'CRÍTICO'
  if (count === 2) return 'MÉDIO'
  return 'LEVE'
}

function getSeverityClass(severity: string) {
  if (severity === 'CRÍTICO') return 'border-brand-dark bg-brand-dark text-white'
  if (severity === 'MÉDIO') return 'border-brand-dark bg-brand-accent text-brand-dark'
  return 'border-brand-dark bg-bg-primary text-brand-secondary'
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
      <BrandEmpty
        imageSrc="/images/home/undraw-online-learning.svg"
        imageAlt="Ilustração de estudo sem palavras problemáticas"
        title="Nenhuma dificuldade registrada"
        description="Quando você errar cards nas sessões, eles aparecerão aqui para revisão focada."
        actionHref="/review"
        actionLabel="Ir para revisão"
      />
    )
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 rounded-xl border-2 border-brand-dark bg-bg-card px-4 py-3 shadow-[4px_4px_0_var(--color-brand-dark)]">
        <Search className="h-4 w-4 shrink-0 text-brand-secondary" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por inglês ou português..."
          className="w-full bg-transparent font-body text-sm text-brand-dark outline-none placeholder:text-brand-secondary"
          aria-label="Buscar palavras críticas"
        />
      </label>

      {filteredWords.length === 0 ? (
        <BrandEmpty
          imageSrc="/images/home/undraw-online-learning.svg"
          imageAlt="Nenhum resultado na busca"
          title="Nenhum resultado"
          description={`Nenhum resultado para "${query.trim()}".`}
          imageClassName="max-w-24"
        />
      ) : (
        <div className="space-y-3">
          {filteredWords.map((word) => {
            const severity = getSeverity(word.count)

            return (
              <article key={word.id} className="scroll-reveal rounded-2xl border-2 border-brand-dark bg-bg-card p-5 shadow-[6px_6px_0_var(--color-brand-dark)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-xl font-bold text-brand-dark">{word.en}</h2>
                      <span className={`inline-flex rounded-full border px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest ${getSeverityClass(severity)}`}>{severity}</span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">{word.pt}</p>
                    <p className="mt-3 font-body text-xs text-brand-secondary">
                      Último erro: {word.lastSeenLabel}
                    </p>
                  </div>
                  <Link
                    href={`/review?source=problem&cards=${word.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand-dark px-4 py-2 font-body text-xs font-semibold text-white shadow-[3px_3px_0_var(--color-brand-accent)]"
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
