'use client'
import Link from 'next/link'
import AudioButton, { AUDIO_STOP_EVENT } from '@/components/ui/AudioButton'
import { lessonLines, practiceVoice, WELCOME_TEXT } from '@/lib/audioRoles'
import StudioHero from '@/components/learning/StudioHero'
import { saveContextPractice } from '@/app/context-practice-actions'
import { wordId } from '@/features/words/wordId'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { CEFR_LEVELS, type CefrLevel } from '@/features/cefr/lib/cefrLevels'
import { COMMUNICATIVE_CURRICULUM, SKILL_LABELS } from '../lib/communicativeCurriculum'
import { emptyTodayDraft, restoreTodayDraft, TODAY_LESSONS, type TodayDraft } from '../lib/todayLesson'
import ShadowingPractice from './ShadowingPractice'
import LocalSpeakingPractice from './LocalSpeakingPractice'
import type { TodayLesson } from '../lib/todayLesson'
import { focusStudyStep } from '../lib/focusStudyStep'

const steps = ['Preparar', 'Compreender', 'Usar', 'Revisar', 'Concluir']
const fieldClass = 'mt-3 w-full rounded-container border border-brand-dark/20 bg-bg-card p-4 text-base text-brand-dark focus-visible:outline-2 focus-visible:outline-brand-dark'

