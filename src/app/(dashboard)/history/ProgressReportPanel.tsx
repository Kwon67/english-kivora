import { CheckCircle2, HelpCircle, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { historyPanel, historySectionTitle } from '@/features/history/lib/historyUi'
import { homeNestedCardClass, homePillClass } from '@/lib/homeStyles'
import {
  MASTERED_INTERVAL_DAYS,
  MIN_ANSWERS_FOR_ACCURACY,
  type ProgressReport,
} from '@/features/review/lib/progressReport'

const TENDENCIA = {
  melhorando: { Icon: TrendingUp, texto: 'Você está acertando mais do que antes.' },
  piorando: { Icon: TrendingDown, texto: 'Você está acertando menos do que antes.' },
  estavel: { Icon: Minus, texto: 'Seu acerto está estável.' },
} as const

/**
 * O painel que responde "estou aprendendo?".
 *
 * Ele mostra de onde cada número vem. Um relatório de progresso que não pode ser conferido é
 * decoração: o aluno não tem como saber se "103 frases dominadas" quer dizer alguma coisa, e o
 * número mais bonito é sempre o mais fácil de inflar.
 */
export default function ProgressReportPanel({ report }: { report: ProgressReport }) {
  const tendencia = report.trend ? TENDENCIA[report.trend] : null

  return (
    <article className={historyPanel} aria-labelledby="progress-report-title">
      <SectionBadge label="Seu progresso" />
      <h2 id="progress-report-title" className={`${historySectionTitle} mt-3`}>
        Você está aprendendo?
      </h2>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className={`${homeNestedCardClass} p-4 sm:p-5`}>
          <p className={homePillClass}>Frases dominadas</p>
          <p className="mt-3 font-heading text-3xl font-bold leading-none text-brand-dark">
            {report.phrasesMastered}
          </p>
          <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
            de {report.phrasesTotal} que você já estudou. Conta como dominada a frase que você
            acerta com {MASTERED_INTERVAL_DAYS} dias ou mais entre uma revisão e outra.
          </p>
        </div>

        <div className={`${homeNestedCardClass} p-4 sm:p-5`}>
          <p className={homePillClass}>Taxa de acerto</p>
          {report.accuracy === null ? (
            <>
              <p className="mt-3 flex items-center gap-2 font-heading text-3xl font-bold leading-none text-brand-secondary">
                <HelpCircle className="h-6 w-6 shrink-0" strokeWidth={2.2} />
                —
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {report.accuracySample} resposta{report.accuracySample === 1 ? '' : 's'} até agora.
                A partir de {MIN_ANSWERS_FOR_ACCURACY} dá para mostrar um número que signifique
                algo — antes disso seria chute com cara de estatística.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-heading text-3xl font-bold leading-none text-brand-dark">
                {report.accuracy}%
              </p>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                sobre {report.accuracySample} respostas suas nas partidas.
              </p>
            </>
          )}
        </div>
      </div>

      {tendencia ? (
        <p className="mt-4 flex items-start gap-2 font-body text-sm leading-relaxed text-brand-secondary">
          <tendencia.Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.2} />
          {tendencia.texto}
        </p>
      ) : null}

      {report.duplicatesCollapsed > 0 ? (
        <p className="mt-4 flex items-start gap-2 font-body text-xs leading-relaxed text-brand-secondary">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
          {report.duplicatesCollapsed} card{report.duplicatesCollapsed === 1 ? '' : 's'} que
          repet{report.duplicatesCollapsed === 1 ? 'e' : 'em'} uma frase já contada
          {report.duplicatesCollapsed === 1 ? ' foi descontado' : ' foram descontados'} — packs
          diferentes trazem frases iguais, e contar as duas vezes inflaria o total.
        </p>
      ) : null}
    </article>
  )
}
