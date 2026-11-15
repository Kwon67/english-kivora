'use client'

import { useId, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { SKILL_LABELS, studyAccuracy, studyQuality, type StudyDay } from '../lib/studyQuality'

function label(date: string) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)) }
function moveMonth(month: string, delta: number) { const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + delta); return date.toISOString().slice(0, 7) }
function tone(day?: StudyDay) {
  if (!day) return 'empty'
  const accuracy = studyAccuracy(day.correct, day.wrong)
  if (accuracy === null || day.correct + day.wrong < 5) return 'initial'
  return accuracy >= 80 ? 'strong' : accuracy >= 60 ? 'growing' : 'reinforce'
}
export default function StudyQualityHeatmap({ days, today, since }: { days: StudyDay[]; today: string; since: string }) {
  const [month, setMonth] = useState(today.slice(0, 7))
  const [selected, setSelected] = useState(days.filter(day => day.date.startsWith(today.slice(0, 7))).at(-1)?.date ?? today)
  const detailId = useId()
  const selectedDay = days.find(day => day.date === selected)
  const first = new Date(`${month}-01T12:00:00Z`)
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  const offset = (first.getUTCDay() + 6) % 7
  const accuracy = selectedDay ? studyAccuracy(selectedDay.correct, selectedDay.wrong) : null
  function navigate(delta: number) { const next = moveMonth(month, delta); setMonth(next); setSelected(days.filter(day => day.date.startsWith(next)).at(-1)?.date ?? `${next}-01`) }
  return <section className="study-heatmap" aria-label="Heatmap da qualidade de estudo">
    <div className="study-heatmap-heading"><div><p className="workspace-eyebrow">Estudo por dia</p><h2>Qualidade e constância</h2><p>Selecione uma data para ver os resultados.</p></div><CalendarDays aria-hidden /></div>
    <div className="study-heatmap-layout">
      <div className="study-heatmap-calendar">
        <div className="study-heatmap-month"><button type="button" aria-label="Mês anterior" disabled={month <= since.slice(0, 7)} onClick={() => navigate(-1)}><ChevronLeft aria-hidden /></button><h3 aria-live="polite">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first)}</h3><button type="button" aria-label="Próximo mês" disabled={month >= today.slice(0, 7)} onClick={() => navigate(1)}><ChevronRight aria-hidden /></button></div>
        <div className="study-heatmap-grid">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <span className="study-heatmap-weekday" key={d}>{d}</span>)}
          {Array.from({ length: offset }, (_, i) => <span aria-hidden key={`blank-${i}`} />)}
          {Array.from({ length: count }, (_, i) => {
            const date = `${month}-${String(i + 1).padStart(2, '0')}`
            const day = days.find(d => d.date === date)
            return <button type="button" key={date} data-date={date} data-tone={tone(day)} aria-pressed={selected === date} aria-controls={detailId} aria-label={`${label(date)}: ${day ? studyQuality(day.correct, day.wrong) : 'Sem registro'}`} disabled={date > today || date < since} onClick={() => setSelected(date)}>{i + 1}{day && <span className="study-heatmap-dot" aria-hidden />}</button>
          })}
        </div>
        <div className="study-heatmap-legend">{[['empty','Sem registro'],['initial','Amostra inicial / autoavaliação'],['reinforce','Reforço'],['growing','Consolidação'],['strong','Bom domínio']].map(([value,text]) => <span key={value}><i data-tone={value} aria-hidden />{text}</span>)}</div>
      </div>
      <div className="study-heatmap-detail" id={detailId} aria-live="polite" aria-atomic="true">
        <p className="workspace-eyebrow">{label(selected)}</p><h3>{selectedDay ? studyQuality(selectedDay.correct, selectedDay.wrong) : 'Sem estudo registrado'}</h3>
        <dl className="study-heatmap-results"><div><dt>Acertos</dt><dd>{accuracy === null ? '—' : `${accuracy}%`}</dd></div><div><dt>Erros</dt><dd>{accuracy === null ? '—' : `${100 - accuracy}%`}</dd></div></dl>
        {selectedDay ? <><p>{selectedDay.correct} acertos e {selectedDay.wrong} erros em respostas avaliadas.</p>{selectedDay.skills.length > 0 && <ul className="study-heatmap-skills">{selectedDay.skills.map(s => <li key={s.skill}><span>{SKILL_LABELS[s.skill]}</span><strong>{Math.round(100 * s.correct / s.total)}% <small>({s.total} respostas)</small></strong></li>)}</ul>}{selectedDay.selfReviews > 0 && <p>{selectedDay.selfReviews} respostas autoavaliadas, com {selectedDay.selfRemembered} marcadas como lembradas. Não entram no percentual de acertos.</p>}</> : <p>Ausência de registro não significa erro ou desempenho baixo.</p>}
      </div>
    </div>
    <details className="study-heatmap-method"><summary>Como interpretar este heatmap</summary><p>Qualidade é um indicador de acerto do dia, não uma certificação de nível: a partir de 5 respostas, 80% ou mais indica bom domínio; 60–79%, consolidação; abaixo de 60%, reforço. Com menos respostas, a amostra é inicial. Respostas parcialmente corretas seguem a avaliação da atividade e contam como acerto. Datas usam o horário de São Paulo.</p><p>Partidas anteriores continuam disponíveis. O registro diário completo das revisões começa nesta atualização; o histórico antigo das revisões não permite reconstruir todos os dias. Janela exibida: {label(since)} até hoje.</p></details>
  </section>
}
