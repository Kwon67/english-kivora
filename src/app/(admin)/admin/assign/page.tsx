'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CheckCircle2,
  Pencil,
  Keyboard,
  Layers,
  Puzzle,
  Target,
  Mic,
  X,
  Headphones,
  Trash2,
  Target as QuestIcon,
  CalendarClock,
  ClipboardList,
  Users,
  Award,
} from 'lucide-react'
import {
  createAssignment,
  createAssignmentTemplate,
  createScheduledReviewRule,
  createMemberGroup,
  deleteAssignment,
  deleteAllAssignments,
  deleteAssignmentTemplate,
  deleteMemberGroup,
  updateMemberGroup,
  updateScheduledReviewRule,
  createQuestAction,
  updateQuestAction,
  deleteQuestAction,
} from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { createClient } from '@/lib/supabase/client'
import { getAppDateString } from '@/lib/timezone'
import {
  parseScheduledReviewStatus,
} from '@/features/review/lib/reviewSchedules'
import { DEFAULT_REVIEW_SESSION_CARD_LIMIT } from '@/features/review/lib/reviewQueue'
import { notify } from '@/lib/toast'
import type { AssignmentTemplate, Card, MemberGroup, Pack, Profile } from '@/types/database.types'

const publicProfileColumns = 'id,username,role,created_at,updated_at,last_seen_at,avatar_url,cover_url,bio,description'

const gameModes = [
  { value: 'multiple_choice', label: 'Múltipla escolha', icon: Target },
  { value: 'flashcard', label: 'Flashcard', icon: Layers },
  { value: 'typing', label: 'Digitação', icon: Keyboard },
  { value: 'matching', label: 'Combinação', icon: Puzzle },
  { value: 'listening', label: 'Escuta', icon: Headphones },
  { value: 'speaking', label: 'Fala', icon: Mic },
]

const weekdayLabelMap: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb',
}

