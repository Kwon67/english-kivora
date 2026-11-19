import Link from 'next/link'
import { ArrowRight, Check, Download, LockKeyhole, RotateCcw } from 'lucide-react'
import { CEFR_LEVELS, type CefrLevel } from '@/features/cefr/lib/cefrLevels'
import { PRACTICE_UNITS, canStartUnit, nextPracticeUnit, practiceStatus, type PracticeRecords } from '../lib/practicePath'

const statusLabels = {
  not_started: 'Disponível',
  in_progress: 'Em andamento',
  needs_recovery: 'Retomar com apoio',
  ready: 'Pronta para registrar',
  completed: 'Prática registrada',
}

const actionLabels = {
  not_started: 'Abrir prática',
  in_progress: 'Continuar prática',
  needs_recovery: 'Retomar com apoio',
  ready: 'Continuar prática',
  completed: 'Revisitar prática',
}

export default function PracticeSequence({ level, records, ready, onLevelChange, onOpen, onExport }: {
  level: CefrLevel
  records: PracticeRecords
  ready: boolean
  onLevelChange: (level: CefrLevel) => void
  onOpen: (id: string) => void
  onExport: () => void
}) {
  const units = PRACTICE_UNITS.filter(item => item.level === level)
  const next = nextPracticeUnit(level, records)
  const completed = units.filter(item => practiceStatus(item, records[item.lesson.id]) === 'completed').length

  return <>
    <div className="competency-controls">
      <div className="competency-level">
        <label htmlFor="practice-level">Faixa de prática</label>
        <select id="practice-level" value={level} aria-describedby="practice-level-note" onChange={event => onLevelChange(event.target.value as CefrLevel)}>
          {CEFR_LEVELS.map(item => <option key={item}>{item}</option>)}
        </select>
      </div>
      <p id="practice-level-note">A escolha vale só para esta sequência. Seu nível na conta continua o mesmo.</p>
    </div>

    <section className="competency-next" aria-labelledby="practice-next-title" aria-busy={!ready}>
      <div>
        <p className="product-kicker">{next ? 'PRÓXIMO PASSO' : 'SEQUÊNCIA REGISTRADA'} · {level}</p>
        <h2 id="practice-next-title">{next ? next.lesson.title : 'Você registrou todas as práticas'}</h2>
        {next && (
          <button type="button" className="product-primary" disabled={!ready} onClick={() => onOpen(next.lesson.id)}>
            Continuar sequência {level}<ArrowRight size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="competency-progress">
        <p><strong>{completed} / {units.length}</strong> práticas registradas</p>
        <div className="competency-progress-track" role="progressbar" aria-label={`Práticas registradas na faixa ${level}`} aria-valuenow={ready ? completed : undefined} aria-valuemin={0} aria-valuemax={units.length}>
          <span style={{ width: `${completed / units.length * 100}%` }} />
        </div>
        {!ready && <p role="status">Abrindo seu progresso…</p>}
      </div>
    </section>

    <section aria-labelledby="practice-sequence-title">
      <h2 id="practice-sequence-title" className="competency-section-heading">Situações da faixa {level}</h2>
      <ol className="competency-units" role="list">
        {units.map((item, index) => {
          const id = item.lesson.id
          const available = canStartUnit(item, records)
          const status = practiceStatus(item, records[id])
          const Icon = !available ? LockKeyhole : status === 'completed' ? Check : status === 'needs_recovery' ? RotateCcw : ArrowRight
          return (
            <li className="competency-unit" aria-current={ready && next?.lesson.id === id ? 'step' : undefined} key={id}>
              <span className="competency-number" aria-hidden="true">{index + 1}</span>
              <div className="competency-unit-copy">
                <h3>{item.lesson.title}</h3>
                <p>{item.lesson.preparation}</p>
                {ready && <p className="competency-status">{available ? statusLabels[status] : 'Bloqueada até concluir a prática anterior'}</p>}
              </div>
              <button type="button" className="competency-unit-action" disabled={!ready || !available} onClick={() => onOpen(id)} aria-label={available ? `${actionLabels[status]}: ${item.lesson.title}` : `${item.lesson.title}: bloqueada`}>
                {available ? actionLabels[status] : 'Bloqueada'} <Icon size={16} aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ol>
    </section>

    <section className="competency-portfolio" aria-labelledby="practice-portfolio-title">
      <div><h2 id="practice-portfolio-title">Seu portfólio</h2><p>Reveja suas respostas ou exporte uma cópia para receber feedback.</p></div>
      <div className="competency-portfolio-actions"><Link href="/history" className="product-text-link">Ver meu portfólio no histórico<ArrowRight size={17} aria-hidden="true" /></Link><button type="button" className="product-text-link" disabled={!ready} onClick={onExport}><Download size={17} aria-hidden="true" />Exportar respostas para revisão</button></div>
    </section>
    {!next && ready && <p role="status" className="competency-note">Sequência {level} registrada. Retome uma situação em outro dia, com outro interlocutor. O registro da prática é independente da prova e da liberação de nível.</p>}
  </>
}
