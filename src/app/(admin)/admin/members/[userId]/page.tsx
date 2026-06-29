import { Fragment } from 'react'
import { notFound, redirect } from 'next/navigation'
import {
  BarChart3,
  Check,
  Clock,
  Flame,
  LogIn,
  LogOut,
  Percent,
  X,
} from 'lucide-react'
import { parseAssignmentStatus } from '@/features/game/lib/assignmentStatus'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import { AdminMotionItem, AdminMotionSection } from '@/features/admin/components/AdminMotion'
import {
  AdminBadge,
  AdminStatCard,
  accentBadge,
  fieldLabel,
  glassTile,
  iconClass,
  innerPanelClass,
  nestedCardClass,
  neutralBadge,
  pageInner,
  pageRoot,
  sectionDivider,
  tableBodyRow,
  tableDivider,
  tableHeadRow,
} from '@/features/admin/lib/adminUi'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { formatAppDate, formatAppDateTime, formatAppTime } from '@/lib/timezone'
import HistoryChart from '@/features/review/components/HistoryChart'
import SessionErrorsViewer, { SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import LevelSelector from './LevelSelector'
import type { GameSession, Pack, Profile } from '@/types/database.types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type MemberSession = GameSession & {
  assignments: {
    status: string
    game_mode: string
    packs: Pick<Pack, 'name'> | null
  } | null
  session_errors: SessionErrorLog[]
}

function getInitial(username: string) {
  return username.trim().charAt(0).toUpperCase() || '?'
}

function formatSessionDuration(lastSignInAt: string | null, lastSeenAt: string | null) {
  if (!lastSignInAt || !lastSeenAt) return 'Indisponível'

  const diffMs = new Date(lastSeenAt).getTime() - new Date(lastSignInAt).getTime()
  if (diffMs < 0) return 'Sessão ativa'

  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const seconds = Math.floor((diffMs % 60000) / 1000)
  const parts: string[] = []

  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}min`)
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`)

  return parts.join(' ')
}

