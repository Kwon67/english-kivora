'use client'
import type { PracticeRecord, PracticeUnit } from '../lib/practicePath'
const fieldClass='competency-field'
export default function PracticeExtension({unit,record,update}:{unit:PracticeUnit;record:PracticeRecord;update:(patch:Partial<PracticeRecord>)=>void}) {
 const transfer=record.transfer
 return <>
  {unit.turns.map((turn,index)=><fieldset key={turn} className="competency-response-card competency-dialogue" disabled={index===0?!record.interaction.trim():!record.dialogue[index-1].trim()}>
   <legend>Conversa · réplica {index+2}</legend><blockquote lang="en">{turn}</blockquote>
   <label htmlFor={`dialogue-${index}`}>Sua resposta à réplica {index+2}</label><textarea id={`dialogue-${index}`} aria-describedby={`dialogue-note-${index}`} rows={4} lang="en" className={fieldClass} maxLength={6000} value={record.dialogue[index]} onChange={e=>{const dialogue=[...record.dialogue];dialogue[index]=e.target.value;update({dialogue})}}/>
   <p id={`dialogue-note-${index}`} className="competency-note">{(index===0?!record.interaction.trim():!record.dialogue[index-1].trim())?"Responda à réplica anterior para continuar.":"Responda em inglês, considerando a nova mensagem."}</p>
  </fieldset>)}
  <section aria-labelledby="transfer-title" className="competency-response-card competency-transfer">
   <span className="product-kicker">LEVE PARA UMA NOVA SITUAÇÃO</span><h2 id="transfer-title">Aplicar em outro contexto</h2><p className="my-2">{unit.transfer.domain} · primeira leitura desta tentativa. Responda antes de consultar o apoio. O registro descreve sua prática; não comprova desempenho independente.</p>
   <blockquote lang="en" className="my-4">{unit.transfer.text}</blockquote>
   <fieldset disabled={transfer.firstChoice!==null}><legend>{unit.transfer.question}</legend>{unit.transfer.choices.map((choice,index)=><label className="competency-choice" key={choice}><input type="radio" name={`transfer-${unit.lesson.id}`} checked={transfer.firstChoice===index} onChange={()=>update({transfer:{...transfer,firstChoice:index}})}/> {choice}</label>)}</fieldset>
   {transfer.firstChoice!==null&&<p role="status" className="competency-feedback">{transfer.firstChoice===unit.transfer.answer?'Compreensão conferida.':'Reveja o sentido antes de fazer uma nova tentativa.'} {unit.transfer.explanation}</p>}
   <details className="competency-support" onToggle={e=>{if(e.currentTarget.open&&!transfer.supportUsed)update({transfer:{...transfer,supportUsed:true}})}}><summary>Consultar apoio da transferência</summary><p>{unit.transfer.explanation}</p><p>Separe fatos, condições e o que ainda precisa perguntar. O uso deste apoio fica registrado.</p></details>
   <label htmlFor="transfer-response">Sua resposta no novo contexto</label><p id="transfer-note">{unit.transfer.prompt}</p><textarea id="transfer-response" aria-describedby="transfer-note" rows={4} lang="en" className={fieldClass} maxLength={6000} value={transfer.response} onChange={e=>update({transfer:{...transfer,response:e.target.value}})}/>
   <ul className="competency-criteria">{unit.transfer.criteria.map(criterion=><li key={criterion}>{criterion}</li>)}</ul>
   <label className="competency-check"><input type="checkbox" checked={transfer.checked} onChange={e=>update({transfer:{...transfer,checked:e.target.checked}})}/> Conferi minha resposta no novo contexto pelos dois critérios.</label>
   {transfer.firstChoice!==null&&transfer.firstChoice!==unit.transfer.answer&&<button className="product-text-link block my-4" onClick={()=>update({transfer:{...transfer,firstChoice:null,checked:false,attempts:Math.min(1000,transfer.attempts+1),supportUsed:true}})}>Retomar compreensão do novo contexto</button>}
   <p className="text-sm my-3">Tentativa {transfer.attempts}{transfer.supportUsed?' · apoio consultado ou compreensão retomada':''}. As respostas abertas recebem apenas sua autoavaliação.</p>
  </section>
 </>
}
