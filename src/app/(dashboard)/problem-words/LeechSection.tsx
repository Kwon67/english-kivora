import { WorkspaceList } from '@/components/ui/WorkspacePagination'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { LEECH_LAPSES_THRESHOLD } from '@/features/review/lib/leech'
import type { LeechCard } from '@/features/review/lib/leechCards'
import {
  problemWordsPanel,
  problemWordsSectionTitle,
  problemWordsSoftBtn,
} from '@/features/review/lib/problemWordsUi'
import { homeSmallPillClass } from '@/lib/homeStyles'

/**
 * As frases que saíram da fila automática.
 *
 * Sem esta seção elas seriam um buraco negro: parariam de aparecer na revisão sem que ninguém
 * soubesse por quê. Aqui a pessoa vê quais são, quantas vezes esqueceu cada uma, e pode revisá-las
 * de propósito — repetir do mesmo jeito é o que já não funcionou.
 */
export default function LeechSection({ cards }: { cards: LeechCard[] }) {
  if (cards.length === 0) return null

  return (
    <section className={problemWordsPanel} aria-labelledby="leech-titulo">
      <h2 id="leech-titulo" className={problemWordsSectionTitle}>Frases fora da fila automática</h2>
      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
        Você esqueceu cada frase pelo menos {LEECH_LAPSES_THRESHOLD} vezes depois de aprendê-la.
        Tente ouvir, escrever ou dividir a frase em partes menores antes de revisar.
      </p>

      <WorkspaceList as="ol" pageSize={4} className="problem-words-rows mt-4">
        {cards.map((card) => (
          <li key={card.cardId} className="py-4">
            <div className="flex items-start justify-between gap-3">
              <p lang="en" className="min-w-0 font-heading text-base font-semibold text-brand-dark">{card.en}</p>
              <span className={`${homeSmallPillClass} shrink-0 gap-1`}>
                <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                {card.lapses} {card.lapses === 1 ? 'erro' : 'erros'}
              </span>
            </div>
            <p className="mt-1.5 font-body text-sm leading-relaxed text-brand-secondary">{card.pt}</p>

            <Link
              href={`/review?source=problem&cards=${card.cardId}`}
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className={`${problemWordsSoftBtn} mt-3`}
            >
              Revisar esta
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </li>
        ))}
      </WorkspaceList>
    </section>
  )
}
