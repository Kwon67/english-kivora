'use client'

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
} from 'lucide-react'
import {
  createAssignment,
  createAssignmentTemplate,
  createScheduledReviewRule,
  createMemberGroup,
  deleteAssignment,
  deleteAssignmentTemplate,
  deleteMemberGroup,
  duplicateScheduledReviewRule,
  toggleScheduledReviewRule,
  updateMemberGroup,
  updateScheduledReviewRule,
} from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { getAppDateString } from '@/lib/timezone'
import {
  formatScheduledReviewOverdue,
  isScheduledReviewExpired,
  formatNextScheduledReview,
  isScheduledReviewOverdue,
  isScheduledReviewReleasingToday,
  parseScheduledReviewStatus,
} from '@/lib/reviewSchedules'
import type { AssignmentTemplate, Card, MemberGroup, Pack, Profile } from '@/types/database.types'

const gameModes = [
  { value: 'multiple_choice', label: 'Múltipla escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitação', icon: Keyboard },
  { value: 'matching', label: 'Combinação', icon: Puzzle },
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

function DateInput({
  value,
  name,
  onChange,
}: {
  value: string
  name: string
  onChange: (value: string) => void
}) {
  const displayValue =
    value && value.includes('-')
      ? (() => {
          const [year, month, day] = value.split('-')
          return `${day}/${month}/${year}`
        })()
      : value || ''

  const parts = displayValue.split('/')
  const submittedValue =
    parts.length === 3 && parts[2].length === 4
      ? `${parts[2]}-${parts[1]}-${parts[0]}`
      : value

  return (
    <>
      <input type="hidden" name={name} value={submittedValue} />
      <input
        type="text"
        placeholder="DD/MM/AAAA"
        maxLength={10}
        value={displayValue}
        onChange={(event) => {
          let nextValue = event.target.value.replace(/\D/g, '')
          if (nextValue.length > 2) nextValue = `${nextValue.substring(0, 2)}/${nextValue.substring(2)}`
          if (nextValue.length > 4) nextValue = `${nextValue.substring(0, 5)}/${nextValue.substring(5)}`

          const nextParts = nextValue.split('/')
          if (nextParts.length === 3 && nextParts[2].length === 4) {
            onChange(`${nextParts[2]}-${nextParts[1]}-${nextParts[0]}`)
          } else if (!nextValue) {
            onChange('')
          } else {
            onChange(nextValue)
          }
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
    `until=${meta.expiresOn || ''}`,
  ].join('|')
}

export default function AssignPage() {
  type ScheduledReviewRule = { id: string; user_id: string | null; pack_id: string | null; status: string; profiles?: { username: string }[] | null; packs?: { name: string }[] | null }
  type MemberGroupRecord = MemberGroup & {
    member_group_members?: {
      user_id: string
      profiles?: Pick<Profile, 'id' | 'username'>[] | null
    }[] | null
  }
  type AssignmentTemplateRecord = AssignmentTemplate & {
    packs?: Pick<Pack, 'id' | 'name'>[] | null
  }
  const [members, setMembers] = useState<Profile[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [memberGroups, setMemberGroups] = useState<MemberGroupRecord[]>([])
  const [assignmentTemplates, setAssignmentTemplates] = useState<AssignmentTemplateRecord[]>([])
  const [packCards, setPackCards] = useState<Card[]>([])
  const [assignmentTargetId, setAssignmentTargetId] = useState('all')
  const [selectedAssignmentPackId, setSelectedAssignmentPackId] = useState('')
  const [selectedAssignmentGameMode, setSelectedAssignmentGameMode] = useState<'multiple_choice' | 'flashcard' | 'typing' | 'matching'>('multiple_choice')
  const [assignmentDate, setAssignmentDate] = useState(() => getAppDateString())
  const [selectedReviewUserId, setSelectedReviewUserId] = useState('')
  const [selectedReviewPackId, setSelectedReviewPackId] = useState('')
  const [selectedReviewCardIds, setSelectedReviewCardIds] = useState<string[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([])
  const [reviewTime, setReviewTime] = useState('18:00')
  const [cardsPerRelease, setCardsPerRelease] = useState('10')
  const [reviewExpiresOn, setReviewExpiresOn] = useState('')
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
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('10')
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateErrorMsg, setTemplateErrorMsg] = useState<string | null>(null)
  const [templateSuccess, setTemplateSuccess] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([])
  const [groupErrorMsg, setGroupErrorMsg] = useState<string | null>(null)
  const [groupSuccess, setGroupSuccess] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [membersRes, packsRes, schedulesRes, groupsRes, templatesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('username'),
        supabase.from('packs').select('*').order('name'),
        supabase
          .from('assignments')
          .select('id,user_id,pack_id,status,profiles(username),packs(name)')
          .eq('game_mode', 'scheduled_review')
          .order('created_at', { ascending: false }),
        supabase
          .from('member_groups')
          .select('id,name,description,created_at,member_group_members(user_id,profiles(id,username))')
          .order('name'),
        supabase
          .from('assignment_templates')
          .select('id,name,description,pack_id,game_mode,time_limit_minutes,created_at,packs(id,name)')
          .order('created_at', { ascending: false }),
      ])

      if (membersRes.data) setMembers(membersRes.data as Profile[])
      if (packsRes.data) setPacks(packsRes.data as Pack[])
      if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
      if (groupsRes.data) setMemberGroups(groupsRes.data as unknown as MemberGroupRecord[])
      if (templatesRes.data) setAssignmentTemplates(templatesRes.data as unknown as AssignmentTemplateRecord[])
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

  async function refreshGroupList() {
    const { data } = await supabase
      .from('member_groups')
      .select('id,name,description,created_at,member_group_members(user_id,profiles(id,username))')
      .order('name')

    if (data) setMemberGroups(data as unknown as MemberGroupRecord[])
  }

  async function refreshTemplateList() {
    const { data } = await supabase
      .from('assignment_templates')
      .select('id,name,description,pack_id,game_mode,time_limit_minutes,created_at,packs(id,name)')
      .order('created_at', { ascending: false })

    if (data) setAssignmentTemplates(data as unknown as AssignmentTemplateRecord[])
  }

  function resetAssignmentForm() {
    setAssignmentTargetId('all')
    setSelectedAssignmentPackId('')
    setSelectedAssignmentGameMode('multiple_choice')
    setAssignmentDate(today)
    setTimedMode(false)
    setTimeLimitMinutes('10')
    setSuccess(false)
    setErrorMsg(null)
  }

  function resetGroupForm() {
    setEditingGroupId(null)
    setGroupName('')
    setGroupDescription('')
    setSelectedGroupMemberIds([])
    setGroupErrorMsg(null)
    setGroupSuccess(false)
  }

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

  function startEditingGroup(group: MemberGroupRecord) {
    setEditingGroupId(group.id)
    setGroupName(group.name)
    setGroupDescription(group.description || '')
    setSelectedGroupMemberIds(
      (group.member_group_members || []).map((membership) => membership.user_id)
    )
    setGroupErrorMsg(null)
    setGroupSuccess(false)
  }

  async function handleGroupSubmit() {
    setGroupErrorMsg(null)
    setGroupSuccess(false)

    startTransition(async () => {
      try {
        const result = editingGroupId
          ? await updateMemberGroup(editingGroupId, {
              name: groupName,
              description: groupDescription,
              memberIds: selectedGroupMemberIds,
            })
          : await createMemberGroup({
              name: groupName,
              description: groupDescription,
              memberIds: selectedGroupMemberIds,
            })

        if (result?.success) {
          await refreshGroupList()
          resetGroupForm()
          setGroupSuccess(true)
          setTimeout(() => setGroupSuccess(false), 3000)
        } else if (result?.error) {
          setGroupErrorMsg(result.error)
        }
      } catch (error: unknown) {
        setGroupErrorMsg(error instanceof Error ? error.message : 'Erro inesperado')
      }
    })
  }

  async function handleDeleteGroup(groupId: string) {
    if (!window.confirm('Tem certeza que deseja remover este grupo?')) return

    setGroupErrorMsg(null)

    startTransition(async () => {
      const result = await deleteMemberGroup(groupId)
      if (result?.success) {
        await refreshGroupList()
        if (editingGroupId === groupId) resetGroupForm()
      } else if (result?.error) {
        setGroupErrorMsg(result.error)
      }
    })
  }

  async function handleSaveTemplate() {
    setTemplateErrorMsg(null)
    setTemplateSuccess(false)

    startTransition(async () => {
      try {
        const result = await createAssignmentTemplate({
          name: templateName,
          description: templateDescription,
          packId: selectedAssignmentPackId,
          gameMode: selectedAssignmentGameMode,
          timeLimitMinutes: timedMode ? Number.parseInt(timeLimitMinutes || '0', 10) || null : null,
        })

        if (result?.success) {
          await refreshTemplateList()
          setTemplateName('')
          setTemplateDescription('')
          setTemplateSuccess(true)
          setTimeout(() => setTemplateSuccess(false), 3000)
        } else if (result?.error) {
          setTemplateErrorMsg(result.error)
        }
      } catch (error: unknown) {
        setTemplateErrorMsg(error instanceof Error ? error.message : 'Erro inesperado')
      }
    })
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!window.confirm('Tem certeza que deseja remover este template?')) return

    setTemplateErrorMsg(null)

    startTransition(async () => {
      const result = await deleteAssignmentTemplate(templateId)
      if (result?.success) {
        await refreshTemplateList()
      } else if (result?.error) {
        setTemplateErrorMsg(result.error)
      }
    })
  }

  function applyTemplate(template: AssignmentTemplateRecord) {
    setSelectedAssignmentPackId(template.pack_id)
    setSelectedAssignmentGameMode(template.game_mode as 'multiple_choice' | 'flashcard' | 'typing' | 'matching')
    setTimedMode(Boolean(template.time_limit_minutes))
    setTimeLimitMinutes(template.time_limit_minutes ? String(template.time_limit_minutes) : '10')
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
    setReviewExpiresOn('')
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
    setReviewExpiresOn(meta.expiresOn || '')
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
      <section className="rounded-[2rem] bg-[var(--color-surface-container-lowest)] p-8 md:p-12 editorial-shadow ghost-border relative overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-kicker">Assignment builder</p>
            <h1 className="mt-5 text-responsive-lg font-semibold text-[var(--color-text)]">
              Distribua o treino do dia com mais clareza visual.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)]">
              Escolha membros, pack e modo de jogo em uma interface mais organizada para montar o plano diário da equipe.
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

        <div className="space-y-4 rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Templates rápidos</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Salve combinações recorrentes de pack, modo e cronômetro para aplicar em um clique.
              </p>
            </div>
          </div>

          {templateErrorMsg && (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {templateErrorMsg}
            </div>
          )}

          {templateSuccess && (
            <div className="rounded-[18px] border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
              Template salvo com sucesso.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Nome do template"
              className="field"
            />
            <input
              type="text"
              value={templateDescription}
              onChange={(event) => setTemplateDescription(event.target.value)}
              placeholder="Descrição curta (opcional)"
              className="field"
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={isPending || !templateName || !selectedAssignmentPackId}
              className="btn-ghost w-full sm:w-auto"
            >
              Salvar template
            </button>
          </div>

          {assignmentTemplates.length > 0 ? (
            <div className="grid gap-3">
              {assignmentTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex flex-col gap-3 rounded-[22px] border border-[var(--color-border)] bg-white/78 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--color-text)]">{template.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      {(template.packs?.[0]?.name || 'Pack')} · {gameModes.find((mode) => mode.value === template.game_mode)?.label || template.game_mode}
                      {template.time_limit_minutes ? ` · ${template.time_limit_minutes} min` : ' · sem cronômetro'}
                    </p>
                    {template.description && (
                      <p className="mt-1 text-sm text-[var(--color-text-subtle)]">{template.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="btn-ghost text-xs"
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="btn-ghost text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              Nenhum template salvo ainda.
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Destino</label>
            <select
              name="user_id"
              required
              data-testid="assign-user-select"
              className="field cursor-pointer"
              value={assignmentTargetId}
              onChange={(event) => setAssignmentTargetId(event.target.value)}
            >
              <option value="all">Todos os membros</option>
              {memberGroups.length > 0 && (
                <optgroup label="Grupos">
                  {memberGroups.map((group) => (
                    <option key={group.id} value={`group:${group.id}`}>
                      Grupo: {group.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Membros">
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.username} {member.role === 'admin' ? '(Admin)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">Pack</label>
            <select
              name="pack_id"
              required
              data-testid="assign-pack-select"
              className="field cursor-pointer"
              value={selectedAssignmentPackId}
              onChange={(event) => setSelectedAssignmentPackId(event.target.value)}
            >
              <option value="">Selecione um pack...</option>
              {packs.map((pack) => (
                <option key={pack.id} value={pack.id}>
                  {pack.name}{' '}
                  {pack.level
                    ? `(${pack.level === 'easy' ? 'Fácil' : pack.level === 'medium' ? 'Médio' : 'Difícil'})`
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
                    checked={selectedAssignmentGameMode === mode.value}
                    onChange={() =>
                      setSelectedAssignmentGameMode(
                        mode.value as 'multiple_choice' | 'flashcard' | 'typing' | 'matching'
                      )
                    }
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
            <DateInput value={assignmentDate} onChange={setAssignmentDate} name="assigned_date" />
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
                value={timeLimitMinutes}
                onChange={(event) => setTimeLimitMinutes(event.target.value)}
                className="field"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            disabled={isPending}
            data-testid="assign-submit"
            className="btn-primary w-full py-4 sm:w-auto sm:min-w-[220px]"
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
              onClick={resetAssignmentForm}
              className="btn-ghost w-full sm:w-auto"
            >
              Preparar outra atribuição
            </button>
          )}
        </div>
      </form>

      <section className="bg-[var(--color-surface-container-lowest)] ghost-border rounded-[2rem] max-w-5xl space-y-8 p-8 md:p-12 editorial-shadow">
        <div>
          <p className="section-kicker">Member groups</p>
          <h2 className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
            Grupos de membros para atribuição rápida.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Monte grupos fixos como equipe comercial, iniciantes ou reforço e use isso como destino na atribuição.
          </p>
        </div>

        {groupErrorMsg && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {groupErrorMsg}
          </div>
        )}

        {groupSuccess && (
          <div className="rounded-[24px] border border-[var(--color-primary)] bg-[rgba(43,122,11,0.10)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
            Grupo salvo com sucesso.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4 rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-5">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {editingGroupId ? 'Editar grupo' : 'Novo grupo'}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                Defina nome, contexto e os membros incluídos.
              </p>
            </div>

            <input
              type="text"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Nome do grupo"
              className="field"
            />
            <input
              type="text"
              value={groupDescription}
              onChange={(event) => setGroupDescription(event.target.value)}
              placeholder="Descrição curta (opcional)"
              className="field"
            />

            <div className="max-h-72 overflow-y-auto rounded-[22px] border border-[var(--color-border)] bg-white/76 p-4">
              <div className="grid gap-2">
                {members.map((member) => (
                  <label key={member.id} className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 text-sm text-[var(--color-text)]">
                    <input
                      type="checkbox"
                      checked={selectedGroupMemberIds.includes(member.id)}
                      onChange={(event) => {
                        setSelectedGroupMemberIds((current) =>
                          event.target.checked
                            ? [...current, member.id]
                            : current.filter((id) => id !== member.id)
                        )
                      }}
                      className="mr-2 accent-[var(--color-primary)]"
                    />
                    {member.username}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={handleGroupSubmit}
                disabled={isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {editingGroupId ? 'Salvar grupo' : 'Criar grupo'}
              </button>
              {editingGroupId && (
                <button
                  type="button"
                  onClick={resetGroupForm}
                  className="btn-ghost w-full sm:w-auto"
                >
                  Cancelar edição
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {memberGroups.length > 0 ? (
              memberGroups.map((group) => (
                <article
                  key={group.id}
                  className="rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface-container)] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[var(--color-text)]">{group.name}</p>
                      {group.description && (
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{group.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(group.member_group_members || []).map((membership) => (
                          <span
                            key={`${group.id}-${membership.user_id}`}
                            className="inline-flex rounded-full border border-[var(--color-border)] bg-white/76 px-3 py-1 text-xs font-semibold text-[var(--color-text-muted)]"
                          >
                            {membership.profiles?.[0]?.username || membership.user_id}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingGroup(group)}
                        className="btn-ghost text-xs"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id)}
                        className="btn-ghost text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nenhum grupo cadastrado ainda.
              </p>
            )}
          </div>
        </div>
      </section>

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

        <div className="max-w-xs space-y-2">
          <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
            Encerrar em
          </label>
          <input
            type="date"
            name="review_expires_on"
            value={reviewExpiresOn}
            onChange={(event) => setReviewExpiresOn(event.target.value)}
            className="field"
          />
          <p className="text-xs text-[var(--color-text-subtle)]">
            Opcional. Depois desta data a regra deixa de disparar.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="block text-sm font-semibold text-[var(--color-text-muted)]">
              Cards selecionados ({selectedReviewCardIds.length})
            </label>
            <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds(packCards.slice(0, 10).map((card) => card.id))}
                className="btn-ghost w-full justify-center px-3 py-2 text-[11px] sm:w-auto sm:px-4 sm:py-2 sm:text-xs"
              >
                Selecionar 10
              </button>
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds(packCards.map((card) => card.id))}
                className="btn-ghost w-full justify-center px-3 py-2 text-[11px] sm:w-auto sm:px-4 sm:py-2 sm:text-xs"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setSelectedReviewCardIds([])}
                className="btn-ghost w-full justify-center px-3 py-2 text-[11px] sm:w-auto sm:px-4 sm:py-2 sm:text-xs"
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

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button type="submit" disabled={isPending} className="btn-primary w-full py-4 sm:w-auto sm:min-w-[260px]">
            {isPending ? 'Salvando regra...' : editingRuleId ? 'Salvar alterações' : 'Criar regra de revisão'}
          </button>
          {editingRuleId && (
            <button type="button" onClick={resetScheduleForm} className="btn-ghost w-full sm:w-auto">
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
                {members.map((member) => (
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
            <span className="inline-flex items-center rounded-full border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)]">
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
                          {isScheduledReviewExpired(meta) ? (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                              Expirada
                            </span>
                          ) : null}
                          {isScheduledReviewOverdue(meta) ? (
                            <span className="inline-flex items-center rounded-full border border-[rgba(43,122,11,0.14)] bg-[rgba(43,122,11,0.06)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
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
                        {meta.expiresOn && (
                          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                            Expira em: {meta.expiresOn}
                          </p>
                        )}
                        {isScheduledReviewOverdue(meta) && (
                          <p className="mt-1 text-sm font-semibold text-[var(--color-text-muted)]">
                            Atrasada desde: {formatScheduledReviewOverdue(meta)}
                          </p>
                        )}
                        <p className={`mt-1 text-sm font-semibold ${meta.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>
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
