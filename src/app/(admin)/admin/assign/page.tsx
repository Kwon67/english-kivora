'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Pencil,
  Keyboard,
  Layers,
  Puzzle,
  Target,
  UserCheck,
  X,
  Headphones,
} from 'lucide-react'
import {
  createAssignment,
  createAssignmentTemplate,
  createScheduledReviewRule,
  createMemberGroup,
  deleteAssignment,
  deleteAssignmentTemplate,
  deleteMemberGroup,
  updateMemberGroup,
  updateScheduledReviewRule,
} from '@/app/actions'
import { createClient } from '@/lib/supabase/client'
import { getAppDateString } from '@/lib/timezone'
import {
  parseScheduledReviewStatus,
} from '@/lib/reviewSchedules'
import type { AssignmentTemplate, Card, MemberGroup, Pack, Profile } from '@/types/database.types'

const gameModes = [
  { value: 'multiple_choice', label: 'Múltipla escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitação', icon: Keyboard },
  { value: 'matching', label: 'Combinação', icon: Puzzle },
  { value: 'listening', label: 'Escuta', icon: Headphones },
]

const weekdayLabelMap: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
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
  const [selectedAssignmentGameMode, setSelectedAssignmentGameMode] = useState<'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening'>('multiple_choice')
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
  const [scheduledReviewFilterUserId] = useState('all')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [timedMode, setTimedMode] = useState(false)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('10')
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([])
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

  function resetGroupForm() {
    setEditingGroupId(null)
    setGroupName('')
    setGroupDescription('')
    setSelectedGroupMemberIds([])
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
  }

  async function handleGroupSubmit() {
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
        }
      } catch (error: unknown) {
        console.error('Group operation failed', error)
      }
    })
  }

  async function handleDeleteGroup(groupId: string) {
    if (!window.confirm('Tem certeza?')) return
    startTransition(async () => {
      const result = await deleteMemberGroup(groupId)
      if (result?.success) {
        await refreshGroupList()
        if (editingGroupId === groupId) resetGroupForm()
      }
    })
  }

  async function handleSaveTemplate() {
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
        }
      } catch (error: unknown) {
        console.error('Template operation failed', error)
      }
    })
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!window.confirm('Remover template?')) return
    startTransition(async () => {
      const result = await deleteAssignmentTemplate(templateId)
      if (result?.success) {
        await refreshTemplateList()
      }
    })
  }

  function applyTemplate(template: AssignmentTemplateRecord) {
    setSelectedAssignmentPackId(template.pack_id)
    setSelectedAssignmentGameMode(template.game_mode as 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening')
    setTimedMode(Boolean(template.time_limit_minutes))
    setTimeLimitMinutes(template.time_limit_minutes ? String(template.time_limit_minutes) : '10')
  }

  async function handleScheduleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const finalResult = editingRuleId
          ? await updateScheduledReviewRule(editingRuleId, formData)
          : await createScheduledReviewRule(formData)

        if (finalResult?.success) {
          setEditingMode(false)

          const schedulesRes = await supabase
            .from('assignments')
            .select('id,user_id,pack_id,status,profiles(username),packs(name)')
            .eq('game_mode', 'scheduled_review')
            .order('created_at', { ascending: false })

          if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
          resetScheduleForm()
        }
      } catch (error: unknown) {
        console.error('Schedule operation failed', error)
      }
    })
  }

  const filteredScheduledReviews = scheduledReviews.filter((schedule) =>
    scheduledReviewFilterUserId === 'all' ? true : schedule.user_id === scheduledReviewFilterUserId
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
    void (async () => {
      if (!schedule.pack_id) return
      const { data } = await supabase.from('cards').select('*').eq('pack_id', schedule.pack_id).order('created_at', { ascending: true })
      setPackCards((data || []) as Card[])
      setSelectedReviewCardIds(meta.cardIds)
    })()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2rem] p-8 md:p-10 editorial-shadow">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between px-2">
          <div className="max-w-3xl">
            <p className="section-kicker">Assignment builder</p>
            <h1 className="mt-5 text-3xl font-black text-[var(--color-text)] tracking-tighter">
              Distribua o treino do dia
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium text-[var(--color-text-muted)] leading-relaxed">
              Interface centralizada para organizar o plano de estudo da equipe com clareza.
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary-light)]">
            <UserCheck className="h-8 w-8" strokeWidth={2} />
          </div>
        </div>
      </section>

      <form action={handleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] max-w-4xl space-y-10 p-8 md:p-10 editorial-shadow" id="assign-form">
        {errorMsg && (
          <div className="rounded-2xl bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-6 py-4 text-sm font-bold text-[var(--color-error)]">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary-light)] px-6 py-4 text-sm font-bold text-[var(--color-primary)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Tarefa enviada
          </div>
        )}

        <div className="space-y-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-2">Templates rápidos</p>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Ações frequentes salvas para um clique.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nome" className="field !bg-[var(--color-surface-container-lowest)]" />
            <input value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Contexto" className="field !bg-[var(--color-surface-container-lowest)]" />
            <button type="button" onClick={handleSaveTemplate} disabled={isPending || !templateName || !selectedAssignmentPackId} className="btn-ghost !rounded-xl !bg-[var(--color-surface-container-lowest)] px-6 text-[var(--color-primary)]">
              Salvar
            </button>
          </div>

          {assignmentTemplates.length > 0 && (
            <div className="grid gap-3">
              {assignmentTemplates.map((template) => (
                <div key={template.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--color-text)]">{template.name}</p>
                    <p className="text-xs font-medium text-[var(--color-text-subtle)]">
                      {(template.packs?.[0]?.name || 'Pack')} · {gameModes.find(m => m.value === template.game_mode)?.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => applyTemplate(template)} className="btn-ghost !py-1.5 !px-3 !rounded-lg text-[10px] uppercase font-black tracking-widest">Aplicar</button>
                    <button onClick={() => handleDeleteTemplate(template.id)} className="btn-ghost !py-1.5 !px-3 !rounded-lg text-[10px] uppercase font-black tracking-widest text-[var(--color-error)] hover:!bg-[var(--color-error)]/5">Sair</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Membro ou Grupo</label>
            <select name="user_id" required className="field cursor-pointer font-bold text-[var(--color-text)]" value={assignmentTargetId} onChange={(e) => setAssignmentTargetId(e.target.value)}>
              <option value="all">Todos os membros</option>
              {memberGroups.length > 0 && (
                <optgroup label="Grupos">
                  {memberGroups.map(g => <option key={g.id} value={`group:${g.id}`}>{g.name}</option>)}
                </optgroup>
              )}
              <optgroup label="Membros">
                {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Pack de Cartas</label>
            <select name="pack_id" required className="field cursor-pointer font-bold text-[var(--color-text)]" value={selectedAssignmentPackId} onChange={(e) => setSelectedAssignmentPackId(e.target.value)}>
              <option value="">Selecione...</option>
              {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Modo de Jogo</label>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {gameModes.map((mode) => {
              const Icon = mode.icon
              const active = selectedAssignmentGameMode === mode.value
              return (
                <label key={mode.value} className="cursor-pointer">
                  <input type="radio" name="game_mode" value={mode.value} checked={active} onChange={() => setSelectedAssignmentGameMode(mode.value as 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening')} className="hidden" />
                  <div className={`rounded-3xl border p-6 transition-all duration-300 ${active ? 'bg-[var(--color-surface-container-lowest)] border-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)] shadow-xl' : 'bg-[var(--color-surface-container-low)] border-[var(--color-border)] hover:border-[var(--color-primary-container)]'}`}>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-colors ${active ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20' : 'bg-[var(--color-surface-container-lowest)] text-[var(--color-text-subtle)] border-[var(--color-border)]'}`}>
                      <Icon className="h-6 w-6" strokeWidth={2} />
                    </div>
                    <p className={`mt-5 text-sm font-black uppercase tracking-widest ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'}`}>{mode.label}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Data da Atribuição</label>
            <DateInput value={assignmentDate} onChange={setAssignmentDate} name="assigned_date" />
          </div>
          <div className="flex items-end">
            <label className="flex-1 flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="timed" checked={timedMode} onChange={(e) => setTimedMode(e.target.checked)} className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Cronômetro</span>
              </div>
              {timedMode && (
                <div className="flex items-center gap-2">
                  <input type="number" name="time_limit_minutes" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} className="w-16 h-8 text-center bg-white border border-[var(--color-border)] rounded-lg text-sm font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]" />
                  <span className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase">min</span>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border)]">
          <button type="submit" disabled={isPending} className="btn-primary w-full py-5 !rounded-2xl text-base shadow-xl shadow-[var(--color-primary)]/20">
            {isPending ? 'Processando...' : 'Confirmar Atribuição'}
          </button>
        </div>
      </form>

      <section className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] max-w-5xl space-y-10 p-8 md:p-10 editorial-shadow">
        <div className="px-2">
          <p className="section-kicker">Member groups</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--color-text)] tracking-tighter">Segmentação de alunos</h2>
          <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">Monte times para atribuição rápida de conteúdos específicos.</p>
        </div>

        <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6 bg-[var(--color-surface-container-low)] rounded-3xl p-8 border border-[var(--color-border)]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">{editingGroupId ? 'Editar Grupo' : 'Novo Grupo'}</h3>
            <div className="space-y-4">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo" className="field !bg-white" />
              <input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Objetivo/Nível" className="field !bg-white" />
              <div className="max-h-60 overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-white/50 p-4 space-y-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-primary-light)]/20 cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedGroupMemberIds.includes(m.id)} onChange={(e) => setSelectedGroupMemberIds(curr => e.target.checked ? [...curr, m.id] : curr.filter(id => id !== m.id))} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                    <span className="text-sm font-bold text-[var(--color-text)]">{m.username}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleGroupSubmit} disabled={isPending} className="btn-primary !rounded-xl px-8 flex-1">Salvar</button>
                {editingGroupId && <button onClick={resetGroupForm} className="btn-ghost !rounded-xl px-6">Sair</button>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {memberGroups.map(g => (
              <article key={g.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-[var(--color-text)] tracking-tight text-lg">{g.name}</p>
                    <p className="text-xs font-medium text-[var(--color-text-subtle)] mt-1">{g.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(g.member_group_members || []).map(m => (
                        <span key={m.user_id} className="px-2 py-1 bg-[var(--color-surface-container)] border border-[var(--color-border)] rounded-lg text-[10px] font-bold text-[var(--color-text-muted)]">
                          {m.profiles?.[0]?.username || '...'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditingGroup(g)} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <form action={handleScheduleSubmit} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[2.5rem] max-w-5xl space-y-10 p-8 md:p-10 editorial-shadow">
        <div className="px-2">
          <p className="section-kicker">Automated review</p>
          <h2 className="mt-4 text-3xl font-black text-[var(--color-text)] tracking-tighter">Regras recorrentes</h2>
          <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)] leading-relaxed">Agende disparos automáticos de vocabulário específico para reforço contínuo.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Membro Alvo</label>
            <select name="review_user_id" required className="field font-bold cursor-pointer text-[var(--color-text)]" value={selectedReviewUserId} onChange={(e) => setSelectedReviewUserId(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="all">Todos</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Origem do Pack</label>
            <select name="review_pack_id" required className="field font-bold cursor-pointer text-[var(--color-text)]" value={selectedReviewPackId} onChange={(e) => setSelectedReviewPackId(e.target.value)}>
              <option value="">Selecione...</option>
              {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Agenda Semanal</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {['0','1','2','3','4','5','6'].map(d => {
              const active = selectedWeekdays.includes(d)
              return (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="review_weekdays" value={d} checked={active} onChange={(e) => setSelectedWeekdays(curr => e.target.checked ? [...curr, d] : curr.filter(x => x !== d))} className="hidden" />
                  <div className={`h-12 flex items-center justify-center rounded-xl border text-[11px] font-black transition-all ${active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md shadow-[var(--color-primary-light)]' : 'bg-[var(--color-surface-container-low)] text-[var(--color-text-subtle)] border-[var(--color-border)] hover:border-[var(--color-primary-container)]'}`}>
                    {weekdayLabelMap[Number(d)]}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Horário</label>
            <input type="time" name="review_time" value={reviewTime} onChange={(e) => setReviewTime(e.target.value)} className="field font-bold text-[var(--color-text)]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Cards / Sessão</label>
            <input type="number" name="cards_per_release" min={1} value={cardsPerRelease} onChange={(e) => setCardsPerRelease(e.target.value)} className="field font-bold text-[var(--color-text)]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Fim do Ciclo</label>
            <input type="date" name="review_expires_on" value={reviewExpiresOn} onChange={(e) => setReviewExpiresOn(e.target.value)} className="field font-bold text-xs text-[var(--color-text)]" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 px-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">Cards ({selectedReviewCardIds.length})</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setSelectedReviewCardIds(packCards.slice(0, 10).map(c => c.id))} className="text-[10px] font-black uppercase text-[var(--color-primary)] bg-[var(--color-primary-light)]/20 px-2.5 py-1.5 rounded-lg border border-[var(--color-primary-light)]/30">Top 10</button>
              <button type="button" onClick={() => setSelectedReviewCardIds(packCards.map(c => c.id))} className="text-[10px] font-black uppercase text-[var(--color-primary)] bg-[var(--color-primary-light)]/20 px-2.5 py-1.5 rounded-lg border border-[var(--color-primary-light)]/30">Tudo</button>
              <button type="button" onClick={() => setSelectedReviewCardIds([])} className="text-[10px] font-black uppercase text-[var(--color-text-subtle)] bg-[var(--color-surface-container)] px-2.5 py-1.5 rounded-lg border border-[var(--color-border)]">Reset</button>
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-6 grid gap-2 sm:grid-cols-2">
            {packCards.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary-container)] cursor-pointer transition-all shadow-sm">
                <input type="checkbox" name="review_card_ids" value={c.id} checked={selectedReviewCardIds.includes(c.id)} onChange={(e) => setSelectedReviewCardIds(curr => e.target.checked ? [...curr, c.id] : curr.filter(id => id !== c.id))} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]" />
                <span className="text-sm font-bold text-[var(--color-text)] line-clamp-1">{c.english_phrase}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col gap-4 sm:flex-row">
          <button type="submit" disabled={isPending} className="btn-primary flex-1 py-5 !rounded-2xl shadow-xl shadow-[var(--color-primary)]/20">
            {editingRuleId ? 'Salvar Regra' : 'Ativar Ciclo de Revisão'}
          </button>
          {editingRuleId && <button type="button" onClick={resetScheduleForm} className="btn-ghost !rounded-2xl px-10 text-[var(--color-primary)]">Cancelar</button>}
        </div>

        <div className="space-y-6 pt-10 border-t border-[var(--color-border)]">
           <h3 className="text-xl font-black text-[var(--color-text)] px-1 tracking-tight">Status das Regras</h3>
           <div className="grid gap-4">
             {filteredScheduledReviews.map(s => {
               const meta = parseScheduledReviewStatus(s.status)
               if (!meta) return null
               return (
                 <article key={s.id} className="bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-black text-[var(--color-text)] uppercase tracking-tighter">{s.profiles?.[0]?.username || '...'}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border ${meta.active ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary-light)]' : 'bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] border-[var(--color-border)]'}`}>
                          {meta.active ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-text-muted)]">{s.packs?.[0]?.name}</p>
                      <p className="text-[10px] font-bold text-[var(--color-text-subtle)] uppercase mt-2">{meta.weekdays.map(d => weekdayLabelMap[Number(d)]).join(', ')} · {meta.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEditingRule(s)} className="p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={async () => { await deleteAssignment(s.id); setScheduledReviews(curr => curr.filter(x => x.id !== s.id)); }} className="p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors"><X className="h-4 w-4" /></button>
                    </div>
                 </article>
               )
             })}
           </div>
        </div>
      </form>
    </div>
  )
}
