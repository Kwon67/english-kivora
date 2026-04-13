'use client'

import Link from 'next/link'

import { useEffect, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Copy,
  Pause,
  Pencil,
  Play,
  Keyboard,
  Layers,
  Loader2,
  Puzzle,
  Target,
  UserCheck,
  ArrowLeft,
} from 'lucide-react'
import {
  createAssignment,
  createScheduledReviewRule,
  deleteAssignment,
  duplicateScheduledReviewRule,
  toggleScheduledReviewRule,
  updateScheduledReviewRule,
} from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { getAppDateString } from '@/lib/timezone'
import {
  formatScheduledReviewOverdue,
  formatNextScheduledReview,
  isScheduledReviewOverdue,
  isScheduledReviewReleasingToday,
  parseScheduledReviewStatus,
} from '@/lib/reviewSchedules'
import type { Card, Pack, Profile } from '@/types/database.types'

const gameModes = [
  { value: 'multiple_choice', label: 'Multipla escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitacao', icon: Keyboard },
  { value: 'matching', label: 'Combinacao', icon: Puzzle },
]

const weekdayLabelMap: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
}

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

function buildLocalScheduledStatus(status: string, active: boolean) {
  const meta = parseScheduledReviewStatus(status)
  if (!meta) return status

  return [
    'scheduled_review',
    `weekdays=${meta.weekdays.join(',')}`,
    `time=${meta.time}`,
    `cards=${meta.cardIds.join(',')}`,
    `count=${meta.cardsPerRelease}`,
    `active=${active ? '1' : '0'}`,
    `last=${meta.lastReleaseKey || ''}`,
  ].join('|')
}

