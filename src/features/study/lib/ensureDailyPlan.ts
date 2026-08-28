import type { SupabaseClient } from '@supabase/supabase-js'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getLevelGate, type LevelGate } from '@/features/learning/lib/levelGate'
import type { LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { getAppDateString, shiftAppDate } from '@/lib/timezone'
import {
  buildDailyPlan,
  getDailyPlanSize,
  type PlanCandidatePack,
  type PlannedActivity,
} from './dailyPlan'

/**
 * Garante que o aluno tenha um plano para hoje, montado pelo nível dele.
 *
 * Chamado de dois lugares de propósito: o cron monta o plano de todo mundo de
 * madrugada, e /home monta sob demanda para quem acabou de criar a conta ou
 * entrou antes do cron rodar. Idempotente pela checagem de plano existente, de
 * modo que os dois caminhos podem correr no mesmo dia sem duplicar nada.
 */

/** Janela usada para medir constância e para o cooldown de packs. */
const HISTORY_WINDOW_DAYS = 7
const COOLDOWN_WINDOW_DAYS = 30

export type EnsureDailyPlanResult = {
  created: boolean
  reason: 'already-planned' | 'empty-catalog' | 'planned'
  level: LearnerCefrLevel
  /**
   * A regra de nível já resolvida.
   *
   * Devolvida porque esta função sempre carrega o perfil CEFR para planejar, e quem a chama
   * costuma precisar do mesmo gate logo em seguida — na /home, para contar quanto material ainda
   * existe no nível do aluno. Sem isto seria uma segunda leitura do perfil no mesmo request.
   */
  gate: LevelGate
  activities: PlannedActivity[]
}

type AssignmentHistoryRow = {
  pack_id: string
  status: string
  assigned_date: string
  assigned_by: string
}

function summarizeHistory(rows: AssignmentHistoryRow[], today: string) {
  const windowStart = shiftAppDate(today, -HISTORY_WINDOW_DAYS)
  const recent = rows.filter((row) => row.assigned_date >= windowStart && row.assigned_date < today)

  const completedDays = new Set<string>()
  let completed = 0

  for (const row of recent) {
    if (isAssignmentCompleted(row.status)) {
      completed += 1
      completedDays.add(row.assigned_date)
    }
  }

  return {
    activeDaysLast7: completedDays.size,
    completionRateLast7: recent.length > 0 ? completed / recent.length : 0,
  }
}

function lastAssignedByPack(rows: AssignmentHistoryRow[]): Map<string, string> {
  const latest = new Map<string, string>()

  for (const row of rows) {
    const current = latest.get(row.pack_id)
    if (!current || row.assigned_date > current) {
      latest.set(row.pack_id, row.assigned_date)
    }
  }

  return latest
}

export async function ensureDailyPlan(
  supabase: SupabaseClient,
  userId: string,
  options?: { metadata?: { english_level?: string; english_level_name?: string; english_level_source?: string } }
): Promise<EnsureDailyPlanResult> {
  const today = getAppDateString()
  const profile = await getUserCefrProfile(supabase, userId, options?.metadata)
  const gate = getLevelGate(profile)

  const { data: plannedToday } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('assigned_by', 'auto')
    .eq('assigned_date', today)
    .limit(1)

  if (plannedToday && plannedToday.length > 0) {
    return { created: false, reason: 'already-planned', level: gate.current, gate, activities: [] }
  }

  const { data: catalog } = await supabase
    .from('packs')
    .select('id, level')
    .or('is_public.eq.true,is_public.is.null')

  const { data: history } = await supabase
    .from('assignments')
    .select('pack_id, status, assigned_date, assigned_by')
    .eq('user_id', userId)
    .gte('assigned_date', shiftAppDate(today, -COOLDOWN_WINDOW_DAYS))

  const historyRows = (history || []) as AssignmentHistoryRow[]
  const lastAssigned = lastAssignedByPack(historyRows)

  /**
   * Packs que o aluno já recebeu hoje por outra via (o admin, tipicamente).
   *
   * `assignments` tem UNIQUE (user_id, assigned_date, pack_id, game_mode), e o
   * plano entra num único INSERT em lote: uma colisão derrubaria o dia inteiro,
   * não só a linha repetida. Excluir aqui é mais barato que inserir uma a uma.
   */
  const assignedToday = new Set(
    historyRows.filter((row) => row.assigned_date === today).map((row) => row.pack_id)
  )

  const candidates: PlanCandidatePack[] = (catalog || [])
    .filter((pack) => !assignedToday.has(pack.id as string))
    .map((pack) => ({
      id: pack.id as string,
      level: (pack.level as string | null) ?? null,
      lastAssignedDate: lastAssigned.get(pack.id as string) ?? null,
    }))

  if (candidates.length === 0) {
    return { created: false, reason: 'empty-catalog', level: gate.current, gate, activities: [] }
  }

  const activities = buildDailyPlan({
    gate,
    catalog: candidates,
    today,
    size: getDailyPlanSize(summarizeHistory(historyRows, today)),
  })

  if (activities.length === 0) {
    // Catálogo sem nada no nível do aluno. Não é erro do aluno, e inventar
    // conteúdo acima do nível é exatamente o que esta mudança existe para evitar.
    return { created: false, reason: 'empty-catalog', level: gate.current, gate, activities: [] }
  }

  /**
   * Descarta pack sem card antes de virar atividade.
   *
   * `packs` e `cards` são tabelas separadas, então nada impede um pack existir vazio — é o estado
   * natural de um pack recém-criado pelo admin, entre criar a coleção e importar as frases. Sem
   * esta checagem o plano do dia agendaria uma sessão que abre sem nada para estudar, e o aluno
   * levaria a culpa por um pack pela metade.
   *
   * A consulta é barata porque roda depois do plano montado: no máximo `size` ids (2 a 5), não o
   * catálogo inteiro.
   */
  const plannedPackIds = activities.map((activity) => activity.packId)
  const { data: cardsDosPacks } = await supabase
    .from('cards')
    .select('pack_id')
    .in('pack_id', plannedPackIds)

  const packsComCard = new Set((cardsDosPacks || []).map((row) => row.pack_id as string))
  const activitiesComConteudo = activities.filter((activity) => packsComCard.has(activity.packId))

  if (activitiesComConteudo.length === 0) {
    return { created: false, reason: 'empty-catalog', level: gate.current, gate, activities: [] }
  }

  const { error } = await supabase.from('assignments').insert(
    activitiesComConteudo.map((activity) => ({
      user_id: userId,
      pack_id: activity.packId,
      game_mode: activity.gameMode,
      status: 'pending',
      assigned_date: today,
      assigned_by: 'auto',
      reward_badge_id: null,
    }))
  )

  if (error) {
    console.error('Falha ao gravar o plano do dia', { userId, error })
    return { created: false, reason: 'empty-catalog', level: gate.current, gate, activities: [] }
  }

  return { created: true, reason: 'planned', level: gate.current, gate, activities: activitiesComConteudo }
}

/**
 * Versão para quem só tem o id do aluno — /home, tipicamente.
 *
 * Cria o client admin por conta própria porque o INSERT usa
 * `assigned_by = 'auto'`, e não existe policy de INSERT para 'auto': um membro
 * não pode forjar um plano do motor. Com o client do usuário o insert seria
 * recusado pela RLS, então este caminho precisa do service role.
 *
 * Sem `SUPABASE_SERVICE_ROLE_KEY` a função apenas não planeja, em vez de
 * derrubar a home: o cron ainda cobre o aluno na próxima madrugada.
 */
export async function ensureDailyPlanForUser(
  userId: string,
  metadata?: { english_level?: string; english_level_name?: string; english_level_source?: string }
): Promise<EnsureDailyPlanResult | null> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return null

  return ensureDailyPlan(adminSupabase as unknown as SupabaseClient, userId, { metadata })
}

