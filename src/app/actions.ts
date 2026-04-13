'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import {
  buildAssignmentStatus,
  getAssignmentDeadline,
  parseAssignmentStatus,
} from '@/lib/assignmentStatus'
import { getReviewQueueForUser } from '@/lib/reviewQueue'
import { getAppDateString } from '@/lib/timezone'
import {
  buildScheduledReviewStatus,
  isScheduledReviewDue,
  parseScheduledReviewStatus,
} from '@/lib/reviewSchedules'
import { z } from 'zod'

// Shared secret used to authenticate server-to-edge-function calls.
// The Edge Function checks x-admin-secret and uses its own service role for DB ops.
function getAdminSecret() {
  const configuredSecret = process.env.ADMIN_SECRET?.trim()

  if (configuredSecret) return configuredSecret
  if (process.env.NODE_ENV !== 'production') return 'kivora-admin-2026'

  throw new Error('ADMIN_SECRET não configurado para operações administrativas em produção')
}

async function callAdminManageUser(
  payload: { action: 'create'; username: string; password: string } | { action: 'delete'; userId: string }
): Promise<ActionResult> {
  const res = await fetch(
    `${supabaseUrl}/functions/v1/admin-manage-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': getAdminSecret(),
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    }
  )

  const json = await res.json().catch(() => ({ error: 'Resposta inválida da função administrativa' }))

  if (!res.ok || json.error) {
    return { success: false, error: json.error || 'Falha na função administrativa' }
  }

  return { success: true }
}

// --- Security Helper ---
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Acesso negado: Requer privilégios de administrador')
  }

  return { supabase, user }
}

// --- Validation Schemas ---
const PackSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  level: z.enum(['easy', 'medium', 'hard']).optional(),
})

const CardSchema = z.object({
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  en: z.string().min(1, 'Inglês é obrigatório'),
  pt: z.string().min(1, 'Português é obrigatório'),
  order_index: z.number().int().default(0),
})

const AssignmentSchema = z.object({
  user_id: z.string().min(1, 'Membro é obrigatório'),
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  game_mode: z.enum(['multiple_choice', 'flashcard', 'typing', 'matching']),
  assigned_date: z.string().optional(),
  timed: z.enum(['on']).optional(),
  time_limit_minutes: z.number().int().positive().max(24 * 60).optional(),
})

const ScheduledReviewSchema = z.object({
  user_id: z.string().min(1, 'Membro é obrigatório'),
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  card_ids: z.array(z.string().min(1)).min(1, 'Selecione pelo menos um card'),
  cards_per_release: z.number().int().positive().max(100),
})

type ActionResult = {
  success: boolean
  error?: string
}

export async function loginAction(formData: FormData) {
  try {
    const supabase = await createClient()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
      return { error: 'Usuário e senha são obrigatórios' }
    }

    // Map usernames to emails
    const usernameMap: Record<string, string> = {
      'armando': 'armando@kivora.com',
      'daniel': 'daniel@kivora.com'
    }

    // If username is in the map, use the mapped email, otherwise use username as email or append a domain
    const email = usernameMap[username.toLowerCase()] || (username.includes('@') ? username : `${username}@kivora.com`);

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Login error:', error.message)
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'Erro ao obter dados do usuário' }
    }

    // Check user role
    // We don't need profile variable anymore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError.message)
    }

    revalidatePath('/', 'layout')

    // Always redirect to home after login
    return { success: true, redirectUrl: '/home' }
  } catch (err: unknown) {
    console.error('Unexpected error in loginAction:', err instanceof Error ? err.message : err)
    return { error: 'Erro inesperado no servidor: ' + (err instanceof Error ? err.message : 'Unknown') }
  }
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function submitGameResult(data: {
  packId: string
  assignmentId: string
  correct: number
  wrong: number
  streakMax: number
  status?: 'completed' | 'incomplete'
  errorLog?: { cardId: string; timestamp: string }[]
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id,user_id,status')
    .eq('id', data.assignmentId)
    .eq('user_id', user.id)
    .single()

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message || 'Tarefa não encontrada')
  }

  const timingMeta = parseAssignmentStatus(assignment.status)
  const deadline = getAssignmentDeadline(timingMeta)
  const completedWithinTime =
    data.status === 'completed' && deadline
      ? new Date().getTime() <= new Date(deadline).getTime()
      : null

  // Save game session
  const { data: sessionData, error: sessionError } = await supabase.from('game_sessions').insert({
    user_id: user.id,
    assignment_id: data.assignmentId,
    correct_answers: data.correct,
    wrong_answers: data.wrong,
    max_streak: data.streakMax,
  }).select('id').single()

  if (sessionError) throw new Error(sessionError.message)

  // Insert fine-grained error logs
  if (data.errorLog && data.errorLog.length > 0 && sessionData?.id) {
    const errorInserts = data.errorLog.map(err => ({
      session_id: sessionData.id,
      user_id: user.id,
      card_id: err.cardId,
      created_at: err.timestamp
    }))
    
    // Non-blocking fire and forget for errors isn't the best practice, wait for it
    const { error: logsError } = await supabase.from('session_errors').insert(errorInserts)
    if (logsError) console.error('Erro ao salvar tracking de falhas:', logsError)
  }

  // Mark assignment status
  const { error: updateError } = await supabase
    .from('assignments')
    .update({
      status: buildAssignmentStatus({
        ...timingMeta,
        baseStatus: data.status || 'completed',
        completedWithinTime,
      }),
    })
    .eq('id', data.assignmentId)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/home')
  revalidatePath('/history')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/members/${user.id}`)
}