export default function AssignPage() {
  type ScheduledReviewRule = { id: string; user_id: string | null; pack_id: string | null; status: string; profiles?: { username: string }[] | null; packs?: { name: string }[] | null }
  const [members, setMembers] = useState<Profile[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [packCards, setPackCards] = useState<Card[]>([])
  const [selectedReviewUserId, setSelectedReviewUserId] = useState('')
  const [selectedReviewPackId, setSelectedReviewPackId] = useState('')
  const [selectedReviewCardIds, setSelectedReviewCardIds] = useState<string[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])
  const [reviewTime, setReviewTime] = useState('18:00')
  const [cardsPerRelease, setCardsPerRelease] = useState('10')
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [editingMode, setEditingMode] = useState(false)
  const [scheduledReviews, setScheduledReviews] = useState<ScheduledReviewRule[]>([])
  const [scheduledReviewFilterUserId, setScheduledReviewFilterUserId] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scheduleSuccess, setScheduleSuccess] = useState(false)
  const [scheduleSuccessMode, setScheduleSuccessMode] = useState<'create' | 'update'>('create')
  const [scheduleErrorMsg, setScheduleErrorMsg] = useState<string | null>(null)
  const [timedMode, setTimedMode] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [membersRes, packsRes, schedulesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('username'),
        supabase.from('packs').select('*').order('name'),
        supabase
          .from('assignments')
          .select('id,user_id,pack_id,status,profiles(username),packs(name)')
          .eq('game_mode', 'scheduled_review')
          .order('created_at', { ascending: false }),
      ])

      if (membersRes.data) setMembers(membersRes.data as Profile[])
      if (packsRes.data) setPacks(packsRes.data as Pack[])
      if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
    }

    loadData()
  }, [supabase])

  useEffect(() => {
    async function loadPackCards() {
      if (!selectedReviewPackId) {
        setPackCards([])
        setSelectedReviewCardIds([])
        return
      }

      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('pack_id', selectedReviewPackId)
        .order('created_at', { ascending: true })

      setPackCards((data || []) as Card[])
      if (!editingMode) {
        setSelectedReviewCardIds([])
      }
    }

    void loadPackCards()
  }, [editingMode, selectedReviewPackId, supabase])

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

  async function handleScheduleSubmit(formData: FormData) {
    setScheduleSuccess(false)
    setScheduleErrorMsg(null)
    const wasEditing = Boolean(editingRuleId)

    startTransition(async () => {
      try {
        const finalResult = editingRuleId
          ? await updateScheduledReviewRule(editingRuleId, formData)
          : await createScheduledReviewRule(formData)

        if (finalResult?.success) {
          setEditingMode(false)
          setScheduleSuccessMode(wasEditing ? 'update' : 'create')
          setScheduleSuccess(true)
          setTimeout(() => setScheduleSuccess(false), 3000)

          const schedulesRes = await supabase
            .from('assignments')
            .select('id,user_id,pack_id,status,profiles(username),packs(name)')
            .eq('game_mode', 'scheduled_review')
            .order('created_at', { ascending: false })

          if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
          resetScheduleForm()
        } else if (finalResult?.error) {
          setScheduleErrorMsg(finalResult.error)
        }
      } catch (error: unknown) {
        setScheduleErrorMsg(error instanceof Error ? error.message : 'Erro inesperado')
      }
    })
  }

  const today = getAppDateString()
  const filteredScheduledReviews = scheduledReviews.filter((schedule) =>
    scheduledReviewFilterUserId === 'all' ? true : schedule.user_id === scheduledReviewFilterUserId
  )
  const scheduledReviewSummary = filteredScheduledReviews.reduce(
    (summary, schedule) => {
      const meta = parseScheduledReviewStatus(schedule.status)
      if (!meta) return summary

      if (meta.active) summary.active += 1
      if (isScheduledReviewOverdue(meta)) {
        summary.overdue += 1
      } else if (isScheduledReviewReleasingToday(meta)) {
        summary.today += 1
      }

      return summary
    },
    { active: 0, overdue: 0, today: 0 }
  )

  function resetScheduleForm() {
    setEditingRuleId(null)
    setEditingMode(false)
    setSelectedReviewUserId('')
    setSelectedReviewPackId('')
    setSelectedReviewCardIds([])
    setSelectedWeekdays([])
    setReviewTime('18:00')
    setCardsPerRelease('10')
  }

  function startEditingRule(schedule: ScheduledReviewRule) {
    const meta = parseScheduledReviewStatus(schedule.status)
    if (!meta) return

    setEditingRuleId(schedule.id)
    setEditingMode(true)
    setSelectedReviewUserId(schedule.user_id || '')
    setSelectedReviewPackId(schedule.pack_id || '')
    setSelectedWeekdays(meta.weekdays.map(String))
    setReviewTime(meta.time)
    setCardsPerRelease(String(meta.cardsPerRelease))
    setScheduleErrorMsg(null)
    setScheduleSuccess(false)
    void (async () => {
      if (!schedule.pack_id) return
      const { data } = await supabase
        .from('cards')
        .select('*')
        .eq('pack_id', schedule.pack_id)
        .order('created_at', { ascending: true })

      setPackCards((data || []) as Card[])
      setSelectedReviewCardIds(meta.cardIds)
    })()
  }

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

        <div className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Cronômetro do membro</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                O tempo só começa quando o aluno inicia o treino e segue correndo fora da página.
              </p>
            </div>

            <label className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--color-text)]">
              <input
                type="checkbox"
                name="timed"
                checked={timedMode}
                onChange={(event) => setTimedMode(event.target.checked)}
                className="h-4 w-4 accent-[var(--color-primary)]"
              />
              Ativar limite de tempo
            </label>
          </div>

          {timedMode && (
            <div className="mt-4 max-w-xs space-y-2">
              <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Tempo em minutos</label>
              <input
                type="number"
                min={1}
                max={1440}
                step={1}
                name="time_limit_minutes"
                defaultValue={10}
                className="field"
              />
            </div>
          )}
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
                setTimedMode(false)
                setSuccess(false)
              }}
              className="btn-ghost"
            >
              Preparar outra atribuição
            </button>
          )}
        </div>
      </form>

      <form action={handleScheduleSubmit} className="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] max-w-5xl space-y-8 p-8 md:p-12 editorial-shadow">
        <div>
          <p className="section-kicker">Revisão automática</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            Agende revisões recorrentes sem mexer nas tarefas normais.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Exemplo: terça e quarta às 18:00 liberar 10 cards específicos do pack para o membro revisar.
          </p>
        </div>

        {scheduleErrorMsg && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Falha: {scheduleErrorMsg}
          </div>
        )}

        {scheduleSuccess && (
          <div className="rounded-[24px] border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
            {scheduleSuccessMode === 'update' ? 'Regra de revisão atualizada com sucesso.' : 'Regra de revisão criada com sucesso.'}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Membro</label>
            <select
              name="review_user_id"
              required
              className="field cursor-pointer"
              value={selectedReviewUserId}
              onChange={(event) => setSelectedReviewUserId(event.target.value)}
            >
              <option value="">Selecione um membro...</option>
              {members.filter((member) => member.role !== 'admin').map((member) => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Pack</label>
            <select
              name="review_pack_id"
              required
              className="field cursor-pointer"
              value={selectedReviewPackId}
              onChange={(event) => setSelectedReviewPackId(event.target.value)}
            >
              <option value="">Selecione um pack...</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Dias da semana</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['0', 'Domingo'],
                ['1', 'Segunda'],
                ['2', 'Terça'],
                ['3', 'Quarta'],
                ['4', 'Quinta'],
                ['5', 'Sexta'],
                ['6', 'Sábado'],
              ].map(([value, label]) => (
                <label key={value} className="rounded-2xl border border-[var(--color-border)] bg-white/70 px-4 py-3 text-sm font-semibold text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    name="review_weekdays"
                    value={value}
                    checked={selectedWeekdays.includes(value)}
                    onChange={(event) => {
                      setSelectedWeekdays((current) =>
                        event.target.checked ? [...current, value] : current.filter((item) => item !== value)
                      )
                    }}
                    className="mr-2 accent-[var(--color-primary)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Horário</label>
              <input type="time" name="review_time" value={reviewTime} onChange={(event) => setReviewTime(event.target.value)} className="field" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Cards por disparo</label>
              <input type="number" name="cards_per_release" min={1} max={100} value={cardsPerRelease} onChange={(event) => setCardsPerRelease(event.target.value)} className="field" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
              Cards selecionados ({selectedReviewCardIds.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds(packCards.slice(0, 10).map((card) => card.id))}
                className="btn-ghost text-xs"
              >
                Selecionar 10
              </button>
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds(packCards.map((card) => card.id))}
                className="btn-ghost text-xs"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds([])}
                className="btn-ghost text-xs"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-4">
            {packCards.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {packCards.map((card) => {
                  const checked = selectedReviewCardIds.includes(card.id)
                  return (
                    <label key={card.id} className="rounded-2xl border border-[var(--color-border)] bg-white/80 px-4 py-3 text-sm text-[var(--color-text)]">
                      <input
                        type="checkbox"
                        name="review_card_ids"
                        value={card.id}
                        checked={checked}
                        onChange={(event) => {
                          setSelectedReviewCardIds((current) =>
                            event.target.checked
                              ? [...current, card.id]
                              : current.filter((id) => id !== card.id)
                          )
                        }}
                        className="mr-2 accent-[var(--color-primary)]"
                      />
                      <span className="font-semibold">{card.english_phrase}</span>
                      <span className="ml-2 text-[var(--color-text-muted)]">- {card.portuguese_translation}</span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">Selecione um pack para carregar os cards.</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isPending} className="btn-primary min-w-[260px] py-4">
            {isPending ? 'Salvando regra...' : editingRuleId ? 'Salvar alterações' : 'Criar regra de revisão'}
          </button>
          {editingRuleId && (
            <button type="button" onClick={resetScheduleForm} className="btn-ghost">
              Cancelar edição
            </button>
          )}
        </div>

        <div className="space-y-4 border-t border-[var(--color-border)] pt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-[var(--color-text)]">Regras cadastradas</h3>
            <div className="w-full sm:w-[280px]">
              <select
                value={scheduledReviewFilterUserId}
                onChange={(event) => setScheduledReviewFilterUserId(event.target.value)}
                className="field cursor-pointer"
              >
                <option value="all">Todos os membros</option>
                {members.filter((member) => member.role !== 'admin').map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-white/80 px-3 py-1.5 text-xs font-semibold text-[var(--color-text)]">
              {scheduledReviewSummary.active} ativas
            </span>
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {scheduledReviewSummary.overdue} atrasadas
            </span>
            <span className="inline-flex items-center rounded-full border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
              {scheduledReviewSummary.today} disparam hoje
            </span>
          </div>
          {filteredScheduledReviews.length > 0 ? (
            <div className="grid gap-4">
              {filteredScheduledReviews.map((schedule) => {
                const meta = parseScheduledReviewStatus(schedule.status)
                if (!meta) return null

                return (
                  <article key={schedule.id} className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-[var(--color-text)]">
                            {schedule.profiles?.[0]?.username || 'Membro'} - {schedule.packs?.[0]?.name || 'Pack'}
                          </p>
                          {isScheduledReviewOverdue(meta) ? (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700">
                              Atrasada
                            </span>
                          ) : isScheduledReviewReleasingToday(meta) && (
                            <span className="inline-flex items-center rounded-full border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                              Dispara hoje
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                          Dias: {meta.weekdays.map((day) => weekdayLabelMap[day] || String(day)).join(', ')} | Horário: {meta.time} | Cards por disparo: {meta.cardsPerRelease}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          Cards selecionados: {meta.cardIds.length}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          Próxima liberação: {formatNextScheduledReview(meta)}
                        </p>
                        {isScheduledReviewOverdue(meta) && (
                          <p className="mt-1 text-sm font-semibold text-amber-700">
                            Atrasada desde: {formatScheduledReviewOverdue(meta)}
                          </p>
                        )}
                        <p className={`mt-1 text-sm font-semibold ${meta.active ? 'text-[var(--color-primary)]' : 'text-amber-700'}`}>
                          {meta.active ? 'Ativa' : 'Pausada'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingRule(schedule)}
                          className="btn-ghost text-xs"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await toggleScheduledReviewRule(schedule.id)
                            if (result?.success) {
                              setScheduledReviews((current) =>
                                current.map((item) => {
                                  if (item.id !== schedule.id) return item
                                  const currentMeta = parseScheduledReviewStatus(item.status)
                                  if (!currentMeta) return item
                                  return {
                                    ...item,
                                    status: buildLocalScheduledStatus(item.status, !currentMeta.active),
                                  }
                                })
                              )
                            }
                          }}
                          className="btn-ghost text-xs"
                        >
                          {meta.active ? <Pause className="h-3.5 w-3.5" strokeWidth={2} /> : <Play className="h-3.5 w-3.5" strokeWidth={2} />}
                          {meta.active ? 'Pausar' : 'Reativar'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const result = await duplicateScheduledReviewRule(schedule.id)
                            if (result?.success) {
                              const schedulesRes = await supabase
                                .from('assignments')
                                .select('id,user_id,pack_id,status,profiles(username),packs(name)')
                                .eq('game_mode', 'scheduled_review')
                                .order('created_at', { ascending: false })

                              if (schedulesRes.data) {
                                setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
                              }
                            }
                          }}
                          className="btn-ghost text-xs"
                        >
                          <Copy className="h-3.5 w-3.5" strokeWidth={2} />
                          Duplicar
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteAssignment(schedule.id)
                            setScheduledReviews((current) => current.filter((item) => item.id !== schedule.id))
                            if (editingRuleId === schedule.id) resetScheduleForm()
                          }}
                          className="btn-ghost text-xs"
                        >
                          Remover regra
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              {scheduledReviewFilterUserId === 'all'
                ? 'Nenhuma regra recorrente cadastrada ainda.'
                : 'Nenhuma regra recorrente encontrada para este membro.'}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
