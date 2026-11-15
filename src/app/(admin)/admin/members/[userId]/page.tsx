import { notFound, redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatAppDateTime, getAppDateString, getAppDayStartUtcIso, shiftAppDate } from '@/lib/timezone'
import AdminSectionHeader from '@/features/admin/components/AdminSectionHeader'
import { AdminMotionSection } from '@/features/admin/components/AdminMotion'
import { pageRoot, pageInner, glassTile } from '@/features/admin/lib/adminUi'
import WorkspaceSections from '@/components/ui/WorkspaceSections'
import { WorkspaceList } from '@/components/ui/WorkspacePagination'
import StudyQualityHeatmap from '@/features/study/components/StudyQualityHeatmap'
import { loadStudyEvidence } from '@/features/study/lib/studyEvidence'
import { aggregateStudyDays, recentSkillSignals, SKILL_LABELS } from '@/features/study/lib/studyQuality'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import SessionErrorsViewer, { type SessionErrorLog } from '@/features/game/components/SessionErrorsViewer'
import DeleteMemberButton from '../../dashboard/DeleteMemberButton'
import LevelSelector from './LevelSelector'

export const dynamic = 'force-dynamic'
export const revalidate = 0
const MODES: Record<string, string> = { multiple_choice:'Leitura', typing:'Escrita', matching:'Vocabulário', listening:'Escuta', speaking:'Fala', flashcard:'Flashcard' }
type Session = { id:string; completed_at:string; correct_answers:number; wrong_answers:number; max_streak:number; assignments:{ game_mode:string; packs:{name:string}|null }|null; session_errors:SessionErrorLog[] }
export default async function MemberHistoryPage({ params }: { params:Promise<{userId:string}> }) {
  const {userId} = await params
  const supabase = await createClient()
  const {data:{user}} = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const {data:viewer} = await supabase.from('profiles').select('role').eq('id',user.id).single()
  if (viewer?.role !== 'admin') redirect('/home')
  if (!/^[0-9a-f-]{36}$/i.test(userId)) notFound()
  const db = createAdminClient()
  if (!db) throw new Error('A consulta administrativa está temporariamente indisponível.')
  const {data:member,error} = await db.from('profiles').select('id,username,email,role,created_at,last_seen_at').eq('id',userId).maybeSingle()
  if (error) throw new Error('Não foi possível carregar o membro.')
  if (!member) notFound()
  const today = getAppDateString(), since = shiftAppDate(today,-364)
  const [auth,profile,evidence,sessionsResult,jobResult] = await Promise.all([
    db.auth.admin.getUserById(userId),
    getUserCefrProfile(db as unknown as SupabaseClient,userId),
    loadStudyEvidence(db as unknown as SupabaseClient,userId,getAppDayStartUtcIso(since)),
    db.from('game_sessions').select('id,completed_at,correct_answers,wrong_answers,max_streak,assignments(game_mode,packs(name)),session_errors(*,cards(english_phrase,portuguese_translation,audio_url))').eq('user_id',userId).order('completed_at',{ascending:false}).limit(100),
    (db as unknown as SupabaseClient).from('personal_learning_jobs').select('plan_date,status,plan').eq('user_id',userId).order('plan_date',{ascending:false}).limit(1).maybeSingle(),
  ])
  if (sessionsResult.error || jobResult.error) throw new Error('Não foi possível carregar o acompanhamento do membro.')
  const sessions = (sessionsResult.data ?? []) as unknown as Session[]
  const signals = recentSkillSignals(evidence,today)
  const job = jobResult.data as {plan_date:string;status:string;plan:{reasons?:string[];assignmentModes?:string[]}|null}|null
  const username = member.username || 'Membro'
  const [local,domain] = (member.email || '').split('@')
  const maskedEmail = domain ? `${local.slice(0,2)}***@${domain}` : 'E-mail indisponível'
  async function updateLevelAction(data:FormData) {
    'use server'
    const {updateMemberLevel} = await import('@/app/actions')
    const code=String(data.get('level') ?? '')
    const names:Record<string,string>={A1:'Iniciante',A2:'Básico',B1:'Intermediário',B2:'Intermediário superior',C1:'Avançado',C2:'Proficiente'}
    return updateMemberLevel(userId,code,names[code] ?? '')
  }
  return <div className={pageRoot}><div className={pageInner}>
    <AdminMotionSection><AdminSectionHeader breadcrumb={[{label:'Admin',href:'/admin/dashboard'},{label:'Membros',href:'/admin/members'},{label:username}]} accentLabel={profile.level ?? 'Em avaliação'} title={username} description="Acompanhe o estudo, a rotina automática e a conta em um só lugar." /></AdminMotionSection>
    <WorkspaceSections label="Acompanhamento do membro" tabs={[
      {id:'quality',label:'Qualidade',description:'Resultados por dia',icon:'calendar'},
      {id:'routine',label:'Rotina',description:'Foco e evolução',icon:'target'},
      {id:'sessions',label:'Sessões',description:'Histórico de partidas',icon:'list',anchors:['sessoes']},
      {id:'account',label:'Conta',description:'Dados e gestão',icon:'settings'},
    ]}>
      <AdminMotionSection><StudyQualityHeatmap days={aggregateStudyDays(evidence)} today={today} since={since} /></AdminMotionSection>
      <AdminMotionSection><section className={`${glassTile} p-5 sm:p-6`}><h2 className="text-3xl font-semibold tracking-tight">Rotina adaptativa</h2><p className="mt-3 text-sm text-brand-secondary">As respostas dos últimos 14 dias orientam o foco. A última semana tem mais peso. Com pelo menos 6 respostas ponderadas e acerto abaixo de 80%, a habilidade recebe prioridade; as demais continuam na rotação. Autoavaliações não definem dificuldades.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">{signals.length ? signals.map(s => <div key={s.skill} className="member-session-card"><h3>{SKILL_LABELS[s.skill]}</h3><p>{Math.round(s.correct*100/s.total)}% de acerto ponderado</p><p className="text-sm text-brand-secondary">{s.total.toLocaleString('pt-BR')} respostas ponderadas · {s.total < 6 ? 'Amostra inicial' : s.correct/s.total < .8 ? 'Prioridade de reforço' : 'Manutenção'}</p></div>) : <p>Ainda não há respostas suficientes para personalizar por habilidade. A rotina começa equilibrada.</p>}</div>
        <div className="mt-6 border-t border-brand-border pt-5"><h3 className="text-xl font-semibold">Último planejamento</h3>{job ? <><p className="mt-2 text-sm">{formatAppDateTime(`${job.plan_date}T12:00:00Z`,{day:'2-digit',month:'long',year:'numeric'})} · {({ready:'Pronto',queued:'Na fila',generating:'Preparando conteúdo',audio:'Preparando áudio',failed:'Nova tentativa pendente',deferred:'Consolidar revisões'})[job.status] || 'Em preparação'}</p><ul className="mt-3 space-y-2 text-sm text-brand-secondary">{job.plan?.reasons?.map(reason => <li key={reason}>{reason}</li>)}</ul>{job.plan?.assignmentModes && <p className="mt-3 text-sm">Atividades: {job.plan.assignmentModes.map(m => MODES[m] ?? m).join(' · ')}.</p>}</> : <p className="mt-2 text-sm text-brand-secondary">O planejamento é preparado automaticamente ao abrir o espaço de estudo e pela rotina diária. O catálogo é usado quando a geração personalizada não está disponível.</p>}</div>
      </section></AdminMotionSection>
      <AdminMotionSection><section id="sessoes"><h2 className="text-3xl font-semibold tracking-tight">Sessões de estudo</h2><p className="my-4 text-sm text-brand-secondary">Até 100 partidas mais recentes. O heatmap consulta todos os registros da janela de 365 dias, incluindo revisões.</p><WorkspaceList pageSize={5}>{sessions.map(s => <article key={s.id} className="member-session-card"><p className="text-sm text-brand-secondary">{formatAppDateTime(s.completed_at)}</p><h3>{s.assignments?.packs?.name ?? 'Revisão'}</h3><p>{MODES[s.assignments?.game_mode ?? ''] ?? 'Prática'}</p><dl><div><dt>Acertos</dt><dd>{s.correct_answers}</dd></div><div><dt>Erros</dt><dd>{s.wrong_answers}</dd></div><div><dt>Precisão</dt><dd>{s.correct_answers+s.wrong_answers ? `${Math.round(s.correct_answers*100/(s.correct_answers+s.wrong_answers))}%` : '—'}</dd></div><div><dt>Melhor sequência</dt><dd>{s.max_streak}</dd></div></dl>{s.session_errors?.length > 0 && <SessionErrorsViewer errors={s.session_errors} />}</article>)}</WorkspaceList>{!sessions.length && <p>Nenhuma partida registrada.</p>}</section></AdminMotionSection>
      <AdminMotionSection><section className={`${glassTile} p-5 sm:p-6`}><h2 className="text-3xl font-semibold tracking-tight">Conta e acesso</h2><dl className="my-5 grid gap-4 break-words sm:grid-cols-2"><div><dt className="text-sm text-brand-secondary">E-mail protegido</dt><dd className="break-all">{maskedEmail}</dd></div><div><dt className="text-sm text-brand-secondary">Perfil</dt><dd>{member.role === 'admin' ? 'Administrador' : 'Membro'}</dd></div><div><dt className="text-sm text-brand-secondary">Último login</dt><dd>{auth.error ? 'Consulta indisponível' : auth.data.user?.last_sign_in_at ? formatAppDateTime(auth.data.user.last_sign_in_at) : 'Sem registro'}</dd></div><div><dt className="text-sm text-brand-secondary">Última atividade</dt><dd>{member.last_seen_at ? formatAppDateTime(member.last_seen_at) : 'Sem registro'}</dd></div></dl><LevelSelector englishLevel={profile.level ?? 'A1'} action={updateLevelAction} />{member.role !== 'admin' && <div className="mt-6 border-t border-brand-border pt-5"><h3 className="mb-3 text-xl font-semibold">Remover conta</h3><DeleteMemberButton userId={userId} username={username} /></div>}</section></AdminMotionSection>
    </WorkspaceSections>
  </div></div>
}
