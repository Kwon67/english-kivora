'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Swords, Users, Package } from 'lucide-react'

export default function ArenaDashboardClient({ packs, profiles }: { packs: {id: string, name: string}[], profiles: {id: string, username: string}[] }) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [player1, setPlayer1] = useState<string>('')
  const [player2, setPlayer2] = useState<string>('')
  const [selectedPack, setSelectedPack] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const supabase = createClient()
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
        // Admin must also .track() to participate in presence and receive sync events
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await channel.track({ user_id: user.id })
        }
      }
    })
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
  
  async function startDuel() {
    if (!player1 || !player2 || !selectedPack) return
    if (player1 === player2) {
      alert('Selecione jogadores diferentes!')
      return
    }
    
    setLoading(true)
    const supabase = createClient()
    
    const { error } = await supabase.from('arena_duels').insert({
      player1_id: player1,
      player2_id: player2,
      pack_id: selectedPack,
      status: 'pending'
    }).select().single()
    
    setLoading(false)
    if (error) {
      console.error(error)
      alert('Erro ao iniciar duelo.')
    } else {
      alert('Duelo iniciado! Os jogadores receberão um convite em breve.')
      setPlayer1('')
      setPlayer2('')
      setSelectedPack('')
    }
  }

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-2xl font-semibold mb-6">Configurar Duelo</h2>
      
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
            <Users className="h-4 w-4" /> Jogador 1
          </label>
          <select 
            value={player1} 
            onChange={e => setPlayer1(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Selecione...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
            <Users className="h-4 w-4" /> Jogador 2
          </label>
          <select 
            value={player2} 
            onChange={e => setPlayer2(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Selecione...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {onlineUsers.includes(p.id) ? '🟢 ' : '⚪ '}{p.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
            <Package className="h-4 w-4" /> Pack de Cartas
          </label>
          <select 
            value={selectedPack} 
            onChange={e => setSelectedPack(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 outline-none focus:border-[var(--color-primary)]"
          >
            <option value="">Selecione o pack...</option>
            {packs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={startDuel}
          disabled={loading || !player1 || !player2 || !selectedPack || player1 === player2}
          className="btn-primary"
        >
          {loading ? 'Iniciando...' : 'Iniciar Duelo'}
          <Swords className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
