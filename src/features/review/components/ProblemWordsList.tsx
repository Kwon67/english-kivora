'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Play, Search } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  getProblemWordSeverity,
  getProblemWordSeverityPillClass,
  getProblemWordSeverityRailClass,
  problemWordsPrimaryBtn,
  problemWordsSearchInput,
} from '@/features/review/lib/problemWordsUi'

export type ProblemWord = {
  id: string
  en: string
  pt: string
  count: number
  lastSeen: string
  lastSeenLabel: string
}

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
    <div className="px-4 py-6 text-center sm:py-8">
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
          <Link href={actionHref} transitionTypes={navForwardTransitionTypes} className={problemWordsPrimaryBtn}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function ErrorTally({ count }: { count: number }) {
  const slots = Math.min(count, 5)

  return (
    <div className="flex items-center gap-1" aria-label={`${count} ${count === 1 ? 'erro registrado' : 'erros registrados'}`}>
      {Array.from({ length: slots }).map((_, index) => (
        <span
          key={index}
          className={`h-2 w-2 rounded-full border border-brand-dark ${
            index < 3 ? 'bg-brand-dark' : 'bg-brand-accent'
          }`}
        />
      ))}
      {count > 5 ? (
        <span className="ml-0.5 font-heading text-2xs font-bold text-brand-secondary">+{count - 5}</span>
      ) : null}
    </div>
  )
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
        imageSrc="/images/mindmarket/discovery.png"
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
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por inglês ou português..."
          className={problemWordsSearchInput}
          aria-label="Buscar palavras críticas"
        />
      </label>

      {filteredWords.length === 0 ? (
        <BrandEmpty
          imageSrc="/images/mindmarket/discovery.png"
          imageAlt="Nenhum resultado na busca"
          title="Nenhum resultado"
          description={`Nenhum resultado para "${query.trim()}".`}
          imageClassName="max-w-24"
        />
      ) : (
        <ul className="problem-words-rows" role="list">
          {filteredWords.map((word) => {
            const severity = getProblemWordSeverity(word.count)

            return (
              <li
                key={word.id}
                className={`problem-word-card ${getProblemWordSeverityRailClass(severity)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 basis-52">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 lang="en" className="font-heading text-lg font-semibold text-brand-dark sm:text-xl">{word.en}</h3>
                      <span
                        className={`inline-flex rounded-full border border-brand-dark px-2.5 py-1 font-heading text-2xs font-bold uppercase tracking-widest ${getProblemWordSeverityPillClass(severity)}`}
                      >
                        {severity}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">{word.pt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <ErrorTally count={word.count} />
                      <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">
                        Último erro: {word.lastSeenLabel}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/review?source=problem&cards=${word.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className={`${problemWordsPrimaryBtn} shrink-0`}
                  >
                    <Play className="h-3.5 w-3.5 shrink-0" />
                    Praticar agora
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p role="status" className="font-body text-sm text-brand-secondary">
        {filteredWords.length} de {words.length} {words.length === 1 ? 'termo' : 'termos'} dos últimos 30 dias.
      </p>
    </div>
  )
}