'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/config'
import {
  buildAssignmentStatus,
  getAssignmentDeadline,
  parseAssignmentStatus,
} from '@/features/game/lib/assignmentStatus'
import {
  DEFAULT_REVIEW_SESSION_CARD_LIMIT,
  getReviewQueueForUser,
} from '@/features/review/lib/reviewQueue'
import { getAppDateString } from '@/lib/timezone'
import {
  buildScheduledReviewStatus,
  isScheduledReviewDue,
  parseScheduledReviewStatus,
} from '@/features/review/lib/reviewSchedules'
import {
  mergeAcceptedTranslations,
  parseAcceptedTranslationsInput,
  splitPrimaryAndAcceptedTranslations,
} from '@/features/cards/lib/cardTranslations'
import { analyzeImportCards } from '@/features/cards/lib/importCards'
import { AI_MODELS, createGroqChatCompletion } from '@/features/ai/lib/groq'
import { z } from 'zod'

import { resolveLoginEmail } from '@/features/auth/lib/resolveLoginEmail'
import {
  getAdminSecret,
  getStandardAuthError,
  getClientIp,
  hashSecurityValue,
  isRateLimited,
  recordSecurityEvent,
} from '@/features/security/lib/security'
import { isAllowedCloudinaryDeliveryUrl } from '@/lib/cloudinaryUpload'

// Shared secret used to authenticate server-to-edge-function calls.
// The Edge Function checks x-admin-secret and uses its own service role for DB ops.
function getInternalAdminSecret() {
  return getAdminSecret()
}

function isAssignmentsStatusCheckError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string' &&
    (error as { message: string }).message.includes('assignments_status_check')
  )
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
        'x-admin-secret': getInternalAdminSecret(),
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
  accepted_translations: z.string().optional(),
  order_index: z.number().int().default(0),
})

const AssignmentSchema = z.object({
  user_id: z.string().min(1, 'Membro é obrigatório'),
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  game_mode: z.enum(['multiple_choice', 'flashcard', 'typing', 'matching', 'listening', 'speaking']),
  assigned_date: z.string().optional(),
  timed: z.enum(['on']).optional(),
  time_limit_minutes: z.number().int().positive().max(24 * 60).optional(),
  reward_badge_id: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
})