type PendingAdminConfirm =
  | { type: 'quest'; id: string }
  | { type: 'group'; id: string }
  | { type: 'template'; id: string }
  | { type: 'schedule'; id: string }

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
  type MemberOption = Pick<Profile, 'id' | 'username' | 'role'>
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
  type UserQuestRecord = {
    id: string
    user_id: string
    quest_type: string
    target: number
    progress: number
    status: string
    expires_at: string | null
    profiles?: { username: string } | null
  }
  const [members, setMembers] = useState<MemberOption[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [memberGroups, setMemberGroups] = useState<MemberGroupRecord[]>([])
  const [assignmentTemplates, setAssignmentTemplates] = useState<AssignmentTemplateRecord[]>([])
  const [userQuests, setUserQuests] = useState<UserQuestRecord[]>([])
  const [packCards, setPackCards] = useState<Card[]>([])
  const [manualBadges, setManualBadges] = useState<{id: string, name: string, icon_name: string}[]>([])
  const [assignmentTargetId, setAssignmentTargetId] = useState('all')
  const [selectedAssignmentPackId, setSelectedAssignmentPackId] = useState('')
  const [selectedAssignmentGameMode, setSelectedAssignmentGameMode] = useState<'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening' | 'speaking'>('multiple_choice')
  const [assignmentDate, setAssignmentDate] = useState(() => getAppDateString())
  const [rewardBadgeId, setRewardBadgeId] = useState('')
  
  // Quest Form State
  const [questTargetId, setQuestTargetId] = useState('all')
  const [questType, setQuestType] = useState('any_session')
  const [questTargetValue, setQuestTargetValue] = useState('5')
  const [questExpiresAt, setQuestExpiresAt] = useState('')
  const [editingQuestId, setEditingQuestId] = useState<string | null>(null)

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
  const [pendingConfirm, setPendingConfirm] = useState<PendingAdminConfirm | null>(null)
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
      const [membersRes, packsRes, schedulesRes, groupsRes, templatesRes, questsRes, badgesRes] = await Promise.all([
        supabase.from('profiles').select(publicProfileColumns).order('username'),
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
        supabase
          .from('user_quests')
          .select('*,profiles(username)')
          .order('created_at', { ascending: false }),
        supabase
          .from('badges')
          .select('id,name,icon_name')
          .eq('condition_type', 'manual_assignment')
          .order('target_value', { ascending: true }),
      ])

      if (membersRes.error) {
        console.error('Assign page members query failed', membersRes.error)
        notify.error('Erro ao carregar dados')
      }
      if (membersRes.data) setMembers(membersRes.data as MemberOption[])
      if (packsRes.data) setPacks(packsRes.data as Pack[])
      if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
      if (groupsRes.data) setMemberGroups(groupsRes.data as unknown as MemberGroupRecord[])
      if (templatesRes.data) setAssignmentTemplates(templatesRes.data as unknown as AssignmentTemplateRecord[])
      if (questsRes.data) setUserQuests(questsRes.data as unknown as UserQuestRecord[])
      if (badgesRes.data) setManualBadges(badgesRes.data as {id: string, name: string, icon_name: string}[])
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
      .select('id,name,description,pack_id,game_mode,time_limit_minutes,reward_badge_id,created_at,packs(id,name)')
      .order('created_at', { ascending: false })

    if (data) setAssignmentTemplates(data as unknown as AssignmentTemplateRecord[])
  }

  async function refreshQuestList() {
    const { data } = await supabase
      .from('user_quests')
      .select('*,profiles(username)')
      .order('created_at', { ascending: false })
    if (data) setUserQuests(data as unknown as UserQuestRecord[])
  }

  function resetGroupForm() {
    setEditingGroupId(null)
    setGroupName('')
    setGroupDescription('')
    setSelectedGroupMemberIds([])
  }

  function resetQuestForm() {
    setEditingQuestId(null)
    setQuestTargetId('all')
    setQuestType('any_session')
    setQuestTargetValue('5')
    setQuestExpiresAt('')
  }

  async function handleQuestSubmit() {
    startTransition(async () => {
      try {
        const result = editingQuestId
          ? await updateQuestAction(editingQuestId, {
              quest_type: questType,
              target: Number.parseInt(questTargetValue, 10),
              expires_at: questExpiresAt || null,
            })
          : await createQuestAction({
              userId: questTargetId,
              questType,
              target: Number.parseInt(questTargetValue, 10),
              expiresAt: questExpiresAt || null,
            })

        if (result.success) {
          await refreshQuestList()
          resetQuestForm()
        }
      } catch (error) {
        console.error('Quest operation failed', error)
      }
    })
  }

  async function handleDeleteQuest(questId: string) {
    setPendingConfirm(null)
    startTransition(async () => {
      const result = await deleteQuestAction(questId)
      if (result.success) {
        await refreshQuestList()
      }
    })
  }

  function startEditingQuest(quest: UserQuestRecord) {
    setEditingQuestId(quest.id)
    setQuestTargetId(quest.user_id)
    setQuestType(quest.quest_type)
    setQuestTargetValue(String(quest.target))
    setQuestExpiresAt(quest.expires_at ? quest.expires_at.split('T')[0] : '')
  }

  const [showAssignConfirm, setShowAssignConfirm] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSuccess(false)
    setErrorMsg(null)

    startTransition(async () => {
      try {
        const result = await createAssignment(formData)
        if (result?.success) {
          setSuccess(true)
          setShowAssignConfirm(false)
          notify.success('Tarefa atribuída')
          setTimeout(() => setSuccess(false), 3000)
        } else if (result?.error) {
          notify.error('Verifique os campos')
          setErrorMsg(result.error)
        }
      } catch (error: unknown) {
        notify.error('Verifique os campos')
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
    setPendingConfirm(null)
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
          rewardBadgeId: rewardBadgeId || null,
        })

        if (result?.success) {
          await refreshTemplateList()
          setTemplateName('')
          setTemplateDescription('')
          setRewardBadgeId('')
        }
      } catch (error: unknown) {
        console.error('Template operation failed', error)
      }
    })
  }

  async function handleDeleteTemplate(templateId: string) {
    setPendingConfirm(null)
    startTransition(async () => {
      const result = await deleteAssignmentTemplate(templateId)
      if (result?.success) {
        await refreshTemplateList()
      }
    })
  }

  async function handleDeleteSchedule(scheduleId: string) {
    setPendingConfirm(null)
    startTransition(async () => {
      const result = await deleteAssignment(scheduleId)
      if (result?.success) {
        setScheduledReviews((curr) => curr.filter((item) => item.id !== scheduleId))
      }
    })
  }

  function applyTemplate(template: AssignmentTemplateRecord) {
    setSelectedAssignmentPackId(template.pack_id)
    setSelectedAssignmentGameMode(template.game_mode as 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening' | 'speaking')
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
  const activeScheduledReviews = filteredScheduledReviews.filter((schedule) => parseScheduledReviewStatus(schedule.status)?.active).length

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
    setCardsPerRelease(String(Math.min(meta.cardsPerRelease, DEFAULT_REVIEW_SESSION_CARD_LIMIT)))
    setReviewExpiresOn(meta.expiresOn || '')
    void (async () => {
      if (!schedule.pack_id) return
      const { data } = await supabase.from('cards').select('*').eq('pack_id', schedule.pack_id).order('created_at', { ascending: true })
      setPackCards((data || []) as Card[])
      setSelectedReviewCardIds(meta.cardIds)
    })()
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Atribuições do programa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Crie tarefas, grupos, missões e revisões recorrentes para a operação diária.
          </p>
        </div>
        <a href="#assign-form" className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
          Atribuir tarefa
        </a>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Grupos', value: memberGroups.length, icon: Users },
          { label: 'Templates', value: assignmentTemplates.length, icon: ClipboardList },
          { label: 'Regras ativas', value: activeScheduledReviews, icon: CalendarClock },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-[0.9rem] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          )
        })}
      </section>

      <form action={handleSubmit} className="max-w-6xl space-y-6 rounded-[1rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6" id="assign-form">
        {errorMsg && (
          <div className="rounded-[0.85rem] bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 px-4 py-3 text-sm font-bold text-[var(--color-error)]">
            {errorMsg}
          </div>
        )}

        {success && (
          <div className="rounded-[0.85rem] bg-[var(--color-primary-light)] border border-[var(--color-primary-light)] px-4 py-3 text-sm font-bold text-[var(--color-primary)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Tarefa enviada
          </div>
        )}

        <div className="rounded-[0.9rem] border border-gray-100 bg-gray-50 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Templates rápidos</p>
              <p className="mt-1 text-sm text-gray-500">Ações frequentes salvas para um clique.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Nome" className="field !bg-[var(--color-surface-container-lowest)]" />
            <input value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} placeholder="Contexto" className="field !bg-[var(--color-surface-container-lowest)]" />
            <button type="button" onClick={handleSaveTemplate} disabled={isPending || !templateName || !selectedAssignmentPackId} className="btn-ghost !rounded-xl !bg-[var(--color-surface-container-lowest)] px-6 text-[var(--color-primary)]">
              Salvar
            </button>
          </div>

          {assignmentTemplates.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {assignmentTemplates.map((template) => (
                <div key={template.id} className="flex flex-col gap-3 overflow-hidden rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--color-text)]">{template.name}</p>
                    <p className="text-xs font-medium text-[var(--color-text-subtle)]">
                      {(template.packs?.[0]?.name || 'Pack')} · {gameModes.find(m => m.value === template.game_mode)?.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => applyTemplate(template)} className="btn-ghost !py-1.5 !px-3 !rounded-lg text-[10px] uppercase font-black tracking-widest">Aplicar</button>
                    <button type="button" onClick={() => setPendingConfirm({ type: 'template', id: template.id })} className="btn-ghost !py-1.5 !px-3 !rounded-lg text-[10px] uppercase font-black tracking-widest text-[var(--color-error)] hover:!bg-[var(--color-error)]/5">Sair</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
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

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Modo de Jogo</label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {gameModes.map((mode) => {
              const Icon = mode.icon
              const active = selectedAssignmentGameMode === mode.value
              return (
                <label key={mode.value} className="cursor-pointer">
                  <input type="radio" name="game_mode" value={mode.value} checked={active} onChange={() => setSelectedAssignmentGameMode(mode.value as 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening' | 'speaking')} className="hidden" />
                  <div className={`min-h-24 rounded-md border p-3 transition-colors ${active ? 'border-green-600 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${active ? 'border-green-100 bg-white text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-wide ${active ? 'text-green-700' : 'text-gray-500'}`}>{mode.label}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Data da Atribuição</label>
            <DateInput value={assignmentDate} onChange={setAssignmentDate} name="assigned_date" />
          </div>
          <div className="flex items-end">
            <label className="flex-1 flex items-center justify-between gap-4 rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 cursor-pointer hover:bg-[var(--color-surface-container)] transition-colors">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="timed" checked={timedMode} onChange={(e) => setTimedMode(e.target.checked)} className="h-5 w-5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
                <span className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest">Cronômetro</span>
              </div>
              {timedMode && (
                <div className="flex items-center gap-2">
                  <input type="number" name="time_limit_minutes" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} className="w-16 h-8 text-center bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] rounded-lg text-sm font-bold text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]" />
                  <span className="text-[10px] font-black text-[var(--color-text-subtle)] uppercase">min</span>
                </div>
              )}
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label mb-2 flex items-center gap-2">
              <Award className="h-4 w-4 text-[var(--color-primary)]" />
              Medalha de Recompensa (Opcional)
            </label>
            <select
              name="reward_badge_id"
              value={rewardBadgeId}
              onChange={(e) => setRewardBadgeId(e.target.value)}
              className="field text-sm sm:text-base font-semibold border-[var(--color-primary)]/20 focus:border-[var(--color-primary)] shadow-sm"
            >
              <option value="">Nenhuma (Missão Normal)</option>
              {manualBadges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--color-text-subtle)] font-medium mt-2">
              Selecione uma medalha para missões muito difíceis. Ela aparecerá no perfil do aluno ao completar a missão.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border)] flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {!showAssignConfirm ? (
            <button
              type="button"
              onClick={() => setShowAssignConfirm(true)}
              disabled={isPending}
              className="btn-primary flex-1 py-4 !rounded-xl text-sm"
            >
              Confirmar Atribuição
            </button>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary flex-1 py-4 !rounded-xl text-sm bg-emerald-600 hover:bg-emerald-700"
              >
                {isPending ? 'Processando...' : 'Confirmar agora?'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignConfirm(false)}
                className="btn-ghost py-4 !rounded-xl px-8 border border-[var(--color-border)]"
              >
                Cancelar
              </button>
            </div>
          )}
          <ClearAllAssignmentsButton isPending={isPending} />
        </div>
      </form>

      <section className="max-w-6xl space-y-6 rounded-[1rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Grupos de membros</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Segmentação de alunos</h2>
          <p className="mt-1 text-sm text-gray-500">Monte times para atribuição rápida de conteúdos específicos.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 sm:p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">{editingGroupId ? 'Editar Grupo' : 'Novo Grupo'}</h3>
            <div className="space-y-3">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Nome do grupo" className="field !bg-[var(--color-surface-container-lowest)]" />
              <input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} placeholder="Objetivo/Nível" className="field !bg-[var(--color-surface-container-lowest)]" />
              <div className="max-h-60 overflow-y-auto rounded-[0.9rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)]/50 p-3 space-y-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-3 rounded-[0.75rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] hover:bg-[var(--color-primary-light)]/20 cursor-pointer transition-colors">
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

          <div className="grid gap-3">
            {memberGroups.map(g => (
              <article key={g.id} className="overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4 shadow-sm transition-colors hover:bg-[var(--color-surface-container-low)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-black text-[var(--color-text)]">{g.name}</p>
                    <p className="text-xs font-medium text-[var(--color-text-subtle)] mt-1">{g.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(g.member_group_members || []).map(m => (
                        <span key={m.user_id} className="px-2 py-1 bg-[var(--color-surface-container)] border border-[var(--color-border)] rounded-[0.55rem] text-[10px] font-bold text-[var(--color-text-muted)]">
                          {m.profiles?.[0]?.username || '...'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditingGroup(g)} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text)] transition-colors" aria-label={`Editar grupo ${g.name}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setPendingConfirm({ type: 'group', id: g.id })} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors" aria-label={`Remover grupo ${g.name}`}><X className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl space-y-6 rounded-[1rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Missões e metas</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Missões diárias</h2>
          <p className="mt-1 text-sm text-gray-500">Defina objetivos específicos para os alunos e acompanhe o progresso em tempo real.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4 rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 sm:p-5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">{editingQuestId ? 'Editar Missão' : 'Nova Missão'}</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--color-text-subtle)] ml-1">Para quem?</label>
                <select 
                  value={questTargetId} 
                  onChange={(e) => setQuestTargetId(e.target.value)} 
                  disabled={!!editingQuestId}
                  className="field !bg-[var(--color-surface-container-lowest)]"
                >
                  <option value="all">Todos os membros</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-[var(--color-text-subtle)] ml-1">Tipo de Missão</label>
                <select value={questType} onChange={(e) => setQuestType(e.target.value)} className="field !bg-[var(--color-surface-container-lowest)]">
                  <option value="any_session">Completar qualquer lição</option>
                  <option value="listening_game">Completar lição de Escuta</option>
                  <option value="speaking_game">Completar lição de Fala</option>
                  <option value="perfect_accuracy">Conseguir 100% de precisão</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--color-text-subtle)] ml-1">Meta (Quantidade)</label>
                  <input type="number" value={questTargetValue} onChange={(e) => setQuestTargetValue(e.target.value)} className="field !bg-[var(--color-surface-container-lowest)]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-[var(--color-text-subtle)] ml-1">Expira em</label>
                  <input type="date" value={questExpiresAt} onChange={(e) => setQuestExpiresAt(e.target.value)} className="field !bg-[var(--color-surface-container-lowest)] text-xs" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleQuestSubmit} disabled={isPending} className="btn-primary !rounded-xl px-8 flex-1">
                  {editingQuestId ? 'Salvar Alteração' : 'Criar Missão'}
                </button>
                {editingQuestId && <button onClick={resetQuestForm} className="btn-ghost !rounded-xl px-6">Cancelar</button>}
              </div>
            </div>
          </div>

          <div className="grid max-h-[600px] gap-3 overflow-y-auto pr-1">
            {userQuests.length === 0 ? (
              <p className="rounded-[1rem] border border-dashed border-[var(--color-border)] py-10 text-center text-sm font-medium text-[var(--color-text-muted)]">Nenhuma missão ativa.</p>
            ) : (
              userQuests.map(q => (
                <article key={q.id} className="overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <QuestIcon className="h-4 w-4 text-[var(--color-primary)]" />
                        <span className="font-black text-[var(--color-text)] tracking-tight text-sm uppercase">
                          {q.quest_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-[var(--color-text-muted)]">
                        Membro: <span className="text-[var(--color-primary)]">{q.profiles?.username || '—'}</span>
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] font-black uppercase text-[var(--color-text-subtle)] mb-1">
                          <span>Progresso</span>
                          <span>{q.progress} / {q.target}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-container-low)] overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 ${q.status === 'completed' ? 'bg-green-500' : 'bg-[var(--color-primary)]'}`}
                            style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                      {q.expires_at && (
                        <p className="mt-2 text-[10px] font-bold text-[var(--color-error)] uppercase">
                          Expira em: {new Date(q.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditingQuest(q)} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors" aria-label="Editar missão"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setPendingConfirm({ type: 'quest', id: q.id })} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors" aria-label="Excluir missão"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <form action={handleScheduleSubmit} className="max-w-6xl space-y-6 rounded-[1rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Revisão automática</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">Regras recorrentes</h2>
          <p className="mt-1 text-sm text-gray-500">Agende disparos automáticos de vocabulário específico para reforço contínuo.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
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
                  <div className={`flex h-10 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${active ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {weekdayLabelMap[Number(d)]}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Horário</label>
            <input type="time" name="review_time" value={reviewTime} onChange={(e) => setReviewTime(e.target.value)} className="field font-bold text-[var(--color-text)]" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)] ml-1">Cards / Sessão</label>
            <input type="number" name="cards_per_release" min={1} max={DEFAULT_REVIEW_SESSION_CARD_LIMIT} value={cardsPerRelease} onChange={(e) => setCardsPerRelease(e.target.value)} className="field font-bold text-[var(--color-text)]" />
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
          <div className="max-h-72 overflow-y-auto rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-4 grid gap-2 sm:grid-cols-2">
            {packCards.map(c => (
              <label key={c.id} className="flex items-center gap-3 p-3 overflow-hidden rounded-[0.8rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] hover:border-[var(--color-primary-container)] cursor-pointer transition-all shadow-sm">
                <input type="checkbox" name="review_card_ids" value={c.id} checked={selectedReviewCardIds.includes(c.id)} onChange={(e) => setSelectedReviewCardIds(curr => e.target.checked ? [...curr, c.id] : curr.filter(id => id !== c.id))} className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]" />
                <span className="text-sm font-bold text-[var(--color-text)] line-clamp-1">{c.english_phrase}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--color-border)] flex flex-col gap-4 sm:flex-row">
          <button type="submit" disabled={isPending} className="btn-primary flex-1 py-4 !rounded-xl">
            {editingRuleId ? 'Salvar Regra' : 'Ativar Ciclo de Revisão'}
          </button>
          {editingRuleId && <button type="button" onClick={resetScheduleForm} className="btn-ghost !rounded-xl px-10 text-[var(--color-primary)]">Cancelar</button>}
        </div>

        <div className="space-y-4 pt-6 border-t border-[var(--color-border)]">
           <h3 className="text-xl font-black text-[var(--color-text)] px-1 tracking-tight">Status das regras</h3>
           <div className="grid gap-3">
             {filteredScheduledReviews.map(s => {
               const meta = parseScheduledReviewStatus(s.status)
               if (!meta) return null
               return (
                 <article key={s.id} className="overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                      <button type="button" onClick={() => startEditingRule(s)} className="p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors" aria-label="Editar regra recorrente"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setPendingConfirm({ type: 'schedule', id: s.id })} className="p-3 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)] text-[var(--color-text-subtle)] hover:text-[var(--color-error)] transition-colors" aria-label="Remover regra recorrente"><X className="h-4 w-4" /></button>
                    </div>
                 </article>
               )
             })}
           </div>
        </div>
      </form>
      {pendingConfirm && (
        <ConfirmDialog
          title={
            pendingConfirm.type === 'quest'
              ? 'Excluir missão'
              : pendingConfirm.type === 'group'
                ? 'Remover grupo'
                : pendingConfirm.type === 'template'
                  ? 'Remover template'
                  : 'Remover regra recorrente'
          }
          description={
            pendingConfirm.type === 'quest'
              ? 'Esta missão será removida dos alunos vinculados.'
              : pendingConfirm.type === 'group'
                ? 'Este grupo será removido e suas associações deixarão de existir.'
                : pendingConfirm.type === 'template'
                  ? 'Este template deixará de ficar disponível para novas atribuições.'
                  : 'Esta regra de revisão recorrente será removida.'
          }
          confirmLabel="Remover"
          onCancel={() => setPendingConfirm(null)}
          onConfirm={() => {
            if (pendingConfirm.type === 'quest') {
              void handleDeleteQuest(pendingConfirm.id)
              return
            }
            if (pendingConfirm.type === 'group') {
              void handleDeleteGroup(pendingConfirm.id)
              return
            }
            if (pendingConfirm.type === 'template') {
              void handleDeleteTemplate(pendingConfirm.id)
              return
            }
            void handleDeleteSchedule(pendingConfirm.id)
          }}
        />
      )}
    </div>
  )
}

function ClearAllAssignmentsButton({ isPending }: { isPending: boolean }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [clearing, startClearing] = useTransition()

  const handleClear = () => {
    startClearing(async () => {
      const result = await deleteAllAssignments()
      if (result.success) {
        setConfirmOpen(false)
        window.location.reload()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={isPending || clearing}
        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-error)]/20 bg-[var(--color-surface-container-low)] px-5 py-4 text-sm font-bold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
      >
        <Trash2 className="h-4 w-4" />
        {clearing ? 'Removendo...' : 'Limpar atribuições'}
      </button>
      {confirmOpen && (
        <ConfirmDialog
          title="Limpar atribuições"
          description="Todas as atribuições pendentes serão removidas. As concluídas serão preservadas."
          confirmLabel="Remover"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleClear}
        />
      )}
    </>
  )
}
