'use client'

import styles from '@/features/admin/components/AdminWorkspace.module.css'
import DataLoadState from '@/components/ui/DataLoadState'

import { WorkspaceList } from '@/components/ui/WorkspacePagination'
import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { LucideIcon } from 'lucide-react'
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
import AssignHeader from './AssignHeader'
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
  listQuestsAction,
  updateQuestAction,
  deleteQuestAction,
} from '@/app/actions'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SectionBadge from '@/components/ui/SectionBadge'
import AdminMetric from '@/features/admin/components/AdminMetric'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import {
  AdminBadge,
  adminAssignAlertError,
  adminAssignAlertSuccess,
  adminAssignIconBox,
  adminAssignModeCardActive,
  adminAssignModeCardIdle,
  adminAssignShell,
  adminAssignTelemetryBand,
  adminAssignTicket,
  adminAssignWeekdayActive,
  adminAssignWeekdayIdle,
  dangerBtn,
  fieldClass,
  fieldLabel,
  ghostBtn,
  innerPanelClass,
  nestedCardClass,
  neutralBadge,
  primaryBtn,
  sectionDivider,
} from '@/features/admin/lib/adminAssignUi'
import { homeIconGlyphSm } from '@/lib/homeStyles'
import { createClient } from '@/lib/supabase/client'
import { getAppDateString } from '@/lib/timezone'
import {
  parseScheduledReviewStatus,
} from '@/features/review/lib/reviewSchedules'
import { DEFAULT_REVIEW_SESSION_CARD_LIMIT } from '@/features/review/lib/reviewQueue'
import { notify } from '@/lib/toast'
import type { AssignmentTemplate, Card, MemberGroup, Pack, Profile } from '@/types/database.types'

const publicProfileColumns = 'id,username,role,created_at,updated_at,last_seen_at'

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

function AssignSectionHeading({
  badge,
  title,
  description,
  icon: Icon,
}: {
  badge: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className={`assign-section-icon ${adminAssignIconBox}`}>
        <Icon className={homeIconGlyphSm} strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <SectionBadge label={badge} animate={false} />
        <h2 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">{title}</h2>
        <p className="mt-2 font-body text-sm text-brand-secondary">{description}</p>
      </div>
    </div>
  )
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
        aria-label="Data da atribuição"
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
        className={fieldClass}
      />
    </>
  )
}

function relatedOne<T>(value:T|T[]|null|undefined):T|undefined { return Array.isArray(value)?value[0]:value??undefined }

