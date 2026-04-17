'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Swords, Users, Package, Zap, CheckCircle, AlertCircle, Wifi } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function setupPresence() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token)
      }

      const channel = supabase.channel('member-home-realtime')

      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = new Set<string>()
        for (const id in newState) {
          const presences = newState[id] as { user_id?: string }[]
          for (const p of presences) {
            if (p.user_id) users.add(p.user_id)
          }
        }
        setOnlineUsers(Array.from(users))
      }).subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            setCurrentUserId(user.id)
            await channel.track({ user_id: user.id })
          }
        }
      })

      return channel
    }

    let channelRef: ReturnType<typeof supabase.channel> | null = null
    setupPresence().then(ch => { channelRef = ch })

    return () => {
      if (channelRef) supabase.removeChannel(channelRef)
    }
  }, [])

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  async function startDuel() {
    if (!player1 || !player2 || !selectedPack) return
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
      status: 'pending'
    }).select().single()

    setLoading(false)
    if (error) {
      console.error(error)
      setToast({ type: 'error', message: 'Erro ao iniciar duelo. Tente novamente.' })
    } else {
      // If admin is one of the players, redirect them directly to the duel
      const adminIsPlayer = currentUserId && (player1 === currentUserId || player2 === currentUserId)
      if (adminIsPlayer && duel) {
        router.push(`/arena/${duel.id}`)
        return
      }
      setToast({ type: 'success', message: 'Duelo iniciado! Os jogadores receberão o convite agora.' })
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
      {/* Online members indicator */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="flex items-center gap-2 rounded-full bg-white border border-gray-100 px-4 py-2 shadow-sm">
          <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-xs font-bold text-gray-600">
            {onlineUsers.length} {onlineUsers.length === 1 ? 'membro' : 'membros'} online
          </span>
        </div>
        {onlineProfiles.map(p => (
          <m.div
            key={p.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold text-emerald-700">{p.username}</span>
          </m.div>
        ))}
      </m.div>

      {/* Duel configuration card */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="overflow-hidden rounded-[1.75rem] bg-white border border-gray-100"
        style={{ boxShadow: '0 8px 30px -12px rgba(0,0,0,0.08)' }}
      >
        {/* Header */}
        <div
          className="p-6 sm:p-8"
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Swords className="h-5 w-5 text-red-400" />
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Configurar Duelo
            </h2>
          </div>
          <p className="text-sm text-white/40">
            Selecione dois jogadores online e um pack para iniciar um duelo em tempo real
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Player 1 */}
            <div>
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                <Users className="h-3.5 w-3.5" /> Jogador 1
              </label>
              <select
                value={player1}
                onChange={e => setPlayer1(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-sm font-semibold outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white"
              >
                <option value="">Selecione...</option>
                {sortedProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Player 2 */}
            <div>
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                <Users className="h-3.5 w-3.5" /> Jogador 2
              </label>
              <select
                value={player2}
                onChange={e => setPlayer2(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-sm font-semibold outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white"
              >
                <option value="">Selecione...</option>
                {sortedProfiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
                  </option>
                ))}
              </select>
            </div>

            {/* Pack */}
            <div>
              <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                <Package className="h-3.5 w-3.5" /> Pack de Cartas
              </label>
              <select
                value={selectedPack}
                onChange={e => setSelectedPack(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 p-3.5 text-sm font-semibold outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-100 focus:bg-white"
              >
                <option value="">Selecione o pack...</option>
                {packs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview card */}
          <AnimatePresence>
            {player1 && player2 && selectedPack && player1 !== player2 && (
              <m.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-6 rounded-2xl border border-dashed border-red-200 bg-red-50/50 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-amber-500" fill="currentColor" />
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-red-600">
                      Preview do duelo
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                        {selectedPlayer1Name?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-800">{selectedPlayer1Name}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100">
                      <Swords className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">VS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{selectedPlayer2Name}</span>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 font-bold text-[10px]">
                        {selectedPlayer2Name?.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-400">
                    Pack: <span className="font-semibold text-gray-600">{selectedPackName}</span>
                  </p>
                </div>
              </m.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={startDuel}
              disabled={loading || !player1 || !player2 || !selectedPack || player1 === player2}
              className="group relative overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: loading || !player1 || !player2 || !selectedPack
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: player1 && player2 && selectedPack
                  ? '0 12px 24px -8px rgba(220, 38, 38, 0.4)'
                  : 'none',
              }}
            >
              <span className="relative z-10 flex items-center gap-2.5">
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Swords className="h-4 w-4" />
                    Iniciar Duelo
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </m.div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <m.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2"
          >
            <div
              className={`flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-xl ${
                toast.type === 'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {toast.message}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
