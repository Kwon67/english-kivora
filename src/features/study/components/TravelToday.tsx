'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TodaySession from './TodaySession'
import { nextTravelEpisode, restoreTravelProgress, TRAVEL_LESSONS, TRAVEL_UNIT } from '../lib/travelUnit'
import type { TodayDraft } from '../lib/todayLesson'

const noDrafts: Record<string, TodayDraft> = {}
export default function TravelToday({ userId, persistenceEnabled = false, initialDrafts = noDrafts }: { userId: string; persistenceEnabled?: boolean; initialDrafts?: Record<string, TodayDraft> }) {
  const key = `kivora-travel-v1:${userId}`
  const [ready, setReady] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [episode, setEpisode] = useState(0)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    const accountCompleted: string[] = []
    for (const lesson of TRAVEL_LESSONS) {
      if (initialDrafts[lesson.id]?.step !== 4) break
      accountCompleted.push(lesson.id)
    }
    let progress = accountCompleted
    try {
      const saved = restoreTravelProgress(localStorage.getItem(key))
      if (saved && saved.completed.length > progress.length) progress = saved.completed
    } catch { setStorageError(true) }
    setCompleted(progress); setEpisode(nextTravelEpisode(progress))
    setReady(true)
  }, [key, initialDrafts])
  function record(draft: TodayDraft) {
    if (completed.includes(draft.lessonId) || episode !== completed.length) return
    const next = [...completed, draft.lessonId]
    setCompleted(next)
    try { localStorage.setItem(key, JSON.stringify({ version: 1, completed: next, updatedAt: new Date().toISOString() })) }
    catch { setStorageError(true) }
  }
  if (!ready) return <p className="study-save-state" role="status">Retomando sua próxima situação…</p>
  const lesson = TRAVEL_LESSONS[episode]
  return <>
    <div className="mx-auto mb-3 max-w-[880px] text-sm text-brand-secondary" data-testid="travel-unit-status">
      <p>{TRAVEL_UNIT.title} · {Math.min(episode + 1, 3)}/3 episódios{episode === 3 ? ' · transferência' : ''}</p>
      {storageError && <p role="status">O navegador não guardou a sequência. Você pode continuar, mas copie seus textos antes de sair.</p>}
    </div>
    <TodaySession key={lesson.id} userId={userId} level="A2" displayBand={TRAVEL_UNIT.band} lesson={lesson}
      initialDraft={initialDrafts[lesson.id]} persistenceEnabled={persistenceEnabled} onComplete={record}
      completion={<div className="mb-5">
        {episode < 3 ? <button className="product-primary" onClick={() => setEpisode(episode + 1)}>
          {episode === 2 ? 'Tentar uma situação nova' : 'Continuar a viagem'}
        </button> : <><p className="font-semibold">Você completou a sequência e tentou transferir o que praticou.</p><p className="mt-2">Compare sua primeira resposta com a revisão. A escolha observada cobre compreensão; escrita e fala ainda precisam de avaliação externa.</p><Link className="product-primary mt-4" href="/review">Retomar minhas revisões</Link></>}
      </div>} />
  </>
}