export default async function MemberHistoryPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  const supabase = await createClient()

  // Gate: only admins
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminProfile?.role !== 'admin') redirect('/home')

  const adminSupabase = createAdminClient() ?? supabase

  // Fetch target member profile
  const { data: member, error: memberError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (memberError) {
    console.error('Admin member profile query failed', { userId, memberError })
  }

  if (!member) notFound()

  const memberProfile = member as Profile
  const username = memberProfile.username || 'Membro'

  // Fetch auth user for metadata (english level + last sign in)
  const { data: authUser } = await adminSupabase.auth.admin.getUserById(userId)
  const userMeta = authUser?.user?.user_metadata || {}
  const englishLevel = userMeta.english_level || 'B2'
  const lastSignInAt = authUser?.user?.last_sign_in_at || null
  const lastSeenAt = memberProfile.last_seen_at || null

  async function updateLevelAction(formData: FormData) {
    'use server'
    const { updateMemberLevel } = await import('@/app/actions')
    const levelCode = formData.get('level') as string
    const levels: Record<string, string> = {
      'A1': 'Iniciante',
      'A2': 'Básico',
      'B1': 'Intermediário',
      'B2': 'Intermediário superior',
      'C1': 'Avançado',
      'C2': 'Proficiente',
    }
    const levelName = levels[levelCode] || 'Intermediário superior'
    await updateMemberLevel(userId, levelCode, levelName)
  }

  // Fetch all sessions for this member
  const { data: sessions, error: sessionsError } = await adminSupabase
    .from('game_sessions')
    .select('*, assignments(status, game_mode, pack_id, packs(name)), session_errors(*, cards(english_phrase, portuguese_translation, audio_url))')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  if (sessionsError) {
    console.error('Admin member sessions query failed', { userId, sessionsError })
    throw new Error('Falha ao carregar o histórico do membro.')
  }

  const typedSessions = (sessions ?? []) as unknown as MemberSession[]

  // Aggregate stats
  const totalSessions = typedSessions.length
  const totalCorrect = typedSessions.reduce((s, r) => s + r.correct_answers, 0)
  const totalWrong = typedSessions.reduce((s, r) => s + r.wrong_answers, 0)
  const totalCards = totalCorrect + totalWrong
  const accuracy = totalCards > 0 ? Math.round((totalCorrect / totalCards) * 100) : 0
  const bestStreak = typedSessions.reduce((b, r) => Math.max(b, r.max_streak), 0)

  // Chart data (chronological)
  const chartData = typedSessions
    .slice()
    .reverse()
    .map((s) => ({
      date: formatAppDate(s.completed_at, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      acerto:
        s.correct_answers + s.wrong_answers > 0
          ? Math.round((s.correct_answers / (s.correct_answers + s.wrong_answers)) * 100)
          : 0,
      pack: s.assignments?.packs?.name || '',
    }))

  const statCards = [
    {
      label: 'Sessões',
      value: totalSessions,
      subtitle: 'Partidas registradas',
      icon: BarChart3,
    },
    {
      label: 'Acerto médio',
      value: `${accuracy}%`,
      subtitle: 'Precisão consolidada',
      icon: Percent,
    },
    {
      label: 'Cards certos',
      value: totalCorrect,
      subtitle: 'Soma de acertos',
      icon: Check,
    },
    {
      label: 'Cards errados',
      value: totalWrong,
      subtitle: 'Soma de erros',
      icon: X,
    },
    {
      label: 'Melhor streak',
      value: bestStreak,
      subtitle: 'Sequência máxima',
      icon: Flame,
    },
  ]

  const modeLabelMap: Record<string, string> = {
    multiple_choice: 'Múltipla',
    flashcard: 'Flashcard',
    typing: 'Digitação',
    matching: 'Associação',
    listening: 'Escuta',
    speaking: 'Fala',
  }

  return (
    <div className={pageRoot}>
      <div className={pageInner}>
        <AdminMotionSection>
          <AdminSectionHeader
            breadcrumb={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Membros', href: '/admin/members' },
              { label: username },
            ]}
            badge="Dados do membro"
            accentLabel={englishLevel}
            title={username}
            description={memberProfile.email}
            anchorHref="#sessoes"
            anchorLabel="Ver sessões"
            anchorIcon={BarChart3}
            action={
              <div className="flex flex-col gap-3 sm:items-end">
                <LevelSelector englishLevel={englishLevel} action={updateLevelAction} />
                <div className={`${nestedCardClass} min-w-[200px] px-4 py-3`}>
                  <p className={fieldLabel}>Inscrito em</p>
                  <p className="mt-2 font-body text-sm font-semibold text-brand-dark">
                    {formatAppDate(memberProfile.created_at)}
                  </p>
                </div>
              </div>
            }
          />
        </AdminMotionSection>

        <AdminMotionSection>
          <section className={`${glassTile} p-5 sm:p-6`}>
            <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent font-heading text-lg font-bold text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
                  {getInitial(username)}
                </div>
                <div>
                  <AdminBadge label="Perfil ativo" />
                  <p className="mt-3 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
                    {username}
                  </p>
                  <p className="mt-1 font-body text-sm text-brand-secondary">{memberProfile.email}</p>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 grid gap-3 border-t-2 border-brand-dark/15 pt-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className={`${nestedCardClass} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={fieldLabel}>Horário de entrada</p>
                  <LogIn className="h-4 w-4 text-brand-secondary" />
                </div>
                <p className="mt-3 font-body text-sm font-semibold text-brand-dark">
                  {lastSignInAt
                    ? formatAppDateTime(lastSignInAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Nunca logou'}
                </p>
                {lastSignInAt ? (
                  <p className="mt-1 font-body text-xs text-brand-secondary">Último login registrado</p>
                ) : null}
              </div>

              <div className={`${nestedCardClass} p-4`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={fieldLabel}>Horário de saída</p>
                  <LogOut className="h-4 w-4 text-brand-secondary" />
                </div>
                <p className="mt-3 font-body text-sm font-semibold text-brand-dark">
                  {lastSeenAt
                    ? formatAppDateTime(lastSeenAt, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Sem registro'}
                </p>
                {lastSeenAt ? (
                  <p className="mt-1 font-body text-xs text-brand-secondary">Última atividade registrada</p>
                ) : null}
              </div>

              <div className={`${nestedCardClass} p-4 sm:col-span-2 lg:col-span-1`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={fieldLabel}>Tempo na sessão</p>
                  <Clock className="h-4 w-4 text-brand-secondary" />
                </div>
                <p className="mt-3 font-body text-sm font-semibold text-brand-dark">
                  {formatSessionDuration(lastSignInAt, lastSeenAt)}
                </p>
                <p className="mt-1 font-body text-xs text-brand-secondary">
                  Diferença entre entrada e última atividade
                </p>
              </div>
            </div>
          </section>
        </AdminMotionSection>

        <AdminMotionSection className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5" stagger>
          {statCards.map((stat) => (
            <AdminMotionItem key={stat.label}>
              <AdminStatCard
                label={stat.label}
                value={stat.value}
                subtitle={stat.subtitle}
                icon={stat.icon}
              />
            </AdminMotionItem>
          ))}
        </AdminMotionSection>

        {chartData.length > 0 ? (
          <AdminMotionSection>
            <section className={`${glassTile} overflow-hidden p-5 sm:p-6`}>
              <div className={`relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${sectionDivider} pb-5`}>
                <div>
                  <AdminBadge label="Análise de desempenho" />
                  <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Curva de acerto</h2>
                </div>
                <p className="font-body text-xs font-semibold text-brand-secondary">
                  {chartData.length} sessões registradas
                </p>
              </div>
              <div className={`${innerPanelClass} relative z-10`}>
                <HistoryChart data={chartData} />
              </div>
            </section>
          </AdminMotionSection>
        ) : null}

        <AdminMotionSection>
          <section id="sessoes" className={`${glassTile} relative overflow-hidden scroll-mt-4`}>
            <div className={`relative z-10 px-4 py-5 sm:px-6 ${sectionDivider}`}>
              <AdminBadge label="Registro de atividades" />
              <h2 className="mt-4 font-heading text-2xl font-bold text-brand-dark">Sessões completas</h2>
            </div>

            <div className="relative z-10 overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className={tableHeadRow}>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-3 py-3">Pack</th>
                    <th className="px-3 py-3">Modo</th>
                    <th className="px-3 py-3 text-center">Certo</th>
                    <th className="px-3 py-3 text-center">Errado</th>
                    <th className="px-3 py-3 text-center">Precisão</th>
                    <th className="px-5 py-3 text-center">Sequência</th>
                  </tr>
                </thead>

                <tbody className={tableDivider}>
                  {typedSessions.length > 0 ? (
                    typedSessions.map((session) => {
                      const total = session.correct_answers + session.wrong_answers
                      const pct = total > 0 ? Math.round((session.correct_answers / total) * 100) : 0
                      const modeLabel =
                        modeLabelMap[session.assignments?.game_mode ?? ''] ??
                        session.assignments?.game_mode ??
                        '—'
                      const statusMeta = parseAssignmentStatus(session.assignments?.status)

                      return (
                        <Fragment key={session.id}>
                          <tr className={tableBodyRow}>
                            <td className="px-5 py-3">
                              <p className="font-heading font-bold text-brand-dark">
                                {formatAppDate(session.completed_at)}
                              </p>
                              <p className="mt-0.5 font-body text-xs text-brand-secondary">
                                {formatAppTime(session.completed_at)}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              <p className="font-heading font-bold text-brand-dark">
                                {session.assignments?.packs?.name ?? 'Revisão'}
                              </p>
                              {statusMeta.baseStatus === 'incomplete' ? (
                                <span className={`${neutralBadge} mt-2`}>Incompleta</span>
                              ) : null}
                            </td>
                            <td className="px-3 py-3">
                              <span className={neutralBadge}>{modeLabel}</span>
                            </td>
                            <td className="px-3 py-3 text-center font-bold text-brand-dark">
                              {session.correct_answers}
                            </td>
                            <td className="px-3 py-3 text-center font-semibold text-brand-secondary">
                              {session.wrong_answers}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span
                                className={`inline-flex rounded-lg border px-2.5 py-1 font-heading text-[10px] font-bold uppercase ${
                                  pct >= 80
                                    ? 'border-brand-dark bg-brand-accent text-brand-dark'
                                    : pct >= 50
                                      ? 'border-brand-dark bg-bg-primary text-brand-dark'
                                      : 'border-brand-dark bg-bg-card text-brand-secondary'
                                }`}
                              >
                                {pct}%
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span className={`${accentBadge} inline-flex items-center gap-1`}>
                                <Flame className="h-3 w-3" strokeWidth={3} />
                                {session.max_streak}
                              </span>
                            </td>
                          </tr>
                          {session.session_errors && session.session_errors.length > 0 ? (
                            <tr className="border-0">
                              <td colSpan={7} className="border-0 bg-bg-primary/60 p-0">
                                <SessionErrorsViewer errors={session.session_errors} />
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center">
                          <span className={iconClass}>
                            <BarChart3 className="h-5 w-5" />
                          </span>
                        </div>
                        <p className="mt-4 font-heading text-sm font-bold uppercase tracking-widest text-brand-secondary">
                          Sem registros
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </AdminMotionSection>
      </div>
    </div>
  )
}