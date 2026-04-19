'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Swords, Users, Package, Zap, CheckCircle, AlertCircle, Wifi, Gamepad2 } from 'lucide-react'

const GAME_TYPES = [
  { id: 'multiple_choice', name: 'Múltipla Escolha', description: 'Responda questões de vocabulário' },
  { id: 'matching', name: 'Matching', description: 'Associe pares EN ↔ PT' },
]
import { m, AnimatePresence } from 'framer-motion'

interface ArenaDashboardProps {
  packs: { id: string; name: string }[]
  profiles: { id: string; username: string }[]
}

export default function ArenaDashboardClient({ packs, profiles }: ArenaDashboardProps) {
  const router = useRouter()
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [player1, setPlayer1] = useState<string>('')
  const [player2, setPlayer2] = useState<string>('')
  const [selectedPack, setSelectedPack] = useState<string>('')
  const [selectedGameType, setSelectedGameType] = useState<string>('multiple_choice')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    async function setupPresence() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

      const existingChannel = supabase.getChannels().find((c) => c.topic === 'realtime:member-home-realtime')
      if (existingChannel) {
        await supabase.removeChannel(existingChannel)
      }

      const channel = supabase.channel('member-home-realtime', {
        config: { presence: { key: '' } }
      })
      channelRef = channel

      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState()
          const users = new Set<string>()
          for (const id in newState) {
            const presences = newState[id] as { user_id?: string }[]
            for (const p of presences) {
              if (p.user_id) users.add(p.user_id)
            }
          }
          setOnlineUsers(Array.from(users))
        })

      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setCurrentUserId(user.id)
            await channel.track({ user_id: user.id })
          }
        }
      })
    }

    setupPresence()

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef)
      }
    }
  }, [])

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  async function startDuel() {
    if (!player1 || !player2 || !selectedPack || !selectedGameType) return
    if (player1 === player2) {
      setToast({ type: 'error', message: 'Selecione jogadores diferentes!' })
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: duel, error } = await supabase.from('arena_duels').insert({
      player1_id: player1,
      player2_id: player2,
      pack_id: selectedPack,
      game_type: selectedGameType,
      status: 'pending'
    }).select().single()

    setLoading(false)
    if (error) {
      console.error(error)
      setToast({ type: 'error', message: 'Erro ao iniciar duelo. Tente novamente.' })
    } else {
      const adminIsPlayer = currentUserId && (player1 === currentUserId || player2 === currentUserId)
      if (adminIsPlayer && duel) {
        router.push(`/arena/${duel.id}`)
        return
      }
      setToast({ type: 'success', message: 'Duelo iniciado!' })
      setPlayer1('')
      setPlayer2('')
      setSelectedPack('')
    }
  }

  const onlineProfiles = profiles.filter(p => onlineUsers.includes(p.id))
  const offlineProfiles = profiles.filter(p => !onlineUsers.includes(p.id))
  const sortedProfiles = [...onlineProfiles, ...offlineProfiles]

  const selectedPlayer1Name = profiles.find(p => p.id === player1)?.username
  const selectedPlayer2Name = profiles.find(p => p.id === player2)?.username
  const selectedPackName = packs.find(p => p.id === selectedPack)?.name

  return (
    <div className="space-y-6">
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3 px-2"
      >
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-100 px-4 py-2 shadow-sm">
          <Wifi className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {onlineUsers.length} online
          </span>
        </div>
        {onlineProfiles.map(p => (
          <m.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-tight text-emerald-700">{p.username}</span>
          </m.div>
        ))}
      </m.div>

      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden editorial-shadow"
      >
        <div className="bg-slate-900 p-8 md:p-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
              <Swords className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tighter">
              Configurar Duelo
            </h2>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Selecione jogadores e pack para iniciar combate em tempo real.
          </p>
        </div>

        <div className="p-8 md:p-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jogador 1</label>
              <select
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Selecione...</option>
                {sortedProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jogador 2</label>
              <select
                value={player2}
                onChange={e => setPlayer2(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Selecione...</option>
                {sortedProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pack</label>
              <select
                value={selectedPack}
                onChange={e => setSelectedPack(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Selecione...</option>
                {packs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modo</label>
              <select
                value={selectedGameType}
                onChange={e => setSelectedGameType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all appearance-none"
              >
                {GAME_TYPES.map(game => (
                  <option key={game.id} value={game.id}>{game.name}</option>
                ))}
              </select>
            </div>
          </div>

          <AnimatePresence>
            {player1 && player2 && selectedPack && player1 !== player2 && (
              <m.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="mt-10 rounded-3xl border border-indigo-100 bg-indigo-50/50 p-8"
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-md border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                      {selectedPlayer1Name?.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-black text-slate-900 tracking-tight">{selectedPlayer1Name}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-4 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest">VS</div>
                    <div className="h-px w-20 bg-indigo-200" />
                  </div>

                  <div className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-md border border-indigo-100 flex items-center justify-center text-xl font-black text-indigo-600">
                      {selectedPlayer2Name?.slice(0, 1).toUpperCase()}
                    </div>
                    <span className="font-black text-slate-900 tracking-tight">{selectedPlayer2Name}</span>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-indigo-100/50 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Ambiente de combate preparado</p>
                  <p className="mt-2 text-sm font-bold text-slate-600">
                    {selectedPackName} · {GAME_TYPES.find(g => g.id === selectedGameType)?.name}
                  </p>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-end">
            <button
              onClick={startDuel}
              disabled={loading || !player1 || !player2 || !selectedPack || !selectedGameType || player1 === player2}
              className="btn-primary !rounded-2xl px-12 py-5 shadow-xl shadow-emerald-600/20"
            >
              {loading ? (
                'Iniciando...'
              ) : (
                <>
                  <Swords className="h-5 w-5" strokeWidth={2.5} />
                  Iniciar Duelo
                </>
              )}
            </button>
          </div>
        </div>
      </m.div>

      <AnimatePresence>
        {toast && (
          <m.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-10 left-1/2 z-[9999] -translate-x-1/2"
          >
            <div className={`flex items-center gap-3 rounded-2xl px-6 py-4 text-sm font-black uppercase tracking-widest shadow-2xl ${
              toast.type === 'success' ? 'bg-slate-900 text-white' : 'bg-rose-600 text-white'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {toast.message}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
