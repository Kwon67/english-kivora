'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAssignment } from '@/app/actions'
import type { Profile, Pack } from '@/types/database.types'
import { UserCheck, Users, Target, Layers, Keyboard, Puzzle, Loader2, CheckCircle2 } from 'lucide-react'

const gameModes = [
  { value: 'multiple_choice', label: 'Múltipla Escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitação', icon: Keyboard },
  { value: 'matching', label: 'Combinação', icon: Puzzle },
]

export default function AssignPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [membersRes, packsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('username'),
        supabase.from('packs').select('*').order('name'),
      ])
      if (membersRes.data) setMembers(membersRes.data as Profile[])
      if (packsRes.data) setPacks(packsRes.data as Pack[])
    }
    loadData()
  }, [supabase])

  async function handleSubmit(formData: FormData) {
    setSuccess(false)
    startTransition(async () => {
      const result = await createAssignment(formData)
      if (result?.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <UserCheck className="w-6 h-6 text-[var(--color-primary)]" strokeWidth={2} />
          <h1 className="font-bold tracking-tight text-3xl text-[var(--color-text)]">
            Atribuir Tarefa
          </h1>
        </div>
        <p className="mt-1 text-[var(--color-text-muted)] text-sm">
          Defina o pack e modo de jogo do dia para cada membro
        </p>
      </div>

      <form
        action={handleSubmit}
        className="card p-8 space-y-6 max-w-2xl"
      >
        {/* User selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Membro
          </label>
          <select
            name="user_id"
            required
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 cursor-pointer"
          >
            <option value="all">Todos os membros</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username}
              </option>
            ))}
          </select>
        </div>

        {/* Pack selection */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Pack
          </label>
          <select
            name="pack_id"
            required
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 cursor-pointer"
          >
            <option value="">Selecione um pack...</option>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{' '}
                {p.level
                  ? `(${p.level === 'easy' ? 'Fácil' : p.level === 'medium' ? 'Médio' : 'Difícil'})`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Game mode */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Modo de Jogo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {gameModes.map((mode) => {
              const Icon = mode.icon
              return (
                <label
                  key={mode.value}
                  className="group cursor-pointer"
                >
                  <input
                    type="radio"
                    name="game_mode"
                    value={mode.value}
                    defaultChecked={mode.value === 'multiple_choice'}
                    className="peer hidden"
                  />
                  <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-center transition-all peer-checked:border-[var(--color-primary)] peer-checked:bg-[var(--color-primary-light)] hover:border-[var(--color-border-hover)]">
                    <Icon className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-muted)] peer-checked:text-[var(--color-primary)]" strokeWidth={1.5} />
                    <div className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {mode.label}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Data
          </label>
          <input
            type="date"
            name="assigned_date"
            defaultValue={today}
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 cursor-pointer"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full py-3.5 text-base cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Atribuindo...
            </>
          ) : (
            'Atribuir Tarefa'
          )}
        </button>

        {success && (
          <div className="rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 px-4 py-3 text-center text-sm font-medium text-emerald-700 animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" strokeWidth={2} />
            Tarefa atribuída com sucesso!
          </div>
        )}
      </form>
    </div>
  )
}
