'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CEFR_LEVELS } from '@/features/cefr/lib/cefrLevels'
import { PRACTICE_UNITS, practiceStatus, practiceStorageKey, restorePracticeRecords, type PracticeRecords } from '../lib/practicePath'
import { portfolioReadiness } from '../lib/portfolioReadiness'
export default function PracticePortfolioHistory({userId}:{userId:string}) {
 const [records,setRecords]=useState<PracticeRecords|null>(null),[failed,setFailed]=useState(false)
 useEffect(()=>{
  function read(){try{setRecords(restorePracticeRecords(localStorage.getItem(practiceStorageKey(userId))));setFailed(false)}catch{setFailed(true)}}
  read();window.addEventListener('storage',read);window.addEventListener('focus',read)
  return ()=>{window.removeEventListener('storage',read);window.removeEventListener('focus',read)}
 },[userId])
 return <section className="study-insight" aria-labelledby="portfolio-history-title">
  <h2 id="portfolio-history-title">Portfólio de prática por competências</h2>
  <p className="my-3">Último registro de cada situação neste navegador, separado por usuário. Respostas e autoavaliação ajudam a preparar uma revisão; não certificam nível nem entram na estimativa de proficiência.</p>
  {failed?<p role="alert">Não foi possível ler o portfólio local. Tente reabrir o histórico neste navegador.</p>:records===null?<p role="status">Carregando portfólio local…</p>:<>
   <ul className="my-4">{CEFR_LEVELS.map(level=>{const summary=portfolioReadiness(level,records);return <li key={level}>{level}: {summary.completed}/{summary.total} práticas com todas as etapas registradas{summary.readyForReview?' · respostas disponíveis para revisão humana':''}</li>})}</ul>
   {!Object.keys(records).length&&<p>Nenhuma resposta registrada aqui ainda.</p>}
   {PRACTICE_UNITS.filter(unit=>records[unit.lesson.id]).map(unit=>{
    const record=records[unit.lesson.id],complete=practiceStatus(unit,record)==='completed'
    return <details key={unit.lesson.id} className="my-4"><summary>{unit.level} · {unit.lesson.title} · {complete?'Prática registrada':'Etapas a retomar'}</summary>
     {record.completedAt&&<p>Último registro: {new Date(record.completedAt).toLocaleString('pt-BR')}{!complete?' · anterior à conclusão de todas as etapas atuais':''}.</p>}
     <p>Compreensão inicial: {record.today?.firstChoice===undefined||record.today.firstChoice===null?'sem resposta':record.today.firstChoice===unit.lesson.answer?'escolha correta':'escolha a retomar'}. Critérios de produção: {record.today?.checked.filter(Boolean).length??0}/3 marcados pelo aluno.</p>
     <p>Transferência: {record.transfer.firstChoice===null?'sem resposta':record.transfer.firstChoice===unit.transfer.answer?'escolha correta':'escolha a retomar'} · tentativa {record.transfer.attempts} · {record.transfer.supportUsed?'com apoio ou retomada':'sem apoio registrado'}. {record.transfer.checked?'Autoavaliação marcada.':'Autoavaliação pendente.'}</p>
     <dl className="my-3 whitespace-pre-wrap break-words"><dt>Produção revisada</dt><dd lang="en">{record.today?.revision||'—'}</dd>{[record.interaction,...record.dialogue].map((reply,index)=><div key={index}><dt>Réplica {index+1}</dt><dd lang="en">{reply||'—'}</dd></div>)}<dt>Mediação</dt><dd lang="en">{record.mediation||'—'}</dd><dt>Novo contexto · {unit.transfer.domain}</dt><dd lang="en">{record.transfer.response||'—'}</dd></dl>
     <Link className="product-text-link" href={`/practice-path?unit=${encodeURIComponent(unit.lesson.id)}`}>Retomar {unit.lesson.title}</Link>
    </details>
   })}
  </>}
  <Link href="/practice-path" className="product-text-link">Abrir sequência e exportar respostas</Link>
 </section>
}
