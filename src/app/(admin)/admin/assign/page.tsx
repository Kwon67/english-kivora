'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAssignment } from '@/app/actions'
import type { Profile, Pack } from '@/types/database.types'
import { UserCheck, Target, Layers, Keyboard, Puzzle, Loader2, CheckCircle2 } from 'lucide-react'

const gameModes = [
  { value: 'multiple_choice', label: 'Múltipla Escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitação', icon: Keyboard },
  { value: 'matching', label: 'Combinação', icon: Puzzle },
]

function DateInput({ defaultValue, name }: { defaultValue: string, name: string }) {
  const [value, setValue] = useState(() => {
    if (!defaultValue) return ''
    const [y, m, d] = defaultValue.split('-')
    return `${d}/${m}/${y}`
  })

  // We keep a hidden input to submit the real format
  const submittedParts = value.split('/')
  const submittedValue = submittedParts.length === 3 ? `${submittedParts[2]}-${submittedParts[1]}-${submittedParts[0]}` : defaultValue

  return (
    <>
      <input type="hidden" name={name} value={submittedValue} />
      <input 
        type="text" 
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={value}
        onChange={(e) => {
           let v = e.target.value.replace(/\D/g, '')
           if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2)
           if (v.length > 5) v = v.substring(0, 5) + '/' + v.substring(5)
           setValue(v)
        }}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15 cursor-text"
      />
    </>
  )
}

export default function AssignPage() {
  const [members, setMembers] = useState<Profile[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
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
    setErrorMsg(null)
    startTransition(async () => {
      try {
        const result = await createAssignment(formData)
        if (result?.success) {
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
        } else if (result?.error) {
          setErrorMsg(result.error)
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Erro inesperado')
      }
    })
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

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

        {/* Date (Custom text mask to force DD/MM/YYYY) */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--color-text-muted)]">
            Data (dia/mês/ano)
          </label>
          <DateInput defaultValue={today} name="assigned_date" />
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Formato: DD/MM/AAAA. Deixe apenas os números.</p>
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

        {errorMsg && (
          <div className="rounded-[var(--radius-md)] bg-red-50 border border-red-200 px-4 py-3 text-center text-sm font-medium text-red-700 animate-fade-in flex items-center justify-center gap-2">
            Falha: {errorMsg}
          </div>
        )}

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
