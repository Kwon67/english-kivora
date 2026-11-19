import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import styles from './History.module.css'
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

export default function ProgressReportPanel({ report }: { report: ProgressReport }) {
  const tendencia = report.trend ? TENDENCIA[report.trend] : null

  return (
    <article aria-labelledby="progress-report-title">
      <h2 id="progress-report-title">Como sua revisão evolui</h2>
      <dl className={styles.report}>
        <div>
          <dt>Frases com intervalo longo</dt>
          <dd>{report.phrasesMastered} de {report.phrasesTotal}<small>Revisão marcada para {MASTERED_INTERVAL_DAYS} dias ou mais.</small></dd>
        </div>
        <div>
          <dt>Taxa de acerto geral</dt>
          <dd>{report.accuracy === null ? '—' : `${report.accuracy}%`}<small>{report.accuracySample} {report.accuracySample === 1 ? 'resposta registrada' : 'respostas registradas'}.
            {report.accuracy === null && ` A taxa aparece a partir de ${MIN_ANSWERS_FOR_ACCURACY} respostas.`}
          </small></dd>
        </div>
      </dl>
      {tendencia && <p className={styles.trend}><tendencia.Icon size={16} aria-hidden="true" />{tendencia.texto}</p>}
      <details className={styles.method}>
        <summary>Como os indicadores são calculados?</summary>
        <p>O intervalo indica estabilidade na revisão. O uso espontâneo da frase exige outras atividades.</p>
        {report.duplicatesCollapsed > 0 && <p>Frases repetidas contam uma vez. Cards repetidos descontados: {report.duplicatesCollapsed}.</p>}
      </details>
    </article>
  )
}