const MemberGroupSchema = z.object({
  name: z.string().min(2, 'Nome do grupo deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  member_ids: z.array(z.string().uuid('Membro inválido')).min(1, 'Selecione pelo menos um membro'),
})

const AssignmentTemplateSchema = z.object({
  name: z.string().min(2, 'Nome do template deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  game_mode: z.enum(['multiple_choice', 'flashcard', 'typing', 'matching', 'listening', 'speaking']),
  time_limit_minutes: z.number().int().positive().max(24 * 60).nullable().optional(),
  reward_badge_id: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
})

const ScheduledReviewSchema = z.object({
  user_id: z.union([z.string().min(1, 'Membro é obrigatório'), z.literal('all')]),
  pack_id: z.string().min(1, 'Pack é obrigatório'),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Selecione pelo menos um dia'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  card_ids: z.array(z.string().min(1)).min(1, 'Selecione pelo menos um card'),
  cards_per_release: z
    .number()
    .int()
    .positive()
    .max(DEFAULT_REVIEW_SESSION_CARD_LIMIT, `Use no máximo ${DEFAULT_REVIEW_SESSION_CARD_LIMIT} cards por sessão`),
  expires_on: z.string().optional(),
})

const GameResultSchema = z.object({
  packId: z.string().uuid('Pack inválido'),
  assignmentId: z.string().uuid('Tarefa inválida'),
  correct: z.number().int().min(0).max(500),
  wrong: z.number().int().min(0).max(500),
  streakMax: z.number().int().min(0).max(500),
  status: z.enum(['completed', 'incomplete']).optional(),
  errorLog: z
    .array(z.object({
      cardId: z.string().uuid('Card inválido'),
      timestamp: z.string().datetime('Data inválida'),
    }))
    .max(500)
    .optional(),
  latencyLog: z
    .array(z.object({
      cardId: z.string().uuid('Card inválido'),
      latencyMs: z.number().int().min(0).max(10 * 60 * 1000),
    }))
    .max(500)
    .optional(),
})

const ArenaGhostDuelSchema = z.object({
  opponentId: z.string().uuid('Oponente inválido'),
  packId: z.string().uuid('Pack inválido'),
  gameType: z.enum(['multiple_choice', 'matching', 'flashcard', 'typing', 'listening', 'speaking']),
})

type ActionResult = {
  success: boolean
  error?: string
}

export async function loginAction(prevState: unknown, formData: FormData) {
  try {
    const ip = await getClientIp()
    
    // Rate limit login attempts: 5 attempts per 15 minutes
    const limited = await isRateLimited('login', ip, 5, 900)
    if (limited) {
      return { error: 'Muitas tentativas de login. Por favor, aguarde alguns minutos.' }
    }

    const supabase = await createClient()

    const username = (formData.get('username') as string)?.trim()?.toLowerCase()
    const password = formData.get('password') as string

    if (!username || !password) {
      return { error: 'Usuário e senha são obrigatórios' }
    }

    const email = await resolveLoginEmail(username)
    if (!email) {
      return { error: 'Usuário e senha são obrigatórios' }
    }

    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Login error:', error.message)
      return { error: getStandardAuthError() }
    }

    if (!data.user) {
      return { error: 'Erro ao obter dados do usuário' }
    }

    // Check user role
    const { error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError.message)
    }

    revalidatePath('/', 'layout')

    // Check if user has MFA enabled
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    
    if (factorsError) {
      console.error('MFA factors error:', factorsError.message)
    }

    const isMFAEnabled = factors && factors.all.length > 0 && factors.all.some((f: { status: string }) => f.status === 'verified')

    if (isMFAEnabled) {
      // If MFA is enabled, we are at aal1. Need to redirect to challenge page for aal2.
      return { success: true, redirectUrl: '/login/mfa' }
    }

    // Always redirect to home after login if no MFA
    return { success: true, redirectUrl: '/home' }
  } catch (err: unknown) {
    console.error('Unexpected error in loginAction:', err instanceof Error ? err.message : err)
    return { error: 'Erro inesperado no servidor.' }
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
  latencyLog?: { cardId: string; latencyMs: number }[]
}) {
  const validated = GameResultSchema.safeParse(data)
  if (!validated.success) {
    throw new Error('Resultado inválido')
  }

  const result = validated.data
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('id,user_id,pack_id,status,game_mode,reward_badge_id')
    .eq('id', result.assignmentId)
    .eq('user_id', user.id)
    .single()

  if (assignmentError || !assignment) {
    throw new Error(assignmentError?.message || 'Tarefa não encontrada')
  }

  if (assignment.pack_id !== result.packId) {
    throw new Error('Tarefa inválida para este pack')
  }

  const { count: packCardCount } = await supabase
    .from('cards')
    .select('id', { count: 'exact', head: true })
    .eq('pack_id', assignment.pack_id)

  const answerLimit = Math.max(1, Math.min(packCardCount ?? 500, 500))
  const correct = Math.min(result.correct, answerLimit)
  const wrong = Math.min(result.wrong, answerLimit)
  const streakMax = Math.min(result.streakMax, answerLimit)
  const errorLog = result.errorLog ?? []
  const latencyLog = result.latencyLog ?? []

  const timingMeta = parseAssignmentStatus(assignment.status)
  const deadline = getAssignmentDeadline(timingMeta)
  const completedWithinTime =
    result.status === 'completed' && deadline
      ? new Date().getTime() <= new Date(deadline).getTime()
      : null

  // Save game session
  const { data: sessionData, error: sessionError } = await supabase.from('game_sessions').insert({
    user_id: user.id,
    assignment_id: result.assignmentId,
    correct_answers: correct,
    wrong_answers: wrong,
    max_streak: streakMax,
  }).select('id').single()

  if (sessionError) throw new Error(sessionError.message)

  // Insert fine-grained error logs
  if (errorLog.length > 0 && sessionData?.id) {
    const errorInserts = errorLog.map(err => ({
      session_id: sessionData.id,
      user_id: user.id,
      card_id: err.cardId,
      created_at: err.timestamp
    }))

    // Non-blocking fire and forget for errors isn't the best practice, wait for it
    const { error: logsError } = await supabase.from('session_errors').insert(errorInserts)
    if (logsError) console.error('Erro ao salvar tracking de falhas:', logsError)
  }

  // --- SRS integration: prioritize cards missed in this lesson ---
  // Deduplicate error log by card ID so each card is counted once.
  if (errorLog.length > 0) {
    const uniqueErrorCardIds = [...new Set(errorLog.map((e) => e.cardId))]

    // Fetch cards to get their pack_id (needed for card_reviews insert)
    const { data: errorCards } = await supabase
      .from('cards')
      .select('id,pack_id')
      .in('id', uniqueErrorCardIds)
      .eq('pack_id', assignment.pack_id)

    if (errorCards && errorCards.length > 0) {
      // Load existing SRS rows for these cards (if any)
      const { data: existingReviews } = await supabase
        .from('card_reviews')
        .select('card_id,interval_days,ease_factor,repetitions,total_reviews,next_review_date')
        .eq('user_id', user.id)
        .in('card_id', uniqueErrorCardIds)

      type CardReviewRow = { card_id: string; interval_days: number; ease_factor: number; repetitions: number; total_reviews: number; next_review_date: string; review_date: string }
      const existingMap = new Map(
        (existingReviews as CardReviewRow[] || []).map((r) => [r.card_id, r])
      )
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { calculateNextReview } = await import('@/features/review/lib/spacedRepetition')

      const srsUpserts = errorCards
        .flatMap((card: { id: string; pack_id: string }) => {
          const existing = existingMap.get(card.id)

          // If already scheduled for today or tomorrow, don't override — let SRS handle it.
          if (existing) {
            const scheduledFor = new Date(existing.next_review_date)
            if (scheduledFor <= tomorrow) return []
          }

          // Apply quality=1 (wrong answer) to SM-2 to get punishment interval
          const previousInterval = existing?.interval_days ?? 0
          const previousEaseFactor = existing?.ease_factor ?? 2.5
          const previousRepetitions = existing?.repetitions ?? 0
          const previousTotalReviews = existing?.total_reviews ?? 0

          const latencyMs = latencyLog.find(l => l.cardId === card.id)?.latencyMs

          const reviewResult = previousInterval === 0
            // Brand-new card: schedule for today (immediate review)
            ? { intervalDays: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: now }
            : calculateNextReview(1, previousInterval, previousEaseFactor, previousRepetitions, latencyMs)

          return [{
            user_id: user.id,
            card_id: card.id,
            pack_id: card.pack_id,
            review_date: now.toISOString(),
            next_review_date: reviewResult.nextReviewDate.toISOString(),
            interval_days: reviewResult.intervalDays,
            ease_factor: reviewResult.easeFactor,
            repetitions: reviewResult.repetitions,
            quality: 1,
            total_reviews: previousTotalReviews + 1,
          }]
        })

      if (srsUpserts.length > 0) {
        const { error: srsError } = await supabase
          .from('card_reviews')
          .upsert(srsUpserts, { onConflict: 'user_id,card_id' })
        if (srsError) console.error('Erro ao sincronizar erros da lição com o SRS:', srsError)
      }
    }
  }

  // Mark assignment status
  const baseStatus = result.status || 'completed'
  const richStatus = buildAssignmentStatus({
    ...timingMeta,
    baseStatus,
    completedWithinTime,
  })

  let { error: updateError } = await supabase
    .from('assignments')
    .update({ status: richStatus })
    .eq('id', result.assignmentId)

  if (updateError && isAssignmentsStatusCheckError(updateError) && richStatus.includes('|')) {
    ; ({ error: updateError } = await supabase
      .from('assignments')
      .update({ status: baseStatus })
      .eq('id', result.assignmentId))
  }

  if (updateError) throw new Error(updateError.message)

  // Evaluate Gamification
  evaluateGamification(user.id, {
    type: 'game',
    gameMode: assignment.game_mode,
    accuracy: correct + wrong > 0 ? (correct / (correct + wrong)) * 100 : 0,
    correct,
    wrong,
    streak: streakMax
  }).catch(err => console.error('Erro na gamificação:', err))

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
    ; ({ error } = await supabase.from('packs').insert({ ...payload, level: null }))
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
    ; ({ error } = await supabase.from('packs').update({ ...payload, level: null }).eq('id', id))
  }

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  return { success: true }
}

