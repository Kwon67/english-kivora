import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { LEECH_LAPSES_THRESHOLD } from '@/features/review/lib/leech'
import type { LeechCard } from '@/features/review/lib/leechCards'
import {
  problemWordsPanel,
  problemWordsFrostedSubtle,
  problemWordsSectionTitle,
  problemWordsSoftBtn,
} from '@/features/review/lib/problemWordsUi'
import { homeNestedCardClass, homeSmallPillClass } from '@/lib/homeStyles'

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
      <div className="flex flex-wrap items-center gap-2">
        <SectionBadge label="Fora da fila" />
        <span className={homeSmallPillClass}>{cards.length}</span>
      </div>

      <h2 id="leech-titulo" className={`${problemWordsSectionTitle} mt-3`}>
        Frases que a repetição não resolveu
      </h2>
      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
        Você já esqueceu cada uma pelo menos {LEECH_LAPSES_THRESHOLD} vezes depois de tê-la
        aprendido. Elas saíram da revisão automática para não ocupar suas vagas do dia — repetir do
        mesmo jeito é justamente o que não funcionou. Tente ouvir, escrever ou quebrar a frase em
        partes menores.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.cardId} className={`${homeNestedCardClass} ${problemWordsFrostedSubtle} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 font-heading text-sm font-bold text-brand-dark">{card.en}</p>
              <span className={`${homeSmallPillClass} shrink-0 gap-1`}>
                <AlertTriangle className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                {card.lapses}
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
      </ul>
    </section>
  )
}
