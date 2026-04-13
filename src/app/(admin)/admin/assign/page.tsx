'use client'

import Link from 'next/link'

import { useEffect, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Keyboard,
  Layers,
  Loader2,
  Puzzle,
  Target,
  UserCheck,
  ArrowLeft,
} from 'lucide-react'
import { createAssignment } from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import type { Pack, Profile } from '@/types/database.types'

const gameModes = [
  { value: 'multiple_choice', label: 'Multipla escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitacao', icon: Keyboard },
  { value: 'matching', label: 'Combinacao', icon: Puzzle },
]

function DateInput({ defaultValue, name }: { defaultValue: string; name: string }) {
  const [value, setValue] = useState(() => {
    if (defaultValue && defaultValue.includes('-')) {
      const [year, month, day] = defaultValue.split('-')
      return `${day}/${month}/${year}`
    }

    return defaultValue || ''
  })

  const parts = value.split('/')
  const submittedValue =
    parts.length === 3 && parts[2].length === 4
      ? `${parts[2]}-${parts[1]}-${parts[0]}`
      : defaultValue

  return (
    <>
      <input type="hidden" name={name} value={submittedValue} />
      <input
        type="text"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={value}
        onChange={(event) => {
          let nextValue = event.target.value.replace(/\D/g, '')
          if (nextValue.length > 2) nextValue = `${nextValue.substring(0, 2)}/${nextValue.substring(2)}`
          if (nextValue.length > 4) nextValue = `${nextValue.substring(0, 5)}/${nextValue.substring(5)}`
          setValue(nextValue)
        }}
        className="field"
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
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : 'Erro inesperado')
      }
    })
  }

  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/admin/dashboard"
        className="mb-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-container)] px-5 py-2.5 text-sm font-bold text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-container-high)]"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
        Voltar ao dashboard
      </Link>
      
      <section className="rounded-[2rem] bg-[var(--color-surface-container-lowest)] p-8 md:p-12 editorial-shadow ghost-border relative overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Assignment builder</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Distribua o treino do dia com mais clareza visual.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Escolha membros, pack e modo de jogo em uma interface mais organizada para montar o plano diario da equipe.
            </p>
          </div>

          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--color-surface-container)] text-[var(--color-text)]">
            <UserCheck className="h-8 w-8" strokeWidth={1.8} />
          </div>
        </div>
      </section>

      <form action={handleSubmit} className="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] max-w-4xl space-y-8 p-8 md:p-12 editorial-shadow" id="assign-form">
        {errorMsg && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Falha: {errorMsg}
          </div>
        )}

        {success && (
          <div className="rounded-[24px] border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} />
              Tarefa atribuída com sucesso
            </span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Membro</label>
            <select name="user_id" required data-testid="assign-user-select" className="field cursor-pointer">
              <option value="all">Todos os membros</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Pack</label>
            <select name="pack_id" required data-testid="assign-pack-select" className="field cursor-pointer">
              <option value="">Selecione um pack...</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}{' '}
                  {pack.level
                    ? `(${pack.level === 'easy' ? 'Facil' : pack.level === 'medium' ? 'Medio' : 'Dificil'})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Modo de jogo</label>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {gameModes.map((mode) => {
              const Icon = mode.icon

              return (
                <label key={mode.value} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="game_mode"
                    value={mode.value}
                    defaultChecked={mode.value === 'multiple_choice'}
                    className="peer hidden"
                  />
                  <div
                    data-testid={`game-mode-${mode.value}`}
                    className="rounded-[26px] border border-[var(--color-border)] bg-white/72 p-5 transition-all peer-checked:border-[var(--color-primary)] peer-checked:bg-[linear-gradient(135deg,rgba(223,236,205,0.92),rgba(255,255,255,0.9))] hover:border-[var(--color-border-hover)] hover:bg-white"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--color-primary-light)] text-[var(--color-primary)] peer-checked:bg-white peer-checked:text-[var(--color-text)]">
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                      <p className="mt-4 text-base font-semibold text-[var(--color-text)]">{mode.label}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Data</label>
          <div data-testid="assign-date-input">
            <DateInput defaultValue={today} name="assigned_date" />
          </div>
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
            Formato DD/MM/AAAA
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            data-testid="assign-submit"
            className="btn-primary min-w-[220px] py-4"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atribuindo
              </>
            ) : (
              'Atribuir tarefa'
            )}
          </button>

          {success && (
            <button
              type="button"
              onClick={() => {
                const form = document.getElementById('assign-form') as HTMLFormElement
                form?.reset()
                setSuccess(false)
              }}
              className="btn-ghost"
            >
              Preparar outra atribuição
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