export default function TodaySession({ userId, level, initialDraft = null, persistenceEnabled = false, lesson: suppliedLesson, displayBand, completion, onComplete }: {
  userId: string; level: CefrLevel; initialDraft?: TodayDraft | null; persistenceEnabled?: boolean;
  lesson?: TodayLesson; displayBand?: string; completion?: ReactNode; onComplete?: (draft: TodayDraft) => void;
}) {
  const lesson = suppliedLesson ?? TODAY_LESSONS[level]
  const band = displayBand ?? level
  const storageKey = `kivora-today-v1:${userId}:${lesson.id}`
  const [draft, setDraft] = useState<TodayDraft>(() => initialDraft ?? emptyTodayDraft(lesson.id))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveConflict, setSaveConflict] = useState(false)
  const saveLock = useRef(false)
  const [ready, setReady] = useState(false)
  const [storageFailed, setStorageFailed] = useState(false)
  const [restored, setRestored] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef<number | null>(null)

  useEffect(() => {
    try {
      const saved = restoreTodayDraft(localStorage.getItem(storageKey), lesson.id)
      if (saved && (!initialDraft || Date.parse(saved.updatedAt) > Date.parse(initialDraft.updatedAt))) { setDraft(saved); setRestored(true) }
    } catch { setStorageFailed(true) }
    setReady(true)
  }, [storageKey, lesson.id, initialDraft])
  useEffect(() => {
    if (!ready) return
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); setStorageFailed(false) }
    catch { setStorageFailed(true) }
  }, [ready, storageKey, draft])
  useEffect(() => {
    if (!ready) return
    if (heading.current && ((previousStep.current === null && suppliedLesson) || (previousStep.current !== null && previousStep.current !== draft.step))) focusStudyStep(heading.current)
    previousStep.current = draft.step
  }, [draft.step, ready, suppliedLesson])
  function update(patch: Partial<TodayDraft>) { setDraft(current => ({ ...current, ...patch, updatedAt: new Date().toISOString() })) }
  async function complete() {
    if (saveLock.current || !draft.revision.trim()) return
    saveLock.current = true; setSaving(true); setSaveError(''); setSaveConflict(false)
    const attemptId = draft.attemptId ?? wordId()
    update({ attemptId })
    try {
      const result = persistenceEnabled ? await saveContextPractice({ attemptId, level, draft }) : { status: 'local_only' as const }
      if (result.status === 'error') { setSaveError(result.message); setSaveConflict(result.code === 'conflict'); return }
      const completed = { ...draft, attemptId, step: 4, completedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), accountSaved: result.status === 'saved' }
      setDraft(completed); onComplete?.(completed)
    } catch { setSaveError('Não foi possível confirmar o registro na conta. O rascunho foi preservado. Tente novamente.') }
    finally { saveLock.current = false; setSaving(false) }
  }
  const next = () => update({ step: Math.min(4, draft.step + 1) })
  const reviewDate = draft.completedAt ? new Date(Date.parse(draft.completedAt) + 2 * 86400000).toLocaleDateString('pt-BR') : null

  return <div className="study-desk study-desk--today" data-testid="today-session">
    {draft.step === 0 ? <StudioHero
      label={`Hoje · Faixa ${band}`}
      ornament="pencil"
      title={lesson.title}
      description={lesson.preparation}
      headingId="today-step-heading"
      headingRef={heading}
      guidance={<>
        {lesson.recall && <p className="font-semibold">{lesson.recall}</p>}
        <p className="text-sm">Tente lembrar uma frase útil sem olhar. Se houver revisões pendentes, faça uma rodada breve antes de continuar.</p>
      </>}
    >
      <button className="product-primary" disabled={!ready} onClick={next}>Começar contexto <ArrowRight size={18} /></button>
      <Link className="today-review-link" href="/review">Fazer revisão breve</Link>
    </StudioHero>
      : <header className="mb-5"><p className="product-kicker">HOJE · FAIXA {band}</p><h1 className="!text-xl !leading-snug !mt-2">{lesson.title}</h1></header>}
    {draft.step === 0 && <details className="study-insight" onToggle={e=>{ if (!e.currentTarget.open) window.dispatchEvent(new Event(AUDIO_STOP_EVENT)) }}>
      <summary>Praticar a escuta com três vozes</summary><p lang="en">{WELCOME_TEXT}</p>
      <div className="flex flex-wrap gap-3">{(['siren','lauren','jarnathan'] as const).map(voice => <div key={voice}>
        <span className="capitalize">{voice}</span> <AudioButton fallbackText={WELCOME_TEXT} voice={voice} label={`Ouvir ${voice}`} />
      </div>)}</div>
    </details>}
    <div className="study-session-line"><span>{steps[draft.step]}</span><span>{draft.step + 1} / {steps.length}</span><Link href="/home" aria-disabled={saving} onClick={event => { if (saving) event.preventDefault() }}>Pausar</Link></div>
    <div className="study-progress" role="progressbar" aria-label="Etapas da prática contextual" aria-valuenow={draft.step} aria-valuemin={0} aria-valuemax={4}><span style={{ transform: `scaleX(${draft.step / 4})` }} /></div>
    <p className="study-save-state" role="status">{!ready ? 'Abrindo sua prática…' : storageFailed ? 'Este navegador não conseguiu guardar o rascunho. Copie seu texto antes de sair.' : restored ? 'Rascunho retomado. Alterações ficam neste navegador.' : 'Rascunho salvo somente neste navegador.'}</p>
    {draft.step > 0 && <section aria-busy={saving} className="memory-card today-step" aria-labelledby="today-step-heading">
      <h2 id="today-step-heading" ref={heading} tabIndex={-1} className="!text-2xl">{draft.step === 1 ? 'O que você entendeu?' : draft.step === 2 ? 'Agora, use suas palavras' : draft.step === 3 ? 'Compare e reescreva' : storageFailed && !draft.accountSaved ? 'Prática concluída' : 'Prática registrada'}</h2>
      {draft.step === 1 && <><p lang="en" className="text-lg leading-relaxed">{lesson.text}</p>
        {lessonLines(lesson.id,lesson.text).map((line,i) => <div key={i} className="inline-flex items-center gap-1 mr-3">
          {line.speaker && <span>{line.speaker}</span>}
          <AudioButton voice={line.voice} fallbackText={line.text} label={line.speaker ? `Ouvir fala ${i+1} · ${line.speaker}` : 'Ouvir contexto'} />
        </div>)}<fieldset disabled={!ready} className="mt-6"><legend className="font-semibold">{lesson.question}</legend><div className="mt-3 space-y-2">{lesson.choices.map((choice, index) => <label key={choice} className="flex gap-3 items-start rounded-control border border-brand-dark/15 p-3 cursor-pointer"><input type="radio" name="comprehension" checked={draft.choice === index} onChange={() => update({ choice: index, firstChoice: draft.firstChoice ?? index })} className="mt-1" /><span>{choice}</span></label>)}</div></fieldset>
        {draft.choice !== null && !lesson.transfer && <div className="mt-5" role="status"><p className="font-semibold">{draft.choice === lesson.answer ? 'Você identificou a ideia.' : 'Vamos conferir o contexto.'}</p><p>{lesson.explanation}</p></div>}
        <button className="product-primary mt-6 self-start" disabled={draft.choice === null || !ready} onClick={next}>Usar o que entendi <ArrowRight size={18} /></button></>}
      {draft.step === 2 && <><p>{lesson.prompt}</p><details className="study-insight" onToggle={event => { if (event.currentTarget.open) update({ hintsUsed: true }) }}><summary>Consultar o contexto</summary><p lang="en" className="mt-3 leading-relaxed">{lesson.text}</p></details><label htmlFor="today-response" className="mt-5 font-semibold">Seu texto em inglês</label><textarea id="today-response" lang="en" className={fieldClass} rows={6} maxLength={6000} value={draft.response} disabled={!ready} onChange={event => update({ response: event.target.value })} aria-describedby="today-writing-note" /><p id="today-writing-note" className="mt-3 text-sm">Há várias respostas possíveis. A próxima etapa oferece critérios para você revisar; não atribui nota automática ao texto.</p><button className="product-primary mt-6 self-start" disabled={!draft.response.trim() || !ready} onClick={next}>Ver critérios e revisar <ArrowRight size={18} /></button></>}
      {draft.step === 3 && <>{lesson.transfer && <p className="mb-4">{lesson.explanation}</p>}<p>Compare sua intenção com o exemplo. Você não precisa copiar as palavras dele.</p><blockquote lang="en" className="mt-4 border-l-2 border-brand-dark/30 pl-4 leading-relaxed">{lesson.example}</blockquote><AudioButton voice={practiceVoice(lesson.id)} fallbackText={lesson.example} label="Ouvir exemplo" /><fieldset disabled={saving} className="mt-5"><legend className="font-semibold">Na minha resposta…</legend>{lesson.criteria.map((criterion, index) => <label key={criterion} className="flex items-start gap-3 py-3"><input type="checkbox" className="mt-1" checked={draft.checked[index]} onChange={event => update({ checked: draft.checked.map((value, i) => i === index ? event.target.checked : value) })} /><span>{criterion}</span></label>)}</fieldset><p className="text-sm">{draft.checked.every(Boolean) ? 'Você reconheceu todos os critérios. Reescreva para deixar a mensagem mais clara ou tente outra formulação.' : 'Retome os critérios ainda não marcados. Acrescente a informação que falta e confira se o leitor consegue agir com seu texto.'}</p><details className="study-insight"><summary>Minha primeira versão</summary><p lang="en" className="mt-3 whitespace-pre-wrap break-words">{draft.response}</p></details><label htmlFor="today-revision" className="mt-5 font-semibold">Sua nova versão</label><textarea id="today-revision" lang="en" className={fieldClass} rows={6} maxLength={6000} disabled={saving} value={draft.revision} onChange={event => update({ revision: event.target.value })} /><button className="product-primary mt-6 self-start" disabled={!draft.revision.trim() || !ready || saving} onClick={() => void complete()}>{saving ? 'Salvando prática…' : 'Concluir esta prática'} <ArrowRight size={18} /></button></>}
      {saveError && <p role="alert" className="product-error mt-4">{saveError}</p>}
      {saveConflict && <button className="product-text-link mt-4" onClick={() => { update({ attemptId: null }); setSaveConflict(false); setSaveError('Nova tentativa preparada. Clique em Concluir esta prática para salvá-la.') }}>Manter esta revisão em uma nova tentativa</button>}
      {draft.step === 4 && <>{completion}<p className="mb-4 font-semibold">{draft.accountSaved ? 'Registro salvo na sua conta.' : storageFailed ? 'Prática concluída, mas o navegador não conseguiu salvar. Copie sua versão antes de sair.' : 'Registro salvo somente neste navegador.'}</p><p>Você leu um contexto, escreveu e revisou uma resposta. Os critérios marcados são uma autoavaliação; não comprovam domínio do nível {level}.</p><p className="mt-4">Retome esta situação em {reviewDate} e tente responder sem consultar sua primeira versão. Esta sugestão não cria notificação.</p><details className="study-insight"><summary>Ver minha versão revisada</summary><p lang="en" className="mt-3 whitespace-pre-wrap break-words">{draft.revision}</p></details><div className="flex flex-wrap gap-4 mt-6"><Link className={completion ? "product-text-link" : "product-primary"} href="/tutor">Abrir o tutor <ArrowRight size={18} /></Link><button className="product-text-link" onClick={() => update({ step: 0, completedAt: null, attemptId: null, accountSaved: false, choice: null, response: '', revision: '', firstChoice: null, hintsUsed: false, spoken: false, checked: [false,false,false] })}>Praticar novamente</button></div><p className="mt-3 text-sm">Copie sua versão se quiser usá-la na conversa. O tutor segue a disponibilidade do seu plano.</p></>}
    </section>}
    {(draft.step === 2 || draft.step === 3) && lesson.speakingPrompt && <LocalSpeakingPractice disabled={saving} prompt={lesson.speakingPrompt} practiced={draft.spoken} onPracticed={spoken => update({ spoken })} />}
    {draft.step >= (lesson.transfer ? 3 : 2) && <ShadowingPractice voiceName={practiceVoice(lesson.id)} text={lesson.shadowing} />}
    {draft.step > 0 && draft.step < 4 && <button className="product-text-link mt-4" disabled={saving} onClick={() => update({ step: draft.step - 1, hintsUsed: draft.hintsUsed || Boolean(lesson.transfer && draft.step >= 2) })}>Voltar à etapa anterior</button>}
    {draft.step === 4 && <section className="study-insight" aria-label="Evidências desta tentativa"><p>Compreensão: {draft.firstChoice === null ? 'primeira resposta não registrada' : draft.firstChoice === lesson.answer ? 'primeira escolha correta' : 'primeira escolha precisou de revisão'}. {draft.hintsUsed ? 'Você consultou apoio durante a produção.' : 'Nenhuma consulta de apoio foi registrada durante a produção.'}</p><p>Escrita e fala: critérios informados por você, sem avaliação externa.{draft.spoken ? ' Você informou que praticou em voz alta.' : ' Não há relato de prática oral nesta tentativa.'}</p></section>}
    <details className="study-insight"><summary>Objetivos e evidências desta faixa</summary><p>Esta matriz inicial orienta tarefas. Uma única sessão não cobre todas as habilidades nem certifica CEFR. Interação real exige resposta de outra pessoa; escrever uma mensagem é apenas preparação.</p><dl>{COMMUNICATIVE_CURRICULUM.filter(objective => objective.level === level).map(objective => <div key={objective.id} className="mt-4"><dt className="font-semibold">{SKILL_LABELS[objective.skill]}</dt><dd>{objective.goal}<br /><span className="text-sm">Critérios: {objective.criteria.join(' ')}</span></dd></div>)}</dl><Link href="/courses" className="product-text-link mt-4">Ver progresso da trilha</Link></details>
    <Link href="/practice-path" className="product-text-link my-4">Continuar por competências</Link>
    <details className="study-insight"><summary>Ajustar faixa de prática</summary><p>Escolher outra faixa muda a tarefa, não seu nível estimado.</p><div className="flex flex-wrap gap-4 py-3">{CEFR_LEVELS.map(item => <Link key={item} aria-current={item === level ? 'page' : undefined} className="product-text-link" href={`/today?level=${item}`}>{item}</Link>)}</div></details>
  </div>
}