export default function AssignPage() {
  type MemberOption = Pick<Profile, 'id' | 'username' | 'role'>
  type ScheduledReviewRule = { id: string; user_id: string | null; pack_id: string | null; status: string; profiles?: { username: string } | { username: string }[] | null; packs?: { name: string } | { name: string }[] | null }
  type MemberGroupRecord = MemberGroup & {
    member_group_members?: {
      user_id: string
      profiles?: Pick<Profile, 'id' | 'username'> | Pick<Profile, 'id' | 'username'>[] | null
    }[] | null
  }
  type AssignmentTemplateRecord = AssignmentTemplate & {
    packs?: Pick<Pack, 'id' | 'name'> | Pick<Pack, 'id' | 'name'>[] | null
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
  const [groupSnapshot,setGroupSnapshot]=useState<{name:string;description:string|null;memberIds:string[]} | null>(null)
  const [memberGroups, setMemberGroups] = useState<MemberGroupRecord[]>([])
  const [assignmentTemplates, setAssignmentTemplates] = useState<AssignmentTemplateRecord[]>([])
  const [userQuests, setUserQuests] = useState<UserQuestRecord[]>([])
  const [packCards, setPackCards] = useState<Card[]>([])
  const [cardsLoading, setCardsLoading] = useState(false)
  const [cardsError, setCardsError] = useState(false)
  const [cardsRevision, setCardsRevision] = useState(0)
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
  const [supabase] = useState(() => createClient())
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [loadRevision, setLoadRevision] = useState(0)
  const loadGeneration = useRef(0)

  useEffect(() => {
    const version = ++loadGeneration.current
    async function loadData() {
      setLoadingData(true); setLoadError(false)
      try {
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
        // Mesma razão do refreshQuestList: a RLS esconderia as missões dos outros alunos.
        listQuestsAction(),
        supabase
          .from('badges')
          .select('id,name,icon_name')
          .eq('condition_type', 'manual_assignment')
          .order('target_value', { ascending: true }),
      ])

      if (version !== loadGeneration.current) return
      if ([membersRes,packsRes,schedulesRes,groupsRes,templatesRes,badgesRes].some(result => result.error) || !questsRes.success) throw new Error('Incomplete assignment data')
      if (membersRes.data) setMembers(membersRes.data as MemberOption[])
      if (packsRes.data) setPacks(packsRes.data as Pack[])
      if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
      if (groupsRes.data) setMemberGroups(groupsRes.data as unknown as MemberGroupRecord[])
      if (templatesRes.data) setAssignmentTemplates(templatesRes.data as unknown as AssignmentTemplateRecord[])
      if (questsRes.success) setUserQuests(questsRes.quests as unknown as UserQuestRecord[])
      if (badgesRes.data) setManualBadges(badgesRes.data as {id: string, name: string, icon_name: string}[])
      } catch { if (version === loadGeneration.current) setLoadError(true) }
      finally { if (version === loadGeneration.current) setLoadingData(false) }
    }
    void loadData()
    const requests = loadGeneration
    return () => { requests.current++ }
  }, [supabase, loadRevision])

  useEffect(() => {
    let cancelled = false
    setPackCards([])
    setCardsError(false)
    if (!editingMode) setSelectedReviewCardIds([])
    if (!selectedReviewPackId) { setCardsLoading(false); return }
    setCardsLoading(true)
    async function loadPackCards() {
      try {
        const { data, error } = await supabase.from('cards').select('*')
          .eq('pack_id', selectedReviewPackId).order('created_at', { ascending: true })
        if (error) throw error
        if (!cancelled) setPackCards((data || []) as Card[])
      } catch { if (!cancelled) setCardsError(true) }
      finally { if (!cancelled) setCardsLoading(false) }
    }
    void loadPackCards()
    return () => { cancelled = true }
  }, [editingMode, selectedReviewPackId, supabase, cardsRevision])

  async function refreshGroupList() {
    const { data } = await supabase
      .from('member_groups')
      .select('id,name,description,created_at,member_group_members(user_id,profiles(id,username))')
      .order('name')

    if (!data) throw new Error('Não foi possível atualizar os grupos. Confira a lista antes de repetir a alteração.')
    if (data) setMemberGroups(data as unknown as MemberGroupRecord[])
  }

  async function refreshTemplateList() {
    const { data } = await supabase
      .from('assignment_templates')
      .select('id,name,description,pack_id,game_mode,time_limit_minutes,reward_badge_id,created_at,packs(id,name)')
      .order('created_at', { ascending: false })

    if (!data) throw new Error('Não foi possível atualizar os modelos. Confira a lista antes de repetir a alteração.')
    if (data) setAssignmentTemplates(data as unknown as AssignmentTemplateRecord[])
  }

  async function refreshQuestList() {
    // Pela action, não direto do navegador: a RLS de user_quests só devolve as missões do
    // próprio usuário, e um painel de admin precisa ver as que ele criou para os outros.
    const result = await listQuestsAction()
    if (!result.success) throw new Error('Não foi possível atualizar as missões. Confira a lista antes de repetir a alteração.')
    if (result.success) setUserQuests(result.quests as unknown as UserQuestRecord[])
  }

  function resetGroupForm() {
    setGroupSnapshot(null)
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
      setErrorMsg(null)

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
        } else {
          // Sem este ramo a action falhava em silêncio: ela devolve { success: false, error },
          // o `if` descartava, e o admin clicava em "Criar Missão" sem nada acontecer nem
          // aparecer. A página já mantinha `errorMsg` para os outros formulários.
          setErrorMsg(result.error || 'Não foi possível salvar a missão.')
        }
      } catch (error) {
        console.error('Quest operation failed', error)
        setErrorMsg(error instanceof Error ? error.message : 'Erro inesperado ao salvar a missão.')
      }
    })
  }

  function requireActionSuccess(result: unknown) {
    if (!result || typeof result !== 'object' || !('success' in result) || !result.success) {
      throw new Error(result && typeof result === 'object' && 'error' in result && typeof result.error === 'string' ? result.error : 'Não foi possível concluir a alteração. Tente novamente.')
    }
  }

  function runAdminAction(action: () => Promise<void>) {
    setErrorMsg(null)
    startTransition(async () => {
      try { await action() }
      catch (error) { setErrorMsg(error instanceof Error ? error.message : 'Não foi possível concluir a alteração. Tente novamente.') }
    })
  }

  async function handleDeleteQuest(questId: string) {
    setPendingConfirm(null)
    runAdminAction(async () => {
      const result = await deleteQuestAction(questId)
      requireActionSuccess(result)
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

    runAdminAction(async () => {
      try {
        const result = await createAssignment(formData)
        requireActionSuccess(result)
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
    setGroupSnapshot({name:group.name,description:group.description,memberIds:(group.member_group_members||[]).map(member=>member.user_id)})
    setEditingGroupId(group.id)
    setGroupName(group.name)
    setGroupDescription(group.description || '')
    setSelectedGroupMemberIds(
      (group.member_group_members || []).map((membership) => membership.user_id)
    )
  }

  async function handleGroupSubmit() {
    runAdminAction(async () => {
      try {
        if(editingGroupId&&!groupSnapshot)throw new Error('Reabra o grupo antes de salvar.')
        const result = editingGroupId
          ? await updateMemberGroup(editingGroupId, {
              name: groupName,
              description: groupDescription,
              memberIds: selectedGroupMemberIds,
            }, groupSnapshot!)
          : await createMemberGroup({
              name: groupName,
              description: groupDescription,
              memberIds: selectedGroupMemberIds,
            })

        requireActionSuccess(result)
        if (result?.success) {
          await refreshGroupList()
          resetGroupForm()
        }
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : 'Não foi possível concluir a alteração. Tente novamente.')
      }
    })
  }

  async function handleDeleteGroup(groupId: string) {
    setPendingConfirm(null)
    runAdminAction(async () => {
      const result = await deleteMemberGroup(groupId)
      requireActionSuccess(result)
      if (result?.success) {
        await refreshGroupList()
        if (editingGroupId === groupId) resetGroupForm()
      }
    })
  }

  async function handleSaveTemplate() {
    runAdminAction(async () => {
      try {
        const result = await createAssignmentTemplate({
          name: templateName,
          description: templateDescription,
          packId: selectedAssignmentPackId,
          gameMode: selectedAssignmentGameMode,
          timeLimitMinutes: timedMode ? Number.parseInt(timeLimitMinutes || '0', 10) || null : null,
          rewardBadgeId: rewardBadgeId || null,
        })

        requireActionSuccess(result)
        if (result?.success) {
          await refreshTemplateList()
          setTemplateName('')
          setTemplateDescription('')
          setRewardBadgeId('')
        }
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : 'Não foi possível concluir a alteração. Tente novamente.')
      }
    })
  }

  async function handleDeleteTemplate(templateId: string) {
    setPendingConfirm(null)
    runAdminAction(async () => {
      const result = await deleteAssignmentTemplate(templateId)
      requireActionSuccess(result)
      if (result?.success) {
        await refreshTemplateList()
      }
    })
  }

  async function handleDeleteSchedule(scheduleId: string) {
    setPendingConfirm(null)
    runAdminAction(async () => {
      const result = await deleteAssignment(scheduleId)
      requireActionSuccess(result)
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
    if (cardsLoading || cardsError) return
    runAdminAction(async () => {
      try {
        const finalResult = editingRuleId
          ? await updateScheduledReviewRule(editingRuleId, formData)
          : await createScheduledReviewRule(formData)

        requireActionSuccess(finalResult)
        if (finalResult?.success) {
          setEditingMode(false)

          const schedulesRes = await supabase
            .from('assignments')
            .select('id,user_id,pack_id,status,profiles(username),packs(name)')
            .eq('game_mode', 'scheduled_review')
            .order('created_at', { ascending: false })

          if (schedulesRes.error) throw new Error('Não foi possível atualizar as regras. Confira a lista antes de repetir a alteração.')
          if (schedulesRes.data) setScheduledReviews(schedulesRes.data as unknown as ScheduledReviewRule[])
          resetScheduleForm()
        }
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : 'Não foi possível concluir a alteração. Tente novamente.')
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
    setSelectedReviewCardIds(meta.cardIds)
  }

  const activeQuests = userQuests.filter((quest) => quest.status !== 'completed').length

  if (loadingData || loadError) return <DataLoadState title="Atribuições" loading={loadingData} onRetry={() => setLoadRevision(value => value + 1)} />

  return (
    <div className={`${adminAssignShell} ${styles.workspace}`}>
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-full space-y-6 pb-8 sm:space-y-8">
<AdminMotionSection>
          <AssignHeader
            groupCount={memberGroups.length}
            templateCount={assignmentTemplates.length}
            activeRulesCount={activeScheduledReviews}
            questCount={activeQuests}
          />
        </AdminMotionSection>

<details className="workspace-disclosure"><summary>Resumo das atribuições</summary><AdminMotionSection className={adminAssignTelemetryBand} stagger>
          <AdminMotionItem>
            <AdminMetric tone="tutor" label="Grupos" value={String(memberGroups.length)} icon={Users} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="grammar" label="Templates" value={String(assignmentTemplates.length)} icon={ClipboardList} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="review" label="Regras ativas" value={String(activeScheduledReviews)} icon={CalendarClock} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="achievement" label="Missões" value={String(activeQuests)} icon={QuestIcon} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="listening" label="Membros" value={String(members.length)} icon={Users} />
          </AdminMotionItem>
          <AdminMotionItem>
            <AdminMetric tone="vocabulary" label="Packs" value={String(packs.length)} icon={Layers} />
          </AdminMotionItem>
        </AdminMotionSection></details>

        {errorMsg && <div role="alert" className={adminAssignAlertError}>{errorMsg}</div>}

<WorkspaceSections label="Organização das atribuições" tabs={[{"id":"atribuir","label":"Atribuir","description":"Escolha o conteúdo, os alunos e o modo de prática.","icon":"assign","anchors":["assign-form"]},{"id":"equipes","label":"Grupos","description":"Organize alunos para atribuir atividades em conjunto.","icon":"users","anchors":["grupos"]},{"id":"missoes","label":"Missões","description":"Defina objetivos e acompanhe as missões criadas.","icon":"target","anchors":[]},{"id":"revisoes","label":"Programar","description":"Configure revisões recorrentes e gerencie suas regras.","icon":"calendar","anchors":[]}]} >
<div className="workspace-panel-stack"><AdminMotionSection>
      <form action={handleSubmit} className={`${styles.flushPanel} space-y-6`} id="assign-form">

        {success && (
          <div role="status" className={adminAssignAlertSuccess}>
            <CheckCircle2 className="h-5 w-5 shrink-0" /> Tarefa enviada
          </div>
        )}

        <details className="workspace-disclosure"><summary>Usar ou salvar um modelo de atribuição</summary><div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <AdminBadge label="Templates rápidos" />
              <p className="mt-4 font-body text-sm text-brand-secondary">Ações frequentes salvas para um clique.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} aria-label="Nome do modelo" placeholder="Nome" className={fieldClass} />
            <input value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)} aria-label="Contexto do modelo" placeholder="Contexto" className={fieldClass} />
            <button type="button" onClick={handleSaveTemplate} disabled={isPending || !templateName || !selectedAssignmentPackId} className={`${ghostBtn} px-6`}>
              Salvar
            </button>
          </div>

          {assignmentTemplates.length > 0 && (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {assignmentTemplates.map((template) => (
                <div key={template.id} className={`${adminAssignTicket} ${nestedCardClass} flex flex-col gap-3 overflow-hidden p-3 sm:flex-row sm:items-center sm:justify-between`}>
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-brand-dark">{template.name}</p>
                    <p className="font-body text-xs font-medium text-brand-secondary">
                      {(relatedOne(template.packs)?.name || 'Pack')} · {gameModes.find(m => m.value === template.game_mode)?.label}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => applyTemplate(template)} className={`${ghostBtn} px-3 py-1.5 font-heading text-2xs uppercase tracking-widest`}>Aplicar</button>
                    <button type="button" onClick={() => setPendingConfirm({ type: 'template', id: template.id })} className={`${ghostBtn} px-3 py-1.5 font-heading text-2xs uppercase tracking-widest text-[var(--color-error)] hover:bg-[var(--color-error)]/10`}>Sair</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div></details>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-1" className={`${fieldLabel} ml-1`}>Membro ou Grupo</label>
            <select id="admin-assign-field-1" name="user_id" required className={`${fieldClass} cursor-pointer font-bold`} value={assignmentTargetId} onChange={(e) => setAssignmentTargetId(e.target.value)}>
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
            <label htmlFor="admin-assign-field-2" className={`${fieldLabel} ml-1`}>Pack de Cartas</label>
            <select id="admin-assign-field-2" name="pack_id" required className={`${fieldClass} cursor-pointer font-bold`} value={selectedAssignmentPackId} onChange={(e) => setSelectedAssignmentPackId(e.target.value)}>
              <option value="">Selecione...</option>
              {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className={`${fieldLabel} ml-1`}>Modo de Jogo</label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {gameModes.map((mode) => {
              const Icon = mode.icon
              const active = selectedAssignmentGameMode === mode.value
              return (
                <label key={mode.value} className="cursor-pointer">
                  <input type="radio" name="game_mode" value={mode.value} checked={active} onChange={() => setSelectedAssignmentGameMode(mode.value as 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening' | 'speaking')} className="sr-only peer" />
                  <div className={`peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 ${active ? adminAssignModeCardActive : adminAssignModeCardIdle}`}>
                    <div className={adminAssignIconBox}>
                      <Icon className={homeIconGlyphSm} strokeWidth={1.5} />
                    </div>
                    <p className={`mt-3 font-heading text-xs font-semibold uppercase tracking-wide ${active ? 'text-brand-dark' : 'text-brand-secondary'}`}>{mode.label}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className={`${fieldLabel} ml-1`}>Data da Atribuição</label>
            <DateInput value={assignmentDate} onChange={setAssignmentDate} name="assigned_date" />
          </div>
          <div className="flex items-end">
            <label className={`${innerPanelClass} flex flex-1 cursor-pointer items-center justify-between gap-4 transition-colors hover:bg-bg-card`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" name="timed" checked={timedMode} onChange={(e) => setTimedMode(e.target.checked)} className="h-5 w-5 rounded border-2 border-brand-dark text-brand-dark focus:ring-brand-accent/40" />
                <span className="font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">Cronômetro</span>
              </div>
              {timedMode && (
                <div className="flex items-center gap-2">
                  <input type="number" aria-label="Limite de tempo em minutos" name="time_limit_minutes" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(e.target.value)} className="h-8 w-16 rounded-lg border-2 border-brand-dark bg-bg-primary text-center font-body text-sm font-bold text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-accent/40" />
                  <span className={`${fieldLabel} uppercase`}>min</span>
                </div>
              )}
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className={`${fieldLabel} mb-2 flex items-center gap-2`}>
              <Award className="h-4 w-4 text-brand-dark" />
              Medalha de Recompensa (Opcional)
            </label>
            <select
              aria-label="Medalha de recompensa (opcional)"
              name="reward_badge_id"
              value={rewardBadgeId}
              onChange={(e) => setRewardBadgeId(e.target.value)}
              className={`${fieldClass} text-sm font-semibold sm:text-base`}
            >
              <option value="">Nenhuma (Missão Normal)</option>
              {manualBadges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.name}
                </option>
              ))}
            </select>
            <p className="mt-2 font-body text-xs font-medium text-brand-secondary">
              Selecione uma medalha para missões muito difíceis. Ela ficará registrada no progresso do aluno ao completar a missão.
            </p>
          </div>
        </div>

        <div className={`flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:gap-4 ${sectionDivider}`}>
          {!showAssignConfirm ? (
            <button
              type="button"
              onClick={() => setShowAssignConfirm(true)}
              disabled={isPending}
              className={`${primaryBtn} flex-1 py-4 text-sm`}
            >
              Confirmar Atribuição
            </button>
          ) : (
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={isPending}
                className={`${primaryBtn} flex-1 py-4 text-sm`}
              >
                {isPending ? 'Processando...' : 'Confirmar agora?'}
              </button>
              <button
                type="button"
                onClick={() => setShowAssignConfirm(false)}
                className={`${ghostBtn} px-8 py-4`}
              >
                Cancelar
              </button>
            </div>
          )}
          <ClearAllAssignmentsButton isPending={isPending} />
        </div>
      </form>
        </AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection>
      <section className={`${styles.flushPanel} space-y-6`} id="grupos">
        <AssignSectionHeading
          badge="Grupos de membros"
          title="Segmentação de alunos"
          description="Monte times para atribuição rápida de conteúdos específicos."
          icon={Users}
        />

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className={`${innerPanelClass} space-y-4`}>
            <h3 className={fieldLabel}>{editingGroupId ? 'Editar Grupo' : 'Novo Grupo'}</h3>
            <div className="space-y-3">
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} aria-label="Nome do grupo" placeholder="Nome do grupo" className={fieldClass} />
              <input value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} aria-label="Objetivo ou nível do grupo" placeholder="Objetivo/Nível" className={fieldClass} />
              <div className={`${nestedCardClass} max-h-60 space-y-2 overflow-y-auto p-3`}>
                {members.map(m => (
                  <label key={m.id} className={`${nestedCardClass} flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-brand-accent/20`}>
                    <input type="checkbox" checked={selectedGroupMemberIds.includes(m.id)} onChange={(e) => setSelectedGroupMemberIds(curr => e.target.checked ? [...curr, m.id] : curr.filter(id => id !== m.id))} className="h-4 w-4 rounded border-2 border-brand-dark text-brand-dark focus:ring-brand-accent/40" />
                    <span className="font-body text-sm font-bold text-brand-dark">{m.username}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleGroupSubmit} disabled={isPending} className={`${primaryBtn} flex-1 px-8`}>Salvar</button>
                {editingGroupId && <button onClick={resetGroupForm} className={`${ghostBtn} px-6`}>Sair</button>}
              </div>
            </div>
          </div>

          <WorkspaceList pageSize={4} className="grid gap-3">
            {memberGroups.map(g => (
              <article key={g.id} className={`${adminAssignTicket} ${nestedCardClass} overflow-hidden p-4 transition-colors hover:bg-bg-card`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-heading font-bold text-brand-dark">{g.name}</p>
                    <p className="mt-1 font-body text-xs font-medium text-brand-secondary">{g.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {(g.member_group_members || []).map(m => (
                        <span key={m.user_id} className={neutralBadge}>
                          {relatedOne(m.profiles)?.username || '...'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEditingGroup(g)} className="p-2 text-brand-secondary transition-colors hover:text-brand-dark" aria-label={`Editar grupo ${g.name}`}><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setPendingConfirm({ type: 'group', id: g.id })} className="p-2 text-brand-secondary transition-colors hover:text-[var(--color-error)]" aria-label={`Remover grupo ${g.name}`}><X className="h-4 w-4" /></button>
                  </div>
                </div>
              </article>
            ))}
          </WorkspaceList>
        </div>
      </section>
        </AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection>
      <section className={`${styles.flushPanel} space-y-6`}>
        <AssignSectionHeading
          badge="Missões e metas"
          title="Missões diárias"
          description="Defina objetivos específicos para os alunos e acompanhe o progresso em tempo real."
          icon={QuestIcon}
        />

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <div className={`${innerPanelClass} space-y-4`}>
            <h3 className={fieldLabel}>{editingQuestId ? 'Editar Missão' : 'Nova Missão'}</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="admin-assign-field-3" className={`${fieldLabel} ml-1`}>Para quem?</label>
                <select id="admin-assign-field-3"
                  value={questTargetId}
                  onChange={(e) => setQuestTargetId(e.target.value)}
                  disabled={!!editingQuestId}
                  className={fieldClass}
                >
                  <option value="all">Todos os membros</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="admin-assign-field-4" className={`${fieldLabel} ml-1`}>Tipo de Missão</label>
                <select id="admin-assign-field-4" value={questType} onChange={(e) => setQuestType(e.target.value)} className={fieldClass}>
                  <option value="any_session">Completar qualquer lição</option>
                  <option value="listening_game">Completar lição de Escuta</option>
                  <option value="speaking_game">Completar lição de Fala</option>
                  <option value="perfect_accuracy">Conseguir 100% de precisão</option>
                  <option value="blitz_session">Jogar partida de Blitz</option>
                  <option value="blitz_combo">Atingir combo no Blitz (meta = combo mínimo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="admin-assign-field-5" className={`${fieldLabel} ml-1`}>Meta (Quantidade)</label>
                  <input id="admin-assign-field-5" type="number" value={questTargetValue} onChange={(e) => setQuestTargetValue(e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="admin-assign-field-6" className={`${fieldLabel} ml-1`}>Expira em</label>
                  <input id="admin-assign-field-6" type="date" value={questExpiresAt} onChange={(e) => setQuestExpiresAt(e.target.value)} className={`${fieldClass} text-xs`} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleQuestSubmit} disabled={isPending} className={`${primaryBtn} flex-1 px-8`}>
                  {editingQuestId ? 'Salvar Alteração' : 'Criar Missão'}
                </button>
                {editingQuestId && <button onClick={resetQuestForm} className={`${ghostBtn} px-6`}>Cancelar</button>}
              </div>
            </div>
          </div>

          <WorkspaceList pageSize={4} className="grid gap-3">
            {userQuests.length === 0 ? (
              <p className="rounded-control border border-dashed border-brand-dark/30 py-10 text-center font-body text-sm font-medium text-brand-secondary">Nenhuma missão ativa.</p>
            ) : (
              userQuests.map(q => (
                <article key={q.id} className={`${adminAssignTicket} ${nestedCardClass} overflow-hidden p-4`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <QuestIcon className="h-4 w-4 text-brand-dark" />
                        <span className="font-heading text-sm font-bold uppercase tracking-tight text-brand-dark">
                          {q.quest_type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="font-body text-sm font-bold text-brand-secondary">
                        Membro: <span className="text-brand-dark">{q.profiles?.username || '—'}</span>
                      </p>
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between font-heading text-2xs font-bold uppercase text-brand-secondary">
                          <span>Progresso</span>
                          <span>{q.progress} / {q.target}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full border border-brand-dark/20 bg-bg-primary">
                          <div
                            className={`h-full transition-all duration-500 ${q.status === 'completed' ? 'bg-[var(--color-success)]' : 'bg-brand-dark'}`}
                            style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                      {q.expires_at && (
                        <p className="mt-2 font-heading text-2xs font-bold uppercase text-[var(--color-error)]">
                          Expira em: {new Date(q.expires_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => startEditingQuest(q)} className="p-2 text-brand-secondary transition-colors hover:text-brand-dark" aria-label="Editar missão"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setPendingConfirm({ type: 'quest', id: q.id })} className="p-2 text-brand-secondary transition-colors hover:text-[var(--color-error)]" aria-label="Excluir missão"><X className="h-4 w-4" /></button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </WorkspaceList>
        </div>
      </section>
        </AdminMotionSection></div>
<div className="workspace-panel-stack"><AdminMotionSection>
      <form action={handleScheduleSubmit} className={`${styles.flushPanel} space-y-6`}>
        <AssignSectionHeading
          badge="Revisão automática"
          title="Regras recorrentes"
          description="Agende disparos automáticos de vocabulário específico para reforço contínuo."
          icon={CalendarClock}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-7" className={`${fieldLabel} ml-1`}>Membro Alvo</label>
            <select id="admin-assign-field-7" name="review_user_id" required className={`${fieldClass} cursor-pointer font-bold`} value={selectedReviewUserId} onChange={(e) => setSelectedReviewUserId(e.target.value)}>
              <option value="">Selecione...</option>
              <option value="all">Todos</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-8" className={`${fieldLabel} ml-1`}>Origem do Pack</label>
            <select id="admin-assign-field-8" name="review_pack_id" required className={`${fieldClass} cursor-pointer font-bold`} value={selectedReviewPackId} onChange={(e) => setSelectedReviewPackId(e.target.value)}>
              <option value="">Selecione...</option>
              {packs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className={`${fieldLabel} ml-1`}>Agenda Semanal</label>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {['0','1','2','3','4','5','6'].map(d => {
              const active = selectedWeekdays.includes(d)
              return (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="review_weekdays" value={d} checked={active} onChange={(e) => setSelectedWeekdays(curr => e.target.checked ? [...curr, d] : curr.filter(x => x !== d))} className="sr-only peer" />
                  <div className={`peer-focus-visible:outline-2 peer-focus-visible:outline-primary peer-focus-visible:outline-offset-2 ${active ? adminAssignWeekdayActive : adminAssignWeekdayIdle}`}>
                    {weekdayLabelMap[Number(d)]}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-9" className={`${fieldLabel} ml-1`}>Horário</label>
            <input id="admin-assign-field-9" type="time" name="review_time" value={reviewTime} onChange={(e) => setReviewTime(e.target.value)} className={`${fieldClass} font-bold`} />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-10" className={`${fieldLabel} ml-1`}>Cards / Sessão</label>
            <input id="admin-assign-field-10" type="number" name="cards_per_release" min={1} max={DEFAULT_REVIEW_SESSION_CARD_LIMIT} value={cardsPerRelease} onChange={(e) => setCardsPerRelease(e.target.value)} className={`${fieldClass} font-bold`} />
          </div>
          <div className="space-y-2">
            <label htmlFor="admin-assign-field-11" className={`${fieldLabel} ml-1`}>Fim do Ciclo</label>
            <input id="admin-assign-field-11" type="date" name="review_expires_on" value={reviewExpiresOn} onChange={(e) => setReviewExpiresOn(e.target.value)} className={`${fieldClass} text-xs font-bold`} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <p className={fieldLabel}>Cards ({selectedReviewCardIds.length})</p>
            <div className="flex min-w-0 flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedReviewCardIds(packCards.slice(0, 10).map(c => c.id))} className={`${ghostBtn} px-2.5 py-1.5 font-heading text-2xs uppercase tracking-widest`}>Top 10</button>
              <button type="button" onClick={() => setSelectedReviewCardIds(packCards.map(c => c.id))} className={`${ghostBtn} px-2.5 py-1.5 font-heading text-2xs uppercase tracking-widest`}>Tudo</button>
              <button type="button" onClick={() => setSelectedReviewCardIds([])} className={`${ghostBtn} px-2.5 py-1.5 font-heading text-2xs uppercase tracking-widest`}>Reset</button>
            </div>
          </div>
          {cardsLoading && <p role="status">Carregando cards…</p>}
          {cardsError && <div role="alert">Não foi possível carregar os cards. <button type="button" onClick={() => setCardsRevision(value => value + 1)}>Tentar carregar cards novamente</button></div>}
          <div className={`${innerPanelClass} grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2`}>
            {packCards.map(c => (
              <label key={c.id} className={`${nestedCardClass} flex cursor-pointer items-center gap-3 overflow-hidden p-3 transition-all hover:bg-brand-accent/20`}>
                <input type="checkbox" name="review_card_ids" value={c.id} checked={selectedReviewCardIds.includes(c.id)} onChange={(e) => setSelectedReviewCardIds(curr => e.target.checked ? [...curr, c.id] : curr.filter(id => id !== c.id))} className="h-4 w-4 rounded border-2 border-brand-dark text-brand-dark" />
                <span className="line-clamp-1 font-body text-sm font-bold text-brand-dark">{c.english_phrase}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-4 pt-6 sm:flex-row ${sectionDivider}`}>
          <button type="submit" disabled={isPending || cardsLoading || cardsError} className={`${primaryBtn} flex-1 py-4`}>
            {editingRuleId ? 'Salvar Regra' : 'Ativar Ciclo de Revisão'}
          </button>
          {editingRuleId && <button type="button" onClick={resetScheduleForm} className={`${ghostBtn} px-10 py-4`}>Cancelar</button>}
        </div>

        <div className={`space-y-4 pt-6 ${sectionDivider}`}>
           <h3 className="px-1 font-heading text-xl font-bold tracking-tight text-brand-dark">Status das regras</h3>
           <WorkspaceList pageSize={4} className="grid gap-3">
             {filteredScheduledReviews.map(s => {
               const meta = parseScheduledReviewStatus(s.status)
               if (!meta) return null
               return (
                 <article key={s.id} className={`${adminAssignTicket} ${nestedCardClass} flex flex-col justify-between gap-4 overflow-hidden p-4 md:flex-row md:items-center`}>
                    <div>
                      <div className="mb-2 flex items-center gap-3">
                        <p className="font-heading font-bold uppercase tracking-tight text-brand-dark">{relatedOne(s.profiles)?.username || '...'}</p>
                        <span className={`${neutralBadge} ${meta.active ? 'bg-brand-accent text-brand-dark' : ''}`}>
                          {meta.active ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      <p className="font-body text-sm font-bold text-brand-secondary">{relatedOne(s.packs)?.name}</p>
                      <p className="mt-2 font-heading text-2xs font-bold uppercase text-brand-secondary">{meta.weekdays.map(d => weekdayLabelMap[Number(d)]).join(', ')} · {meta.time}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startEditingRule(s)} className={`${ghostBtn} p-3`} aria-label="Editar regra recorrente"><Pencil className="h-4 w-4" /></button>
                      <button type="button" onClick={() => setPendingConfirm({ type: 'schedule', id: s.id })} className={`${ghostBtn} p-3 text-[var(--color-error)] hover:bg-[var(--color-error)]/10`} aria-label="Remover regra recorrente"><X className="h-4 w-4" /></button>
                    </div>
                 </article>
               )
             })}
           </WorkspaceList>
        </div>
      </form>
        </AdminMotionSection></div>
</WorkspaceSections>

{pendingConfirm && (
        <ConfirmDialog
          surfaceClassName={styles.dialog}
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
        className={`${dangerBtn} gap-2 px-5 py-4 text-[var(--color-error)] hover:bg-[var(--color-error)]/10`}
      >
        <Trash2 className="h-4 w-4" />
        {clearing ? 'Removendo...' : 'Limpar atribuições'}
      </button>
      {confirmOpen && (
        <ConfirmDialog
          surfaceClassName={styles.dialog}
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
