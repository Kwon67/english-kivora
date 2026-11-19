'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { type CefrLevel } from '@/features/cefr/lib/cefrLevels'
import { SKILL_LABELS } from '@/features/study/lib/communicativeCurriculum'
import { focusStudyStep } from '@/features/study/lib/focusStudyStep'
import { portfolioReadiness } from '../lib/portfolioReadiness'
import PracticeExtension from './PracticeExtension'
import PracticeSequence from './PracticeSequence'
import { ArrowLeft } from 'lucide-react'
import TodaySession from '@/features/study/components/TodaySession'
import { PRACTICE_UNITS, canStartUnit, emptyPracticeRecord, practiceStatus, restorePracticeRecords, practiceStorageKey, type PracticeRecords, type PracticeRecord } from '../lib/practicePath'
const fieldClass='competency-field'
export default function PracticePath({userId,packs,packsUnavailable=false,initialUnit}:{userId:string;packs:{id:string;name:string}[];packsUnavailable?:boolean;initialUnit?:string}) {
 const storageKey=practiceStorageKey(userId)
 const [records,setRecords]=useState<PracticeRecords>({})
 const [ready,setReady]=useState(false),[storageFailed,setStorageFailed]=useState(false)
 const [level,setLevel]=useState<CefrLevel>(PRACTICE_UNITS.find(item=>item.lesson.id===initialUnit)?.level??'A1'),[selected,setSelected]=useState<string|null>(null),[followup,setFollowup]=useState(false)
 const followupHeading=useRef<HTMLHeadingElement>(null), sequenceHeading=useRef<HTMLHeadingElement>(null)
 const [message,setMessage]=useState(''),[attempt,setAttempt]=useState(0)
 useEffect(()=>{try{const restored=restorePracticeRecords(localStorage.getItem(storageKey));setRecords(restored);const target=PRACTICE_UNITS.find(item=>item.lesson.id===initialUnit);if(target&&canStartUnit(target,restored))setSelected(target.lesson.id)}catch{setStorageFailed(true)}setReady(true)},[storageKey,initialUnit])
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(storageKey,JSON.stringify({version:2,records}));setStorageFailed(false)}catch{setStorageFailed(true)}},[records,ready,storageKey])
 useEffect(()=>{const target=followup?followupHeading.current:!selected?sequenceHeading.current:null;if(ready&&target)focusStudyStep(target)},[selected,followup,ready])
 const unit=PRACTICE_UNITS.find(item=>item.lesson.id===selected)
 const record=unit?(records[unit.lesson.id]??emptyPracticeRecord()):emptyPracticeRecord()
 function update(patch:Partial<PracticeRecord>){if(!unit)return;setRecords(current=>({...current,[unit.lesson.id]:{...(current[unit.lesson.id]??emptyPracticeRecord()),...patch,completedAt:null}}));setMessage('')}
 function open(id:string){setSelected(id);setFollowup(false);setMessage('')}
 function exportPortfolio(){
  const selectedUnits=PRACTICE_UNITS.filter(item=>item.level===level)
  const payload={format:2,level,createdAt:new Date().toISOString(),assessment:'practice_and_self_review_only',readiness:portfolioReadiness(level,records),units:selectedUnits.map(item=>({id:item.lesson.id,title:item.lesson.title,objectives:item.objectives,turns:[item.turn,...item.turns],transferTask:item.transfer,record:records[item.lesson.id]??null}))}
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
  const anchor=document.createElement('a');anchor.href=url;anchor.download=`kivora-pratica-${level}.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),0)
 }
 return <div className={`competency-page${unit?' competency-page-session':' competency-page-sequence'}`}>
  {!unit?<header className="product-heading competency-heading"><h1 ref={sequenceHeading} tabIndex={-1}>Prática por competências</h1><p>Leia, escreva, converse e aplique o que aprendeu em três situações por faixa.</p></header>:<div className="competency-session-nav"><button className="product-text-link" onClick={()=>{setSelected(null);setFollowup(false)}}><ArrowLeft size={18} aria-hidden="true" />Voltar à sequência</button><p className="product-kicker">Prática por competências · {unit.level}</p></div>}
  {storageFailed&&<p role="alert" className="product-error">Não foi possível guardar o progresso neste navegador. Copie suas respostas antes de sair.</p>}
  {!unit?<>
   <PracticeSequence level={level} records={records} ready={ready} onLevelChange={setLevel} onOpen={open} onExport={exportPortfolio}/>
  </>:<>
   <details className="competency-support"><summary>Competências, critérios e apoio</summary><dl>{unit.objectives.map(objective=><div key={objective.id} className="my-3"><dt className="font-semibold">{SKILL_LABELS[objective.skill]}</dt><dd>{objective.task}<p>{objective.criteria.join(' ')}</p></dd></div>)}</dl><p>Para continuar: concluir leitura e revisão, responder às três réplicas, mediar as informações, aplicar em novo contexto e conferir os critérios. Uma escolha inicial incorreta pede nova tentativa depois de rever a explicação. Marcar critérios é autoavaliação, não correção automática.</p><p>Pré-requisito: {unit.prerequisites.length?'prática anterior desta sequência':'entrada livre nesta faixa; confira se compreende o contexto com o apoio disponível'}.</p>{packsUnavailable&&<p role="status">As coleções de apoio estão indisponíveis. A situação continua acessível.</p>}{unit.packIds.map(id=>{const pack=packs.find(item=>item.id===id);return pack?<Link className="product-text-link block my-2" href={`/explore/pack/${pack.id}`} key={id}>Rever vocabulário: {pack.name}</Link>:null})}<Link className="product-text-link" href="/library">Rever minha coleção</Link></details>
   {!followup?<TodaySession key={`${unit.lesson.id}:${attempt}`} userId={`${userId}:competency`} level={unit.level} lesson={unit.lesson} initialDraft={record.today} onComplete={today=>update({today})} completion={<button className="product-primary mb-4" onClick={()=>setFollowup(true)}>Responder e transmitir</button>}/>:<section className="competency-followup" aria-labelledby="followup-title"><h1 id="followup-title" ref={followupHeading} tabIndex={-1} >Responder e transmitir</h1><p className="competency-note">Continue a conversa por escrito. Suas respostas ficam salvas neste navegador.</p><div className="competency-response-card"><span className="product-kicker">CONVERSA · RÉPLICA 1</span><p className="my-3">Agora o interlocutor escreve:</p><blockquote lang="en">{unit.turn}</blockquote><label className="block mt-4" htmlFor="interaction-response">Sua resposta ao interlocutor</label><p id="interaction-note">{unit.interaction}</p><textarea className={fieldClass} id="interaction-response" aria-describedby="interaction-note" rows={4} lang="en" maxLength={6000} value={record.interaction} onChange={e=>update({interaction:e.target.value})}/></div><PracticeExtension unit={unit} record={record} update={update}/><section className="competency-response-card" aria-labelledby="mediation-title"><span className="product-kicker">EXPLICAR PARA ALGUÉM</span><h2 id="mediation-title">Compartilhe o essencial.</h2><label className="block mt-4" htmlFor="mediation-response">Sua explicação para outra pessoa</label><p id="mediation-note">{unit.mediation}</p><textarea className={fieldClass} id="mediation-response" aria-describedby="mediation-note" rows={4} lang="en" maxLength={6000} value={record.mediation} onChange={e=>update({mediation:e.target.value})}/><fieldset className="my-4"><legend>Confira sua versão; deixe desmarcado o que precisa retomar.</legend>{unit.checks.map((criterion,index)=><label className="competency-check" key={criterion}><input type="checkbox" checked={record.checks[index]} onChange={e=>{const checks:[boolean,boolean]=[...record.checks];checks[index]=e.target.checked;update({checks})}}/> {criterion}</label>)}</fieldset></section>
   <div className="competency-register"><h2>Revise e registre sua prática.</h2><p className="competency-note">Os critérios marcados são sua autoavaliação. Você pode voltar e ajustar suas respostas.</p><button className="product-primary" disabled={!ready} onClick={()=>{const status=practiceStatus(unit,record);if(status==='ready'||status==='completed'){setRecords(current=>({...current,[unit.lesson.id]:{...record,completedAt:new Date().toISOString()}}));setMessage('Prática registrada. Você pode continuar a sequência.')}else setMessage(status==='needs_recovery'?'Retome a compreensão ou os critérios ainda não atendidos. Sua escrita foi preservada.':'Conclua a prática e preencha as respostas, confira a compreensão do novo contexto e revise os critérios antes de registrar.')}}>Registrar esta prática</button>
   {message&&<p role="status" className="competency-feedback">{message}</p>}
   <button className="product-text-link block mt-4" onClick={()=>setFollowup(false)}>Rever texto e critérios de produção</button>
   {practiceStatus(unit,record)==='needs_recovery'&&<button className="product-text-link block mt-4" onClick={()=>{try{localStorage.removeItem(`kivora-today-v1:${userId}:competency:${unit.lesson.id}`)}catch{setStorageFailed(true)}update({today:null});setAttempt(value=>value+1);setFollowup(false)}}>Nova tentativa de compreensão</button>}
   {practiceStatus(unit,record)==='completed'&&<button className="product-primary mt-4" onClick={()=>setSelected(null)}>Voltar e continuar</button>}
   </div></section>}
  </>}
  <p className="competency-note competency-storage-note">Seu progresso fica neste navegador, separado por usuário. A conversa é uma simulação escrita, com três réplicas; interação real e revisão docente continuam necessárias. Os níveis são alvos editoriais, sem certificação de proficiência.</p>
 </div>
}