// ===== ADMIN ACTIONS =====

export async function createPack(formData: FormData) {
  const { supabase } = await requireAdmin()

  const validated = PackSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    level: formData.get('difficulty'),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const payload = {
    name: validated.data.name,
    description: validated.data.description || null,
    level: validated.data.level || null,
  }
  let { error } = await supabase.from('packs').insert(payload)
  if (error?.message?.includes('packs_level_check')) {
    ;({ error } = await supabase.from('packs').insert({ ...payload, level: null }))
  }

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function updatePack(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const validated = PackSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    level: formData.get('difficulty'),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const payload = {
    name: validated.data.name,
    description: validated.data.description || null,
    level: validated.data.level || null,
  }
  let { error } = await supabase
    .from('packs')
    .update(payload)
    .eq('id', id)
  if (error?.message?.includes('packs_level_check')) {
    ;({ error } = await supabase.from('packs').update({ ...payload, level: null }).eq('id', id))
  }

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function deletePack(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('packs').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function createCard(formData: FormData) {
  const { supabase } = await requireAdmin()

  const validated = CardSchema.safeParse({
    pack_id: formData.get('pack_id'),
    en: formData.get('en'),
    pt: formData.get('pt'),
    order_index: parseInt(formData.get('order_index') as string) || 0,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase.from('cards').insert({
    pack_id: validated.data.pack_id,
    english_phrase: validated.data.en,
    portuguese_translation: validated.data.pt,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function deleteCard(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('cards').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function createAssignment(formData: FormData) {
  const { supabase } = await requireAdmin()

  const timed = formData.get('timed') === 'on'
  const rawTimeLimit = Number.parseInt((formData.get('time_limit_minutes') as string) || '', 10)

  const validated = AssignmentSchema.safeParse({
    user_id: formData.get('user_id'),
    pack_id: formData.get('pack_id'),
    game_mode: formData.get('game_mode'),
    assigned_date: formData.get('assigned_date'),
    timed: timed ? 'on' : undefined,
    time_limit_minutes: timed && Number.isFinite(rawTimeLimit) ? rawTimeLimit : undefined,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  if (timed && !validated.data.time_limit_minutes) {
    return { error: 'Informe o tempo limite em minutos' }
  }

  const { user_id, pack_id, game_mode, assigned_date, time_limit_minutes } = validated.data
  const finalDate = assigned_date || getAppDateString()
  const initialStatus = buildAssignmentStatus({
    baseStatus: 'pending',
    timeLimitMinutes: timed ? time_limit_minutes || null : null,
    timerStartedAt: null,
    completedWithinTime: null,
  })

  // If user_id is "all", get all members
  if (user_id === 'all') {
    const { data: members } = await supabase
      .from('profiles')
      .select('id')

    if (!members) return { error: 'Nenhum membro encontrado' }

    const assignments = members.map((m) => ({
      user_id: m.id,
      pack_id,
      game_mode,
      assigned_date: finalDate,
      status: initialStatus,
    }))

    const { error } = await supabase.from('assignments').upsert(assignments, { onConflict: 'user_id,assigned_date,pack_id,game_mode' })

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('assignments').upsert({
      user_id,
      pack_id,
      game_mode,
      assigned_date: finalDate,
      status: initialStatus,
    }, { onConflict: 'user_id,assigned_date,pack_id,game_mode' })

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/assign')
  revalidatePath('/home')
  return { success: true }
}

export async function materializeScheduledReviewReleasesForUser(userId: string) {
  const supabase = await createClient()
  const now = new Date()

  const { data: schedules, error } = await supabase
    .from('assignments')
    .select('id,user_id,pack_id,status,game_mode')
    .eq('user_id', userId)
    .eq('game_mode', 'scheduled_review')

  if (error || !schedules) {
    if (error) console.error('Erro ao buscar agendamentos de revisão:', error.message)
    return
  }

  for (const schedule of schedules) {
    const meta = parseScheduledReviewStatus(schedule.status)
    if (!meta || !isScheduledReviewDue(meta, now) || !schedule.user_id || !schedule.pack_id) continue

    const selectedCardIds = meta.cardIds.slice(0, meta.cardsPerRelease)
    if (selectedCardIds.length === 0) continue

    const { data: existingReviews, error: reviewsError } = await supabase
      .from('card_reviews')
      .select('card_id,review_date,interval_days,ease_factor,repetitions,total_reviews')
      .eq('user_id', schedule.user_id)
      .in('card_id', selectedCardIds)

    if (reviewsError) {
      console.error('Erro ao buscar reviews existentes:', reviewsError.message)
      continue
    }

    const existingMap = new Map((existingReviews || []).map((row) => [row.card_id, row]))
    const nowIso = now.toISOString()

    const payload = selectedCardIds.map((cardId) => {
      const existing = existingMap.get(cardId)
      return {
        user_id: schedule.user_id,
        pack_id: schedule.pack_id,
        card_id: cardId,
        review_date: existing?.review_date || nowIso,
        next_review_date: nowIso,
        interval_days: existing?.interval_days || 0,
        ease_factor: existing?.ease_factor || 2.5,
        repetitions: existing?.repetitions || 0,
        quality: 0,
        total_reviews: existing?.total_reviews || 0,
      }
    })

    const { error: upsertError } = await supabase
      .from('card_reviews')
      .upsert(payload, { onConflict: 'user_id,card_id' })

    if (upsertError) {
      console.error('Erro ao materializar revisão agendada:', upsertError.message)
      continue
    }

    await supabase
      .from('assignments')
      .update({
        status: buildScheduledReviewStatus({
          ...meta,
          lastReleaseKey: `${getAppDateString(now)}@${meta.time}`,
        }),
      })
      .eq('id', schedule.id)
  }
}

export async function createScheduledReviewRule(formData: FormData) {
  const { supabase } = await requireAdmin()

  const weekdays = formData
    .getAll('review_weekdays')
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value))

  const cardIds = formData
    .getAll('review_card_ids')
    .map((value) => String(value))
    .filter(Boolean)

  const rawCardsPerRelease = Number.parseInt(String(formData.get('cards_per_release') || ''), 10)

  const validated = ScheduledReviewSchema.safeParse({
    user_id: formData.get('review_user_id'),
    pack_id: formData.get('review_pack_id'),
    weekdays,
    time: formData.get('review_time'),
    card_ids: cardIds,
    cards_per_release: Number.isFinite(rawCardsPerRelease) ? rawCardsPerRelease : cardIds.length,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { user_id, pack_id, weekdays: validatedWeekdays, time, card_ids, cards_per_release } = validated.data

  const { error } = await supabase.from('assignments').insert({
    user_id,
    pack_id,
    game_mode: 'scheduled_review',
    assigned_date: getAppDateString(),
    status: buildScheduledReviewStatus({
      weekdays: validatedWeekdays,
      time,
      cardIds: card_ids,
      cardsPerRelease: Math.min(cards_per_release, card_ids.length),
      lastReleaseKey: null,
      active: true,
    }),
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  revalidatePath('/home')
  return { success: true }
}

export async function updateScheduledReviewRule(ruleId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const weekdays = formData
    .getAll('review_weekdays')
    .map((value) => Number.parseInt(String(value), 10))
    .filter((value) => Number.isInteger(value))

  const cardIds = formData
    .getAll('review_card_ids')
    .map((value) => String(value))
    .filter(Boolean)

  const rawCardsPerRelease = Number.parseInt(String(formData.get('cards_per_release') || ''), 10)

  const validated = ScheduledReviewSchema.safeParse({
    user_id: formData.get('review_user_id'),
    pack_id: formData.get('review_pack_id'),
    weekdays,
    time: formData.get('review_time'),
    card_ids: cardIds,
    cards_per_release: Number.isFinite(rawCardsPerRelease) ? rawCardsPerRelease : cardIds.length,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { data: existing, error: existingError } = await supabase
    .from('assignments')
    .select('status')
    .eq('id', ruleId)
    .eq('game_mode', 'scheduled_review')
    .single()

  if (existingError || !existing) {
    return { error: existingError?.message || 'Regra não encontrada' }
  }

  const previousMeta = parseScheduledReviewStatus(existing.status)
  const { user_id, pack_id, weekdays: validatedWeekdays, time, card_ids, cards_per_release } = validated.data

  const { error } = await supabase
    .from('assignments')
    .update({
      user_id,
      pack_id,
      status: buildScheduledReviewStatus({
        weekdays: validatedWeekdays,
        time,
        cardIds: card_ids,
        cardsPerRelease: Math.min(cards_per_release, card_ids.length),
        lastReleaseKey: previousMeta?.lastReleaseKey || null,
        active: previousMeta?.active ?? true,
      }),
    })
    .eq('id', ruleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  revalidatePath('/home')
  return { success: true }
}

export async function toggleScheduledReviewRule(ruleId: string) {
  const { supabase } = await requireAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('assignments')
    .select('status')
    .eq('id', ruleId)
    .eq('game_mode', 'scheduled_review')
    .single()

  if (existingError || !existing) {
    return { error: existingError?.message || 'Regra não encontrada' }
  }

  const meta = parseScheduledReviewStatus(existing.status)
  if (!meta) return { error: 'Regra inválida' }

  const { error } = await supabase
    .from('assignments')
    .update({
      status: buildScheduledReviewStatus({
        ...meta,
        active: !meta.active,
      }),
    })
    .eq('id', ruleId)

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  revalidatePath('/home')
  return { success: true, active: !meta.active }
}

export async function duplicateScheduledReviewRule(ruleId: string) {
  const { supabase } = await requireAdmin()

  const { data: existing, error: existingError } = await supabase
    .from('assignments')
    .select('user_id,pack_id,status')
    .eq('id', ruleId)
    .eq('game_mode', 'scheduled_review')
    .single()

  if (existingError || !existing) {
    return { error: existingError?.message || 'Regra não encontrada' }
  }

  const meta = parseScheduledReviewStatus(existing.status)
  if (!meta || !existing.user_id || !existing.pack_id) {
    return { error: 'Regra inválida' }
  }

  const { error } = await supabase.from('assignments').insert({
    user_id: existing.user_id,
    pack_id: existing.pack_id,
    game_mode: 'scheduled_review',
    assigned_date: getAppDateString(),
    status: buildScheduledReviewStatus({
      ...meta,
      lastReleaseKey: null,
    }),
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  revalidatePath('/home')
  return { success: true }
}

export async function startAssignmentTimer(assignmentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select('id,user_id,status')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .single()

  if (error || !assignment) {
    throw new Error(error?.message || 'Tarefa não encontrada')
  }

  const meta = parseAssignmentStatus(assignment.status)
  if (!meta.timeLimitMinutes) {
    return { startedAt: null, deadlineAt: null, timeLimitMinutes: null }
  }

  const startedAt = meta.timerStartedAt || new Date().toISOString()

  if (!meta.timerStartedAt) {
    const { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: buildAssignmentStatus({
          ...meta,
          timerStartedAt: startedAt,
        }),
      })
      .eq('id', assignmentId)

    if (updateError) throw new Error(updateError.message)
  }

  revalidatePath('/home')
  revalidatePath(`/play/${assignmentId}`)

  return {
    startedAt,
    deadlineAt: getAssignmentDeadline({
      timeLimitMinutes: meta.timeLimitMinutes,
      timerStartedAt: startedAt,
    }),
    timeLimitMinutes: meta.timeLimitMinutes,
  }
}

export async function deleteAssignment(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('assignments').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/assign')
  revalidatePath('/home')
  return { success: true }
}

export async function createMember(formData: FormData): Promise<ActionResult> {
  await requireAdmin()

  const username = (formData.get('username') as string || '').trim().toLowerCase()
  const password = (formData.get('password') as string || '').trim()

  if (!username || username.length < 3) return { success: false, error: 'Username deve ter pelo menos 3 caracteres' }
  if (!password || password.length < 6) return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' }
  if (!/^[a-z0-9_]+$/.test(username)) return { success: false, error: 'Username só pode conter letras, números e _' }

  const result = await callAdminManageUser({ action: 'create', username, password })
  if (result.error) return result

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteMember(userId: string): Promise<ActionResult> {
  await requireAdmin()

  const result = await callAdminManageUser({ action: 'delete', userId })
  if (result.error) return result

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ===== BULK IMPORT ACTIONS =====

export async function importPackWithCards(data: {
  name: string
  description?: string
  level?: 'easy' | 'medium' | 'hard'
  cards: { en: string; pt: string }[]
}) {
  const { supabase } = await requireAdmin()

  // Validate data
  if (!data.name || data.name.length < 3) {
    return { error: 'Nome do pack deve ter pelo menos 3 caracteres' }
  }

  if (!data.cards || data.cards.length === 0) {
    return { error: 'Adicione pelo menos um card' }
  }

  // Create pack
  const payload = {
    name: data.name,
    description: data.description || null,
    level: data.level || 'medium',
  }
  let { data: pack, error: packError } = await supabase
    .from('packs')
    .insert(payload)
    .select('id')
    .single()
  if (packError?.message?.includes('packs_level_check')) {
    ;({ data: pack, error: packError } = await supabase
      .from('packs')
      .insert({ ...payload, level: null })
      .select('id')
      .single())
  }

  if (packError || !pack) {
    return { error: packError?.message || 'Erro ao criar pack' }
  }

  // Create card objects
  const cardsToInsert = data.cards.map((card) => ({
    pack_id: pack.id,
    english_phrase: card.en,
    portuguese_translation: card.pt,
  }))

  // Create cards in chunks to avoid timeouts/limits
  const chunkSize = 50
  let insertedCount = 0
  
  for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
    const chunk = cardsToInsert.slice(i, i + chunkSize)
    const { error: chunkError } = await supabase
      .from('cards')
      .insert(chunk)

    if (chunkError) {
      console.error(`Error inserting chunk starting at ${i}:`, chunkError.message)
      await supabase.from('packs').delete().eq('id', pack.id)
      return { 
        error: `Erro ao importar alguns cards: ${chunkError.message}. ${insertedCount} cards foram importados.`,
        success: insertedCount > 0,
        packId: pack.id,
        cardCount: insertedCount
      }
    }
    insertedCount += chunk.length
  }

  revalidatePath('/admin/packs')
  return { success: true, packId: pack.id, cardCount: insertedCount }
}

export async function updateCard(id: string, data: { en?: string; pt?: string }) {
  const { supabase } = await requireAdmin()

  const updateData: Record<string, string> = {}
  if (data.en) updateData.english_phrase = data.en
  if (data.pt) updateData.portuguese_translation = data.pt

  const { error } = await supabase
    .from('cards')
    .update(updateData)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function reorderCards(packId: string, cardIds: string[]) {
  const { supabase } = await requireAdmin()

  // Update order_index for each card
  const updates = cardIds.map((id, index) =>
    supabase
      .from('cards')
      .update({ order_index: index })
      .eq('id', id)
  )

  await Promise.all(updates)

  revalidatePath('/admin/packs')
  return { success: true }
}

// ===== SPACED REPETITION ACTIONS =====

export async function submitCardReview(data: {
  cardId: string
  packId: string
  quality: number
  previousInterval?: number
  previousEaseFactor?: number
  previousRepetitions?: number
  previousTotalReviews?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Import the SM-2 algorithm function
  const { calculateNextReview, getInitialReview } = await import('@/lib/spacedRepetition')

  // Calculate next review based on quality
  let reviewResult
  if (data.previousInterval === undefined) {
    // First review
    reviewResult = getInitialReview()
    reviewResult.repetitions = data.quality >= 3 ? 1 : 0
  } else {
    reviewResult = calculateNextReview(
      data.quality,
      data.previousInterval,
      data.previousEaseFactor ?? 2.5,
      data.previousRepetitions ?? 0
    )
  }

  // Upsert the review record
  const { error } = await supabase
    .from('card_reviews')
    .upsert({
      user_id: user.id,
      card_id: data.cardId,
      pack_id: data.packId,
      review_date: new Date().toISOString(),
      next_review_date: reviewResult.nextReviewDate.toISOString(),
      interval_days: reviewResult.intervalDays,
      ease_factor: reviewResult.easeFactor,
      repetitions: reviewResult.repetitions,
      quality: data.quality,
      total_reviews: (data.previousTotalReviews || 0) + 1,
    }, {
      onConflict: 'user_id,card_id'
    })

  if (error) throw new Error(error.message)

  revalidatePath('/home')
  revalidatePath('/review')
  return { success: true, reviewResult }
}

export async function getDueCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { dueCards: [], totalDue: 0, newCardsLimit: 0 }

  try {
    await materializeScheduledReviewReleasesForUser(user.id)
    const queue = await getReviewQueueForUser(
      supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
      user.id
    )
    return {
      dueCards: queue.dueCards,
      totalDue: queue.totalDue,
      newCardsLimit: queue.newCardsLimit,
    }
  } catch (error) {
    console.error('Error fetching due cards:', error)
    return { dueCards: [], totalDue: 0, newCardsLimit: 0 }
  }
}

export async function getReviewStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  await materializeScheduledReviewReleasesForUser(user.id)
  return getReviewQueueForUser(
    supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
    user.id
  )
}

export async function addCardsToExistingPack(data: {
  packId: string
  cards: { en: string; pt: string }[]
}) {
  const { supabase } = await requireAdmin()

  // Validate data
  if (!data.packId) {
    return { error: 'Pack ID é obrigatório' }
  }

  if (!data.cards || data.cards.length === 0) {
    return { error: 'Adicione pelo menos um card' }
  }

  // Check if pack exists
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .select('id, name')
    .eq('id', data.packId)
    .single()

  if (packError || !pack) {
    return { error: packError?.message || 'Pack não encontrado' }
  }

  // Create card objects
  const cardsToInsert = data.cards.map((card) => ({
    pack_id: data.packId,
    english_phrase: card.en,
    portuguese_translation: card.pt,
  }))

  // Create cards in chunks to avoid timeouts/limits
  const chunkSize = 50
  let insertedCount = 0

  for (let i = 0; i < cardsToInsert.length; i += chunkSize) {
    const chunk = cardsToInsert.slice(i, i + chunkSize)
    const { error: chunkError } = await supabase
      .from('cards')
      .insert(chunk)

    if (chunkError) {
      console.error(`Error inserting chunk starting at ${i}:`, chunkError.message)
      return {
        error: `Erro ao importar alguns cards: ${chunkError.message}. ${insertedCount} cards foram importados.`,
        success: insertedCount > 0,
        packId: data.packId,
        cardCount: insertedCount
      }
    }
    insertedCount += chunk.length
  }

  revalidatePath('/admin/packs')
  return { success: true, packId: data.packId, cardCount: insertedCount }
}