/**
 * Concede um pack do catálogo ao aluno em nome do sistema.
 *
 * O caso é o pack inicial do onboarding: quem escolheu foi o teste de nivelamento, a partir de
 * uma lista curta que o próprio produto montou — não é o aluno caçando no catálogo. A concessão
 * é do sistema, então a linha nasce 'auto', como as do plano diário.
 *
 * O chamador precisa ter validado que o pack pertence à lista curada. Esta função não repete
 * essa checagem porque não conhece o critério de curadoria de quem chama; ela só empresta o
 * service role, que é o que falta para escrever uma atribuição 'auto'.
 */
export async function grantCatalogPackToUser(
  userId: string,
  packId: string,
  gameMode: string
): Promise<{ success: true; assignmentId: string } | { success: false; error: string }> {
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return { success: false, error: 'Não foi possível preparar sua rotina agora.' }
  }

  const today = getAppDateString()

  const { data: existing } = await adminSupabase
    .from('assignments')
    .select('id')
    .eq('user_id', userId)
    .eq('pack_id', packId)
    .eq('game_mode', gameMode)
    .eq('assigned_date', today)
    .maybeSingle()

  if (existing) {
    return { success: true, assignmentId: existing.id as string }
  }

  const { data, error } = await adminSupabase
    .from('assignments')
    .insert({
      user_id: userId,
      pack_id: packId,
      game_mode: gameMode,
      status: 'pending',
      assigned_date: today,
      assigned_by: 'auto',
      reward_badge_id: null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'Não foi possível preparar sua rotina.' }
  }

  return { success: true, assignmentId: data.id as string }
}
