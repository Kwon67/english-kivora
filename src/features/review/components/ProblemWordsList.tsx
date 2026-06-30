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
  problemWordsCard,
  problemWordsPrimaryBtn,
  problemWordsSearchInput,
  problemWordsWordCard,
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
    <div className={`${problemWordsCard} p-6 text-center sm:p-8`}>
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
    <div className="flex items-center gap-1" aria-label={`${count} erros registrados`}>
      {Array.from({ length: slots }).map((_, index) => (
        <span
          key={index}
          className={`h-2 w-2 rounded-full border border-brand-dark ${
            index < 3 ? 'bg-brand-dark' : 'bg-brand-accent'
          }`}
        />
      ))}
      {count > 5 ? (
        <span className="ml-0.5 font-heading text-[10px] font-bold text-brand-secondary">+{count - 5}</span>
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
        imageSrc="/images/home/undraw-searching-focus.svg"
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
          imageSrc="/images/home/undraw-searching-focus.svg"
          imageAlt="Nenhum resultado na busca"
          title="Nenhum resultado"
          description={`Nenhum resultado para "${query.trim()}".`}
          imageClassName="max-w-24"
        />
      ) : (
        <div className="space-y-3">
          {filteredWords.map((word) => {
            const severity = getProblemWordSeverity(word.count)

            return (
              <article
                key={word.id}
                className={`${problemWordsWordCard} ${getProblemWordSeverityRailClass(severity)} scroll-reveal`}
              >
                <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between sm:pl-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-lg font-bold text-brand-dark sm:text-xl">{word.en}</h2>
                      <span
                        className={`inline-flex rounded-full border border-brand-dark px-2.5 py-1 font-heading text-[10px] font-bold uppercase tracking-widest ${getProblemWordSeverityPillClass(severity)}`}
                      >
                        {severity}
                      </span>
                    </div>
                    <p className="mt-2 font-body text-sm leading-relaxed text-brand-secondary">{word.pt}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <ErrorTally count={word.count} />
                      <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                        Último erro: {word.lastSeenLabel}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/review?source=problem&cards=${word.id}`}
                    transitionTypes={navForwardTransitionTypes}
                    className={`${problemWordsPrimaryBtn} w-full shrink-0 sm:w-auto`}
                  >
                    <Play className="h-3.5 w-3.5 shrink-0" />
                    Praticar agora
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="text-center font-body text-xs text-brand-secondary">
        Mostrando até 8 termos com mais erros nos últimos 30 dias.
      </p>
    </div>
  )
}