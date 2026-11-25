'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getAssignedTasks, type MemberTask } from '@/features/study/lib/memberTasks'
import { getAppDateString } from '@/lib/timezone'

export default function MemberAssignments({ userId, initial }: { userId: string; initial: MemberTask[] | null }) {
  const router = useRouter()
  const previous = useRef(initial)

  useEffect(() => {
    const db = createClient()
    let active = true
    let revision = 0
    let day = getAppDateString()
    async function sync() {
      if (document.visibilityState !== 'visible') return
      const request = ++revision
      const rows = await getAssignedTasks(db, userId)
      if (!active || request !== revision || !rows) return
      const known = previous.current
      previous.current = rows
      if (known) {
        const ids = new Set(known.map(task => task.id))
        for (const task of rows.filter(row => !ids.has(row.id))) {
          toast.info('Nova tarefa atribuída', {
            id: task.id,
            description: task.packs?.name ?? 'Atividade de inglês',
            action: { label: 'Ver tarefas', onClick: () => router.push('/home#tarefas') },
          })
        }
      }
      const today = getAppDateString()
      if (window.location.pathname === '/home' && (day !== today || JSON.stringify(rows) !== JSON.stringify(known))) router.refresh()
      day = today
    }
    const channel = db.channel('member-tasks-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments', filter: 'user_id=eq.' + userId }, sync)
      .subscribe(status => { if (status === 'SUBSCRIBED') void sync() })
    void sync()
    const timer = window.setInterval(sync, 30000)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('online', sync)
    return () => {
      active = false
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('online', sync)
      void db.removeChannel(channel)
    }
  }, [userId, router])
  return null
}