export async function setPacksFolderAction(packIds: string[], folderName: string | null) {
  const { supabase } = await requireAdmin()

  if (!packIds.length) {
    return { error: 'Nenhum pack selecionado.' }
  }

  const category = folderName?.trim() || null
  if (category && category.length > 60) {
    return { error: 'O nome da pasta deve ter no máximo 60 caracteres.' }
  }

  const { error } = await supabase
    .from('packs')
    .update({ category })
    .in('id', packIds)

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
    accepted_translations: formData.get('accepted_translations'),
    order_index: parseInt(formData.get('order_index') as string) || 0,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const parsedPrimary = splitPrimaryAndAcceptedTranslations(validated.data.pt)
  const primaryTranslation = parsedPrimary.primary || validated.data.pt.trim()
  const acceptedTranslations = mergeAcceptedTranslations(
    primaryTranslation,
    parsedPrimary.accepted,
    parseAcceptedTranslationsInput(validated.data.accepted_translations)
  )

  const { error } = await supabase.from('cards').insert({
    pack_id: validated.data.pack_id,
    english_phrase: validated.data.en,
    portuguese_translation: primaryTranslation,
    accepted_translations: acceptedTranslations,
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
    reward_badge_id: formData.get('reward_badge_id') || null,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  if (timed && !validated.data.time_limit_minutes) {
    return { error: 'Informe o tempo limite em minutos' }
  }

  const { user_id, pack_id, game_mode, assigned_date, time_limit_minutes, reward_badge_id } = validated.data
  const finalDate = assigned_date || getAppDateString()
  const initialStatus = buildAssignmentStatus({
    baseStatus: 'pending',
    timeLimitMinutes: timed ? time_limit_minutes || null : null,
    timerStartedAt: null,
    completedWithinTime: null,
  })

  let targetUserIds: string[] = []

  if (user_id === 'all') {
    const { data: members } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'member')

    if (!members) return { error: 'Nenhum membro encontrado' }
    targetUserIds = members.map((member: { id: string }) => member.id)
  } else if (user_id.startsWith('group:')) {
    const groupId = user_id.replace(/^group:/, '')
    const { data: memberships, error: membershipError } = await supabase
      .from('member_group_members')
      .select('user_id')
      .eq('group_id', groupId)

    if (membershipError) return { error: membershipError.message }
    targetUserIds = (memberships || []).map((membership: { user_id: string }) => membership.user_id)
  } else {
    targetUserIds = [user_id]
  }

  if (targetUserIds.length === 0) {
    return { error: 'Nenhum membro elegível encontrado para esta atribuição' }
  }

  const assignments = targetUserIds.map((targetUserId) => ({
    user_id: targetUserId,
    pack_id,
    game_mode,
    assigned_date: finalDate,
    status: initialStatus,
    reward_badge_id: reward_badge_id || null,
  }))

  let { error } = await supabase.from('assignments').upsert(assignments, { onConflict: 'user_id,assigned_date,pack_id,game_mode' })

  if (error && isAssignmentsStatusCheckError(error) && initialStatus.includes('|')) {
    const fallbackAssignments = targetUserIds.map((targetUserId) => ({
      user_id: targetUserId,
      pack_id,
      game_mode,
      assigned_date: finalDate,
      status: 'pending',
      reward_badge_id: reward_badge_id || null,
    }))
      ; ({ error } = await supabase.from('assignments').upsert(fallbackAssignments, { onConflict: 'user_id,assigned_date,pack_id,game_mode' }))
  }

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/home')
  return { success: true }
}

export async function createMemberGroup(data: {
  name: string
  description?: string
  memberIds: string[]
}) {
  const { supabase } = await requireAdmin()

  const validated = MemberGroupSchema.safeParse({
    name: data.name,
    description: data.description || '',
    member_ids: data.memberIds,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { data: group, error: groupError } = await supabase
    .from('member_groups')
    .insert({
      name: validated.data.name,
      description: validated.data.description || null,
    })
    .select('id')
    .single()

  if (groupError || !group) {
    return { error: groupError?.message || 'Erro ao criar grupo' }
  }

  const memberships = validated.data.member_ids.map((memberId) => ({
    group_id: group.id,
    user_id: memberId,
  }))

  const { error: membershipError } = await supabase
    .from('member_group_members')
    .insert(memberships)

  if (membershipError) {
    return { error: membershipError.message }
  }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  return { success: true, groupId: group.id }
}

export async function updateMemberGroup(
  groupId: string,
  data: { name: string; description?: string; memberIds: string[] }
) {
  const { supabase } = await requireAdmin()

  const validated = MemberGroupSchema.safeParse({
    name: data.name,
    description: data.description || '',
    member_ids: data.memberIds,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error: groupError } = await supabase
    .from('member_groups')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
    })
    .eq('id', groupId)

  if (groupError) return { error: groupError.message }

  const { error: deleteError } = await supabase
    .from('member_group_members')
    .delete()
    .eq('group_id', groupId)

  if (deleteError) return { error: deleteError.message }

  const memberships = validated.data.member_ids.map((memberId) => ({
    group_id: groupId,
    user_id: memberId,
  }))

  const { error: insertError } = await supabase
    .from('member_group_members')
    .insert(memberships)

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteMemberGroup(groupId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('member_groups')
    .delete()
    .eq('id', groupId)

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function createAssignmentTemplate(data: {
  name: string
  description?: string
  packId: string
  gameMode: 'multiple_choice' | 'flashcard' | 'typing' | 'matching' | 'listening' | 'speaking'
  timeLimitMinutes?: number | null
  rewardBadgeId?: string | null
}) {
  const { supabase } = await requireAdmin()

  const validated = AssignmentTemplateSchema.safeParse({
    name: data.name,
    description: data.description || '',
    pack_id: data.packId,
    game_mode: data.gameMode,
    time_limit_minutes: data.timeLimitMinutes ?? null,
    reward_badge_id: data.rewardBadgeId ?? null,
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { error } = await supabase.from('assignment_templates').insert({
    name: validated.data.name,
    description: validated.data.description || null,
    pack_id: validated.data.pack_id,
    game_mode: validated.data.game_mode,
    time_limit_minutes: validated.data.time_limit_minutes ?? null,
    reward_badge_id: validated.data.reward_badge_id ?? null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  return { success: true }
}

export async function deleteAssignmentTemplate(templateId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('assignment_templates')
    .delete()
    .eq('id', templateId)

  if (error) return { error: error.message }

  revalidatePath('/admin/assign')
  return { success: true }
}

type ScheduledReviewReleasePayload = {
  user_id: string
  pack_id: string
  card_id: string
  review_date: string
  next_review_date: string
  interval_days: number
  ease_factor: number
  repetitions: number
  quality: number
  total_reviews: number
}

export async function materializeScheduledReviewReleasesForUser(userId: string) {
  const supabase = await createClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const todayKey = getAppDateString(now)

  const { data: schedules, error } = await supabase
    .from('assignments')
    .select('id,user_id,pack_id,status,game_mode')
    .eq('user_id', userId)
    .eq('game_mode', 'scheduled_review')

  if (error || !schedules) {
    if (error) console.error('Erro ao buscar agendamentos de revisão:', error.message)
    return
  }

  const dueSchedules = schedules.flatMap((schedule: { id: string; user_id: string; pack_id: string; status: string; game_mode: string }) => {
    const meta = parseScheduledReviewStatus(schedule.status)
    if (!meta || !isScheduledReviewDue(meta, now) || !schedule.user_id || !schedule.pack_id) {
      return []
    }

    return [{ schedule, meta }]
  })

  if (dueSchedules.length === 0) return

  type ParsedMeta = NonNullable<ReturnType<typeof parseScheduledReviewStatus>>
  const selectedCardIds = [
    ...new Set(
      dueSchedules.flatMap(({ meta }: { meta: ParsedMeta }) =>
        meta.cardIds.slice(0, Math.min(meta.cardsPerRelease, DEFAULT_REVIEW_SESSION_CARD_LIMIT))
      )
    ),
  ]

  if (selectedCardIds.length === 0) return

  const { data: existingReviews, error: reviewsError } = await supabase
    .from('card_reviews')
    .select('card_id,review_date,interval_days,ease_factor,repetitions,total_reviews')
    .eq('user_id', userId)
    .in('card_id', selectedCardIds)

  if (reviewsError) {
    console.error('Erro ao buscar reviews existentes:', reviewsError.message)
    return
  }

  type ExistingReviewRow = { card_id: string; review_date: string; interval_days: number; ease_factor: number; repetitions: number; total_reviews: number }
  const existingMap = new Map((existingReviews as ExistingReviewRow[] || []).map((row) => [row.card_id, row]))
  const payloadByCardId = new Map<string, ScheduledReviewReleasePayload>()

  for (const { schedule, meta } of dueSchedules) {
    const releaseCardIds = meta.cardIds.slice(0, Math.min(meta.cardsPerRelease, DEFAULT_REVIEW_SESSION_CARD_LIMIT))

    for (const cardId of releaseCardIds) {
      if (payloadByCardId.has(cardId)) continue

      const existing = existingMap.get(cardId)
      payloadByCardId.set(cardId, {
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
      })
    }
  }

  const payload = [...payloadByCardId.values()]
  if (payload.length === 0) return

  const { error: upsertError } = await supabase
    .from('card_reviews')
    .upsert(payload, { onConflict: 'user_id,card_id' })

  if (upsertError) {
    console.error('Erro ao materializar revisão agendada:', upsertError.message)
    return
  }

  await Promise.all(
    dueSchedules.map(async ({ schedule, meta }: { schedule: { id: string; user_id: string; pack_id: string }; meta: ParsedMeta }) => {
      const { error: updateError } = await supabase
        .from('assignments')
        .update({
          status: buildScheduledReviewStatus({
            ...meta,
            lastReleaseKey: `${todayKey}@${meta.time}`,
          }),
        })
        .eq('id', schedule.id)

      if (updateError) {
        console.error('Erro ao atualizar agendamento materializado:', updateError.message)
      }
    })
  )
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
    expires_on: String(formData.get('review_expires_on') || ''),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { user_id, pack_id, weekdays: validatedWeekdays, time, card_ids, cards_per_release, expires_on } = validated.data
  const expiresOn = expires_on?.trim() || null
  const status = buildScheduledReviewStatus({
    weekdays: validatedWeekdays,
    time,
    cardIds: card_ids,
    cardsPerRelease: Math.min(cards_per_release, card_ids.length, DEFAULT_REVIEW_SESSION_CARD_LIMIT),
    lastReleaseKey: null,
    active: true,
    expiresOn,
  })

  let targetUserIds: string[] = []

  if (user_id === 'all') {
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'member')

    if (membersError) return { error: membersError.message }
    targetUserIds = (members as { id: string }[] || []).map((member) => member.id)
  } else {
    targetUserIds = [user_id]
  }

  if (targetUserIds.length === 0) {
    return { error: 'Nenhum membro elegível encontrado para criar a regra.' }
  }

  const payload = targetUserIds.map((targetUserId) => ({
    user_id: targetUserId,
    pack_id,
    game_mode: 'scheduled_review',
    assigned_date: getAppDateString(),
    status,
  }))

  const { error } = await supabase.from('assignments').insert(payload)

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
    expires_on: String(formData.get('review_expires_on') || ''),
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
  const { user_id, pack_id, weekdays: validatedWeekdays, time, card_ids, cards_per_release, expires_on } = validated.data

  if (user_id === 'all') {
    return { error: 'Use um membro específico para editar uma regra existente.' }
  }

  const { error } = await supabase
    .from('assignments')
    .update({
      user_id,
      pack_id,
      status: buildScheduledReviewStatus({
        weekdays: validatedWeekdays,
        time,
        cardIds: card_ids,
        cardsPerRelease: Math.min(cards_per_release, card_ids.length, DEFAULT_REVIEW_SESSION_CARD_LIMIT),
        lastReleaseKey: previousMeta?.lastReleaseKey || null,
        active: previousMeta?.active ?? true,
        expiresOn: expires_on?.trim() || null,
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
        cardsPerRelease: Math.min(meta.cardsPerRelease, DEFAULT_REVIEW_SESSION_CARD_LIMIT),
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
      cardsPerRelease: Math.min(meta.cardsPerRelease, DEFAULT_REVIEW_SESSION_CARD_LIMIT),
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
    let { error: updateError } = await supabase
      .from('assignments')
      .update({
        status: buildAssignmentStatus({
          ...meta,
          timerStartedAt: startedAt,
        }),
      })
      .eq('id', assignmentId)

    if (updateError && isAssignmentsStatusCheckError(updateError)) {
      ; ({ error: updateError } = await supabase
        .from('assignments')
        .update({ status: meta.baseStatus })
        .eq('id', assignmentId))
    }

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
  revalidatePath('/history')
  return { success: true }
}

export async function deleteAllAssignments(): Promise<ActionResult> {
  const { supabase } = await requireAdmin()

  // Status uses pipe-separated format (e.g. 'pending|tl=15', 'scheduled_review|...')
  // so we delete everything that does NOT start with 'completed'
  const { error } = await supabase
    .from('assignments')
    .delete()
    .not('status', 'like', 'completed%')

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/assign')
  revalidatePath('/home')
  revalidatePath('/history')
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

export async function updateMemberLevel(userId: string, levelCode: string, levelName: string): Promise<ActionResult> {
  await requireAdmin()
  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return { success: false, error: 'Admin client indisponível' }

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    user_metadata: { english_level: levelCode, english_level_name: levelName }
  })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/admin/members/${userId}`)
  revalidatePath('/home')
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

  const importAnalysis = analyzeImportCards(data.cards)

  if (importAnalysis.validCards.length === 0) {
    return { error: 'Nenhum card válido restou após remover vazios e duplicados.' }
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
    ; ({ data: pack, error: packError } = await supabase
      .from('packs')
      .insert({ ...payload, level: null })
      .select('id')
      .single())
  }

  if (packError || !pack) {
    return { error: packError?.message || 'Erro ao criar pack' }
  }

  // Create card objects
  const cardsToInsert = importAnalysis.validCards.map((card) => {
    const parsedPrimary = splitPrimaryAndAcceptedTranslations(card.pt)
    const primaryTranslation = parsedPrimary.primary || card.pt.trim()

    return {
      pack_id: pack.id,
      english_phrase: card.en,
      portuguese_translation: primaryTranslation,
      accepted_translations: mergeAcceptedTranslations(primaryTranslation, parsedPrimary.accepted),
    }
  })

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
  return {
    success: true,
    packId: pack.id,
    cardCount: insertedCount,
    skippedDuplicates: importAnalysis.duplicateWithinImportCount,
    skippedEmpty: importAnalysis.emptyCount,
  }
}

export async function updateCard(
  id: string,
  data: { en?: string; pt?: string; acceptedTranslations?: string }
) {
  const { supabase } = await requireAdmin()

  const updateData: Record<string, string | string[]> = {}
  if (data.en) updateData.english_phrase = data.en
  if (data.pt !== undefined || data.acceptedTranslations !== undefined) {
    const { data: existingCard, error: existingCardError } = await supabase
      .from('cards')
      .select('portuguese_translation,accepted_translations')
      .eq('id', id)
      .single()

    if (existingCardError || !existingCard) {
      return { error: existingCardError?.message || 'Card não encontrado' }
    }

    const parsedPrimary = splitPrimaryAndAcceptedTranslations(
      data.pt ?? existingCard.portuguese_translation
    )
    const primaryTranslation =
      parsedPrimary.primary ||
      splitPrimaryAndAcceptedTranslations(existingCard.portuguese_translation).primary ||
      existingCard.portuguese_translation

    updateData.portuguese_translation = primaryTranslation
    updateData.accepted_translations = mergeAcceptedTranslations(
      primaryTranslation,
      parsedPrimary.accepted,
      parseAcceptedTranslationsInput(
        data.acceptedTranslations ?? (existingCard.accepted_translations || []).join('; ')
      )
    )
  }

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
  latencyMs?: number
  streak?: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Import the SM-2 algorithm function
  const { calculateNextReview, getInitialReview } = await import('@/features/review/lib/spacedRepetition')

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
      data.previousRepetitions ?? 0,
      data.latencyMs
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

  // Evaluate Gamification
  evaluateGamification(user.id, {
    type: 'review',
    accuracy: data.quality >= 3 ? 100 : 0,
    correct: data.quality >= 3 ? 1 : 0,
    wrong: data.quality < 3 ? 1 : 0,
    streak: data.streak
  }).catch(err => console.error('Erro na gamificação (review):', err))

  revalidatePath('/home')
  revalidatePath('/review')
  return { success: true, reviewResult }
}

export async function getDueCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { dueCards: [], totalDue: 0, totalBacklogDue: 0, deferredDue: 0, newCardsLimit: 0, sessionLimit: 0 }

  try {
    await materializeScheduledReviewReleasesForUser(user.id)
    const queue = await getReviewQueueForUser(
      supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
      user.id
    )
    return {
      dueCards: queue.dueCards,
      totalDue: queue.totalDue,
      totalBacklogDue: queue.totalBacklogDue,
      deferredDue: queue.deferredDue,
      newCardsLimit: queue.newCardsLimit,
      sessionLimit: queue.sessionLimit,
    }
  } catch (error) {
    console.error('Error fetching due cards:', error)
    return { dueCards: [], totalDue: 0, totalBacklogDue: 0, deferredDue: 0, newCardsLimit: 0, sessionLimit: 0 }
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

  const { data: existingCards, error: existingCardsError } = await supabase
    .from('cards')
    .select('english_phrase,portuguese_translation')
    .eq('pack_id', data.packId)

  if (existingCardsError) {
    return { error: existingCardsError.message }
  }

  const importAnalysis = analyzeImportCards(
    data.cards,
    (existingCards as { english_phrase: string; portuguese_translation: string }[] || []).map((card) => ({
      en: card.english_phrase,
      pt: card.portuguese_translation,
    }))
  )

  if (importAnalysis.validCards.length === 0) {
    return { error: 'Nenhum card novo restou após remover vazios e duplicados.' }
  }

  // Create card objects
  const cardsToInsert = importAnalysis.validCards.map((card) => {
    const parsedPrimary = splitPrimaryAndAcceptedTranslations(card.pt)
    const primaryTranslation = parsedPrimary.primary || card.pt.trim()

    return {
      pack_id: data.packId,
      english_phrase: card.en,
      portuguese_translation: primaryTranslation,
      accepted_translations: mergeAcceptedTranslations(primaryTranslation, parsedPrimary.accepted),
    }
  })

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
  return {
    success: true,
    packId: data.packId,
    cardCount: insertedCount,
    skippedDuplicates:
      importAnalysis.duplicateWithinImportCount + importAnalysis.duplicateAgainstExistingCount,
    skippedEmpty: importAnalysis.emptyCount,
  }
}

// ===== GAMIFICATION & SOCIAL ACTIONS =====

export async function followUser(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  if (addresseeId === user.id) {
    return { success: false, error: 'Você não pode seguir a si mesmo' }
  }

  const { error } = await supabase
    .from('friendships')
    .insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: 'accepted'
    })

  if (error) {
    if (error.code === '23505') return { success: true } // Already following
    return { success: false, error: error.message }
  }

  revalidatePath('/social')
  return { success: true }
}

export async function unfollowUser(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error } = await supabase
    .from('friendships')
    .delete()
    .eq('requester_id', user.id)
    .eq('addressee_id', addresseeId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/social')
  return { success: true }
}

export async function evaluateGamification(userId: string, stats: {
  type: 'game' | 'review',
  gameMode?: string,
  accuracy?: number,
  correct?: number,
  wrong?: number,
  streak?: number
}) {
  const supabase = await createClient()

  // 1. Update Quests
  const { data: quests } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (quests && quests.length > 0) {
    for (const quest of quests) {
      let progressIncrement = 0
      if (quest.quest_type === 'any_session') progressIncrement = 1
      if (quest.quest_type === 'listening_game' && stats.gameMode === 'listening') progressIncrement = 1
      if (quest.quest_type === 'speaking_game' && stats.gameMode === 'speaking') progressIncrement = 1
      if (quest.quest_type === 'perfect_accuracy' && stats.accuracy === 100) progressIncrement = 1

      if (progressIncrement > 0) {
        const newProgress = quest.progress + progressIncrement
        const newStatus = newProgress >= quest.target ? 'completed' : 'active'

        await supabase
          .from('user_quests')
          .update({ progress: newProgress, status: newStatus })
          .eq('id', quest.id)
      }
    }
  }

  // 2. Evaluate Badges
  const { data: allBadges } = await supabase.from('badges').select('*')
  const { data: unlockedBadges } = await supabase
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const unlockedIds = new Set((unlockedBadges as { badge_id: string }[])?.map((ub) => ub.badge_id) || [])

  if (allBadges) {
    for (const badge of allBadges) {
      if (unlockedIds.has(badge.id)) continue

      let shouldUnlock = false

      if (badge.condition_type === 'total_sessions') {
        const { count } = await supabase
          .from('game_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
        if (count && count >= badge.target_value) shouldUnlock = true
      }

      if (badge.condition_type === 'perfect_games' && stats.wrong === 0 && (stats.correct || 0) >= 10) {
        shouldUnlock = true
      }

      // Streak would need more complex query or passing streak from frontend
      if (badge.condition_type === 'streak_days' && (stats.streak || 0) >= badge.target_value) {
        shouldUnlock = true
      }

      if (shouldUnlock) {
        await supabase
          .from('user_badges')
          .insert({ user_id: userId, badge_id: badge.id })
      }
    }
  }
}

// ===== QUEST ACTIONS =====

export async function createQuestAction(data: {
  userId: string | 'all',
  questType: string,
  target: number,
  expiresAt?: string | null
}) {
  const { supabase } = await requireAdmin()

  const userIds = data.userId === 'all'
    ? (await supabase.from('profiles').select('id')).data?.map((u: { id: string }) => u.id) || []
    : [data.userId]

  const inserts = userIds.map((uid: string) => ({
    user_id: uid,
    quest_type: data.questType,
    target: data.target,
    expires_at: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
    status: 'active',
    progress: 0
  }))

  const { error } = await supabase.from('user_quests').insert(inserts)

  if (error) return { success: false, error: error.message }

  revalidatePath('/social')
  revalidatePath('/admin/assign')
  return { success: true }
}

export async function updateQuestAction(questId: string, data: {
  quest_type?: string,
  progress?: number,
  target?: number,
  status?: 'active' | 'completed',
  expires_at?: string | null
}) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('user_quests')
    .update(data)
    .eq('id', questId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/social')
  revalidatePath('/admin/assign')
  return { success: true }
}

export async function deleteQuestAction(questId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('user_quests')
    .delete()
    .eq('id', questId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/social')
  revalidatePath('/admin/assign')
  return { success: true }
}

// ===== PROFILE ACTIONS =====

const ProfileSchema = z.object({
  username: z.string()
    .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
    .max(30, 'Nome de usuário deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Nome de usuário só pode conter letras, números, sublinhados, pontos e hífens')
    .optional()
    .nullable(),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional().nullable(),
  description: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional().nullable(),
  avatar_url: z.string().url('URL do avatar inválida').optional().nullable().or(z.literal('')),
  cover_url: z.string().url('URL da capa inválida').optional().nullable().or(z.literal('')),
})

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return { success: false, error: 'Admin client indisponível' }

  const username = (formData.get('username') as string | null) || null
  const bio = (formData.get('bio') as string | null) || null
  const description = (formData.get('description') as string | null) || null
  const avatar_url = (formData.get('avatar_url') as string | null) || null
  const cover_url = (formData.get('cover_url') as string | null) || null

  const validated = ProfileSchema.safeParse({ username, bio, description, avatar_url, cover_url })
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0].message }
  }

  if (validated.data.avatar_url && !isAllowedCloudinaryDeliveryUrl(validated.data.avatar_url)) {
    return { success: false, error: 'URL do avatar inválida.' }
  }

  if (validated.data.cover_url && !isAllowedCloudinaryDeliveryUrl(validated.data.cover_url)) {
    return { success: false, error: 'URL da capa inválida.' }
  }

  // Check if username is already taken by another user
  if (validated.data.username) {
    const { data: existingUser } = await adminSupabase
      .from('profiles')
      .select('id')
      .eq('username', validated.data.username)
      .neq('id', user.id)
      .maybeSingle()

    if (existingUser) {
      return { success: false, error: 'Este nome de usuário já está em uso.' }
    }
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update({
      username: validated.data.username || undefined,
      bio: validated.data.bio || null,
      description: validated.data.description || null,
      avatar_url: validated.data.avatar_url || null,
      cover_url: validated.data.cover_url || null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update failed', { userId: user.id, error })
    return { success: false, error: 'Não foi possível atualizar o perfil.' }
  }

  revalidatePath('/profile')
  revalidatePath('/home')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateWeeklyReportPreferenceAction(enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return { success: false, error: 'Admin client indisponível' }

  const { error } = await adminSupabase
    .from('profiles')
    .update({
      weekly_report_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Weekly report preference update failed', { userId: user.id, error })
    return { success: false, error: 'Não foi possível atualizar a preferência.' }
  }

  revalidatePath('/profile')
  return { success: true }
}

export async function subscribeToPack(packId: string, gameMode: string = 'flashcard') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('pack_id', packId)
    .eq('game_mode', gameMode)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'Você já possui este pacote em seus estudos.' }
  }

  const { error } = await supabase.from('assignments').insert({
    user_id: user.id,
    pack_id: packId,
    game_mode: gameMode,
    status: 'pending',
    assigned_date: getAppDateString()
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/home')
  revalidatePath('/explore')
  return { success: true }
}

export async function generateTutorResponse(
  history: { role: 'user' | 'assistant'; content: string }[],
  scenario: { name: string; context: string; assistantRole: string }
) {
  try {
    const ip = await getClientIp()
    const limited = await isRateLimited('ai_tutor', ip, 15, 3600)
    if (limited) {
      return { error: 'Muitas mensagens para o tutor. Tente novamente mais tarde.' }
    }
    const systemPrompt = `You are a helpful English tutor. You are participating in a roleplay scenario with a student.
  Scenario: ${scenario.name}. 
  Context: ${scenario.context}.
  Your Role: ${scenario.assistantRole}.
  
  Instructions:
  1. Keep your responses short and conversational (max 2-3 sentences).
  2. Speak naturally like a native speaker.
  3. After your response, if the student made a significant grammar mistake in their previous message, add a short "Grammar Tip" at the end, wrapped in [TIP] tags. 
  Example: "Great choice! I will bring your latte in a minute. [TIP] You should say 'I would like' instead of 'I want' to be more polite."`

    const content = await createGroqChatCompletion({
      model: AI_MODELS.tutor,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      temperature: 0.7,
      maxTokens: 300,
    })

    // Extract tip if exists
    const tipMatch = content.match(/\[TIP\](.*)/)
    const tip = tipMatch ? tipMatch[1].trim() : null
    const cleanContent = content.replace(/\[TIP\].*/, '').trim()

    return { content: cleanContent, tip }
  } catch (error) {
    console.error('Error in generateTutorResponse:', error)
    return { error: 'Erro ao processar resposta do tutor.' }
  }
}

// ===== ARENA GHOST ACTIONS =====

export async function getGhostChallenges() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: ghosts } = await supabase
    .from('arena_ghost_recordings')
    .select(`
      id,
      game_type,
      score,
      created_at,
      profiles:user_id (id, username, avatar_url),
      packs:pack_id (id, name)
    `)
    .neq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return ghosts || []
}

export async function createGhostDuel(opponentId: string, packId: string, gameType: string) {
  const ip = await getClientIp()
  const limited = await isRateLimited('arena_duel', ip, 20, 3600)
  if (limited) throw new Error('Muitas requisições de arena.')

  const parsed = ArenaGhostDuelSchema.safeParse({ opponentId, packId, gameType })
  if (!parsed.success) throw new Error('Duelo inválido')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  if (parsed.data.opponentId === user.id) throw new Error('Oponente inválido')
  const adminSupabase = createAdminClient()
  if (!adminSupabase) throw new Error('Admin client indisponível')

  // Get the ghost recording
  const { data: ghost } = await supabase
    .from('arena_ghost_recordings')
    .select('*')
    .eq('user_id', parsed.data.opponentId)
    .eq('pack_id', parsed.data.packId)
    .eq('game_type', parsed.data.gameType)
    .single()

  if (!ghost) throw new Error('Fantasma não encontrado')

  const startedAt = new Date(Date.now() + 3000).toISOString()

  // Create duel already in active status
  const { data: duel, error } = await adminSupabase
    .from('arena_duels')
    .insert({
      player1_id: user.id,
      player2_id: parsed.data.opponentId,
      pack_id: parsed.data.packId,
      game_type: parsed.data.gameType,
      status: 'active',
      started_at: startedAt,
      is_ghost: true as boolean,
      player2_joined_at: new Date().toISOString(),
      player1_joined_at: new Date().toISOString(),
      player2_events: ghost.events,
      player2_score: ghost.score,
      player2_wrong: ghost.wrong_count,
    } as never)
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidatePath('/arena')
  return { success: true, duelId: duel.id }
}

/**
 * MFA (Multi-Factor Authentication) Actions
 */

export async function enrollMFA() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const limited = await isRateLimited('mfa_enroll', user.id, 3, 60 * 60)
  if (limited) {
    await recordSecurityEvent({
      eventType: 'mfa_enroll_rate_limited',
      severity: 'medium',
      actorUserId: user.id,
    })
    throw new Error('Muitas tentativas de configurar 2FA. Aguarde e tente novamente.')
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'Kivora English',
    friendlyName: user.email
  })

  if (error) throw new Error(error.message)

  await recordSecurityEvent({
    eventType: 'mfa_enroll_started',
    severity: 'low',
    actorUserId: user.id,
  })

  return data
}

export async function verifyMFA(factorId: string, code: string) {
  const supabase = await createClient()
  const ip = await getClientIp()
  const factorHash = hashSecurityValue(factorId)
  const parsedCode = z.string().regex(/^\d{6}$/).safeParse(code)

  if (!parsedCode.success) {
    await recordSecurityEvent({
      eventType: 'mfa_verify_invalid_format',
      severity: 'medium',
      identifierHash: factorHash,
      ipAddress: ip,
    })
    return { error: 'Código inválido ou expirado.' }
  }

  const [ipLimited, factorLimited] = await Promise.all([
    isRateLimited('mfa_verify_ip', ip, 10, 5 * 60),
    isRateLimited('mfa_verify_factor', factorHash, 8, 5 * 60),
  ])

  if (ipLimited || factorLimited) {
    await recordSecurityEvent({
      eventType: 'mfa_verify_rate_limited',
      severity: 'high',
      identifierHash: factorHash,
      ipAddress: ip,
      metadata: { ipLimited, factorLimited },
    })
    return { error: 'Código inválido ou expirado.' }
  }
  
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: parsedCode.data
  })

  if (error) {
    await recordSecurityEvent({
      eventType: 'mfa_verify_failed',
      severity: 'medium',
      identifierHash: factorHash,
      ipAddress: ip,
      metadata: { error: error.message },
    })
    return { error: 'Código inválido ou expirado.' }
  }

  await recordSecurityEvent({
    eventType: 'mfa_verify_success',
    severity: 'low',
    identifierHash: factorHash,
    ipAddress: ip,
  })

  return { success: true, data }
}

export async function unenrollMFA(factorId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const limited = await isRateLimited('mfa_unenroll', user.id, 3, 60 * 60)
  if (limited) {
    await recordSecurityEvent({
      eventType: 'mfa_unenroll_rate_limited',
      severity: 'high',
      actorUserId: user.id,
    })
    throw new Error('Muitas tentativas de alterar 2FA. Aguarde e tente novamente.')
  }

  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  
  if (error) throw new Error(error.message)

  await recordSecurityEvent({
    eventType: 'mfa_unenroll_success',
    severity: 'high',
    actorUserId: user.id,
    identifierHash: hashSecurityValue(factorId),
  })
  
  return { success: true }
}

export async function checkMFAStatus() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  
  if (error) return { currentLevel: 'aal1', nextLevel: 'aal1' }
  
  return data
}

export async function clearArenaHistory() {
  await requireAdmin()
  const adminSupabase = createAdminClient()
  if (!adminSupabase) throw new Error('Cliente admin do Supabase indisponível')
  const { error } = await adminSupabase.from('arena_duels').delete().in('status', ['finished', 'cancelled'])
  if (error) throw new Error(error.message)
  revalidatePath('/arena')
  return { success: true }
}

export async function clearFocusAreaAction(): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado' }
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return { success: false, error: 'Serviço indisponível no momento.' }
  }

  const { error } = await adminSupabase.from('session_errors').delete().eq('user_id', user.id)

  if (error) {
    console.error('Erro ao limpar área de foco:', error)
    return { success: false, error: 'Não foi possível limpar a área de foco.' }
  }

  revalidatePath('/history')
  revalidatePath('/problem-words')
  return { success: true }
}
