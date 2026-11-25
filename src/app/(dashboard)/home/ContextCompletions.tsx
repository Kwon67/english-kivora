'use client'

import { useEffect, useState } from 'react'
import { getAppDateString } from '@/lib/timezone'

type Lesson = { id: string; title: string }

export default function ContextCompletions({ userId, today, lessons, saved }: {
  userId: string; today: string; lessons: Lesson[]; saved: string[] | null
}) {
  const [local, setLocal] = useState<string[]>([])
  useEffect(() => {
    const found = lessons.filter(lesson => {
      try {
        const draft = JSON.parse(localStorage.getItem(`kivora-today-v1:${userId}:${lesson.id}`) || 'null')
        return draft?.lessonId === lesson.id && draft.step === 4 && typeof draft.completedAt === 'string'
          && getAppDateString(draft.completedAt) === today
      } catch { return false }
    })
    setLocal(found.map(lesson => lesson.id))
  }, [userId, today, lessons])
  const completed = new Set([...(saved ?? []), ...local])
  return <>
    {completed.size > 0 && <p className="mt-4">Prática em contexto concluída hoje: {lessons.filter(lesson => completed.has(lesson.id)).map(lesson => lesson.title).join(', ')}.</p>}
    {saved === null && <p role="status">Não foi possível consultar as práticas em contexto salvas na conta.</p>}
  </>
}
