'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { m, AnimatePresence } from 'framer-motion'
import { Swords } from 'lucide-react'

export default function ArenaListener({ userId }: { userId: string }) {
  const [duelId, setDuelId] = useState<string | null>(null)
  const router = useRouter()
  
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase.channel('arena-global')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arena_duels',
          filter: `status=eq.pending`
        },
        (payload) => {
          const newDuel = payload.new
          if (newDuel.player1_id === userId || newDuel.player2_id === userId) {
            setDuelId(newDuel.id)
          }
        }
      )
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
  
  if (!duelId) return null
  
  return (
    <AnimatePresence>
      <m.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <m.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 mb-6">
            <Swords className="h-8 w-8" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
            Desafio na Arena!
          </h2>
          <p className="text-[var(--color-text-muted)] mb-8">
            O administrador chamou você para um duelo em tempo real. Prepare-se!
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                setDuelId(null)
                router.push(`/arena/${duelId}`)
              }}
              className="w-full rounded-full bg-red-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Entrar na Arena
            </button>
            <button 
              onClick={() => setDuelId(null)}
              className="w-full rounded-full border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </m.div>
      </m.div>
    </AnimatePresence>
  )
}
