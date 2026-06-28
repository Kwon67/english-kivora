'use server'

import { randomUUID } from 'crypto'
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
import { parseGeneratedCards } from '@/features/ai/lib/deckGeneration'
import { parseTtsVoice, synthesizeSpeechToBuffer } from '@/lib/tts'
import { z } from 'zod'

import { resolveLoginEmail } from '@/features/auth/lib/resolveLoginEmail'
import {
  getAdminSecret,
  getStandardAuthError,
  getClientIp,
  hashSecurityValue,
  isRateLimited,
  peekRateLimit,
  recordSecurityEvent,
} from '@/features/security/lib/security'
import { isAllowedCloudinaryDeliveryUrl } from '@/lib/cloudinaryUpload'
import { isBlitzTableMissingError } from '@/features/blitz/lib/blitzTable'
import {
  getUserCefrProfile,
  recordCefrInteraction,
  setManualCefrLevel,
} from '@/features/cefr/lib/cefrAssessment'
import { buildBlitzAiPrompt } from '@/features/blitz/lib/blitzAiPrompt'
import { getCefrLevelLabel, isLearnerCefrLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { updateStreak } from '@/features/streak/lib/streak'
import type { Card } from '@/types/database.types'

export type GamificationStats = {
  type: 'game' | 'review' | 'blitz'
  gameMode?: string
  accuracy?: number
  correct?: number
  wrong?: number
  streak?: number
  blitzScore?: number
  maxCombo?: number
}

export type GamificationResult = {
  unlockedBadges: { name: string; icon_name: string | null }[]
  questsCompleted: string[]
}

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
const CefrPackLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])

const PackSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  level: CefrPackLevelSchema.optional(),
})

const PackVisibilitySchema = z.enum(['private', 'public']).default('public')

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

const BlitzRunSchema = z.object({
  score: z.number().int().min(0).max(1_000_000),
  maxCombo: z.number().int().min(0).max(10_000),
  cardsAnswered: z.number().int().min(0).max(10_000),
  durationMs: z.number().int().min(0).max(3_600_000),
})

const BlitzAiCardSchema = z.object({
  en: z.string().trim().min(1).max(200),
  pt: z.string().trim().min(1).max(240),
})

const SaveBlitzAiPackSchema = z.object({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().max(280).optional(),
  level: z.enum(['A1', 'A2', 'B1', 'B2']).optional(),
  cards: z.array(BlitzAiCardSchema).min(2).max(50),
})

export type BlitzAiPackDraft = {
  name: string
  description: string
  level?: LearnerCefrLevel
  cards: Array<{ en: string; pt: string }>
}

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

  recordCefrInteraction(supabase, user.id, result.packId, { correct, total: correct + wrong }).catch(
    (err) => console.error('Erro ao atualizar nível CEFR (lição):', err)
  )

  revalidatePath('/home')
  revalidatePath('/history')
  revalidatePath('/admin/dashboard')
  revalidatePath(`/admin/members/${user.id}`)
}

// ===== ADMIN ACTIONS =====

export async function createPack(formData: FormData) {
  const { supabase, user } = await requireAdmin()

  const validated = PackSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    level: formData.get('difficulty'),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const visibility = PackVisibilitySchema.parse(formData.get('visibility') || 'public')
  const payload = {
    name: validated.data.name,
    description: validated.data.description || null,
    level: validated.data.level || null,
    is_public: visibility === 'public',
    owner_id: visibility === 'private' ? user.id : null,
  }
  const { error } = await supabase.from('packs').insert(payload)

  if (error) return { error: error.message }

  revalidatePath('/admin/packs')
  revalidatePath('/blitz')
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
  const { error } = await supabase
    .from('packs')
    .update(payload)
    .eq('id', id)

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
    assigned_by: 'admin' as const,
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
      assigned_by: 'admin' as const,
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
  const { supabase } = await requireAdmin()

  if (!isLearnerCefrLevel(levelCode)) {
    return { success: false, error: 'Nível CEFR inválido para o escopo do produto (A1–B2).' }
  }

  await setManualCefrLevel(supabase, userId, levelCode)

  const { createAdminClient } = await import('@/lib/supabase/server')
  const adminSupabase = createAdminClient()
  if (!adminSupabase) return { success: false, error: 'Admin client indisponível' }

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      english_level: levelCode,
      english_level_name: levelName,
      english_level_source: 'manual',
    },
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
  level?: z.infer<typeof CefrPackLevelSchema>
  visibility?: 'private' | 'public'
  cards: { en: string; pt: string }[]
}) {
  const { supabase, user } = await requireAdmin()

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
    level: data.level || 'B1',
    is_public: (data.visibility || 'public') === 'public',
    owner_id: data.visibility === 'private' ? user.id : null,
  }
  const { data: pack, error: packError } = await supabase
    .from('packs')
    .insert(payload)
    .select('id')
    .single()

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
  revalidatePath('/blitz')
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

  recordCefrInteraction(supabase, user.id, data.packId, {
    correct: data.quality >= 3 ? 1 : 0,
    total: 1,
  }).catch((err) => console.error('Erro ao atualizar nível CEFR (review):', err))

  revalidatePath('/home')
  revalidatePath('/history')
  return { success: true, reviewResult }
}

export async function refreshReviewQueue() {
  revalidatePath('/review')
  revalidatePath('/home')
  revalidatePath('/history')
}

export async function getDueCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      dueCards: [],
      totalDue: 0,
      totalBacklogDue: 0,
      deferredDue: 0,
      newCardsLimit: 0,
      sessionLimit: 0,
      packCardsByPackId: {},
    }
  }

  try {
    await materializeScheduledReviewReleasesForUser(user.id)
    const { buildReviewSessionPayload } = await import('@/features/review/lib/reviewSession')
    const queue = await buildReviewSessionPayload(
      supabase as unknown as Parameters<typeof buildReviewSessionPayload>[0],
      user.id
    )
    return {
      dueCards: queue.dueCards,
      totalDue: queue.totalDue,
      totalBacklogDue: queue.totalBacklogDue,
      deferredDue: queue.deferredDue,
      newCardsLimit: queue.newCardsLimit,
      sessionLimit: queue.sessionLimit,
      packCardsByPackId: queue.packCardsByPackId,
    }
  } catch (error) {
    console.error('Error fetching due cards:', error)
    return {
      dueCards: [],
      totalDue: 0,
      totalBacklogDue: 0,
      deferredDue: 0,
      newCardsLimit: 0,
      sessionLimit: 0,
      packCardsByPackId: {},
    }
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
  revalidatePath('/blitz')
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

export async function evaluateGamification(
  userId: string,
  stats: GamificationStats
): Promise<GamificationResult> {
  const supabase = await createClient()
  const unlockedBadgeResults: GamificationResult['unlockedBadges'] = []
  const questsCompleted: string[] = []

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
      if (quest.quest_type === 'blitz_session' && stats.type === 'blitz') progressIncrement = 1
      if (
        quest.quest_type === 'blitz_combo' &&
        stats.type === 'blitz' &&
        (stats.maxCombo || 0) >= quest.target
      ) {
        progressIncrement = 1
      }

      if (progressIncrement > 0) {
        const newProgress = quest.progress + progressIncrement
        const newStatus = newProgress >= quest.target ? 'completed' : 'active'

        await supabase
          .from('user_quests')
          .update({ progress: newProgress, status: newStatus })
          .eq('id', quest.id)

        if (newStatus === 'completed') {
          questsCompleted.push(quest.quest_type)
        }
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

      if (badge.condition_type === 'streak_days' && (stats.streak || 0) >= badge.target_value) {
        shouldUnlock = true
      }

      if (
        badge.condition_type === 'blitz_score' &&
        stats.type === 'blitz' &&
        (stats.blitzScore || 0) >= badge.target_value
      ) {
        shouldUnlock = true
      }

      if (shouldUnlock) {
        await supabase
          .from('user_badges')
          .insert({ user_id: userId, badge_id: badge.id })

        unlockedBadgeResults.push({
          name: badge.name,
          icon_name: badge.icon_name,
        })
      }
    }
  }

  return { unlockedBadges: unlockedBadgeResults, questsCompleted }
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
  const { selfAssignPackAction } = await import('@/app/member-assign-actions')
  return selfAssignPackAction({ packId, gameMode })
}

export async function generateTutorResponse(
  history: { role: 'user' | 'assistant'; content: string }[],
  scenario: { name: string; context: string; assistantRole: string; level?: string }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Não autenticado' }
    }

    const cefrProfile = await getUserCefrProfile(supabase, user.id, user.user_metadata)
    const studentLevel = cefrProfile.level || scenario.level || 'A2'
    const rateLimitKey = `ai_tutor:${user.id}`
    const limited = await isRateLimited('ai_tutor', rateLimitKey, 40, 3600)
    if (limited) {
      return { error: 'Muitas mensagens para o tutor. Tente novamente mais tarde.' }
    }

    const systemPrompt = `You are a helpful English tutor for Brazilian students. You are participating in a roleplay scenario.
  Scenario: ${scenario.name}.
  Context: ${scenario.context}.
  Your Role: ${scenario.assistantRole}.
  Student CEFR level: ${studentLevel}. Adjust vocabulary and sentence complexity to this level.
  
  Instructions:
  1. Keep your responses short and conversational (max 2-3 sentences).
  2. Speak naturally like a native speaker.
  3. Stay in character for the scenario.
  4. After your response, if the student made a significant grammar, vocabulary, or pragmatics mistake in their previous message, add a short correction tip in Brazilian Portuguese, wrapped in [TIP] tags.
  Example: "Great choice! I will bring your latte in a minute. [TIP] Em contextos formais, prefira 'I would like' em vez de 'I want'."`

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

// ===== BLITZ ACTIONS =====

function shuffleCards<T>(items: T[]): T[] {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]]
  }
  return copy
}

export async function getBlitzCards(limit = 40): Promise<{ cards: Card[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cards: [], error: 'Não autenticado' }

  const cefrProfile = await getUserCefrProfile(supabase, user.id, user.user_metadata)
  const targetLevel = cefrProfile.level

  const collected: Card[] = []
  const seenIds = new Set<string>()

  const pushCards = (rows: Card[] | null | undefined) => {
    for (const row of rows || []) {
      if (!row.id || seenIds.has(row.id)) continue
      seenIds.add(row.id)
      collected.push(row)
    }
  }

  try {
    await materializeScheduledReviewReleasesForUser(user.id)
    const queue = await getReviewQueueForUser(
      supabase as unknown as Parameters<typeof getReviewQueueForUser>[0],
      user.id
    )

    for (const item of queue.dueCards) {
      const reviewItem = item as unknown as { cards?: Card; id?: string }
      if (reviewItem.cards?.id) {
        pushCards([reviewItem.cards])
      } else if (reviewItem.id) {
        pushCards([reviewItem as Card])
      }
      if (collected.length >= limit) break
    }
  } catch (error) {
    console.error('Error loading review cards for Blitz:', error)
  }

  if (collected.length < limit) {
    const { data: assignments } = await supabase
      .from('assignments')
      .select('pack_id')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .limit(8)

    const packIds = [...new Set((assignments || []).map((assignment) => assignment.pack_id).filter(Boolean))]
    if (packIds.length > 0) {
      const { data: assignmentCards } = await supabase
        .from('cards')
        .select('*')
        .in('pack_id', packIds)
        .limit(limit * 2)

      pushCards((assignmentCards || []) as Card[])
    }
  }

  if (collected.length < limit) {
    const { data: packs } = await supabase
      .from('packs')
      .select('id, level')
      .or(`is_public.eq.true,is_public.is.null,owner_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(20)

    const { normalizePackLevel, getCefrLevelWeight } = await import('@/features/cefr/lib/cefrLevels')
    const targetWeight = targetLevel ? getCefrLevelWeight(targetLevel) : 2

    const sortedPackIds = [...(packs || [])]
      .sort((a, b) => {
        const aDistance = Math.abs(getCefrLevelWeight(normalizePackLevel(a.level)) - targetWeight)
        const bDistance = Math.abs(getCefrLevelWeight(normalizePackLevel(b.level)) - targetWeight)
        return aDistance - bDistance
      })
      .slice(0, 8)
      .map((pack) => pack.id)

    if (sortedPackIds.length > 0) {
      const { data: fallbackCards } = await supabase
        .from('cards')
        .select('*')
        .in('pack_id', sortedPackIds)
        .limit(limit * 2)

      pushCards((fallbackCards || []) as Card[])
    }
  }

  return {
    cards: shuffleCards(collected).slice(0, limit),
    error: null,
  }
}

function toBlitzTempCards(cards: Array<{ en: string; pt: string }>): Card[] {
  const now = new Date().toISOString()
  const packId = `blitz-ai-${randomUUID()}`

  return cards.map((card) => ({
    id: randomUUID(),
    pack_id: packId,
    english_phrase: card.en,
    portuguese_translation: card.pt,
    accepted_translations: [],
    audio_url: null,
    created_at: now,
    en: card.en,
    pt: card.pt,
  }))
}

function deduplicateBlitzCards(cards: Array<{ en: string; pt: string }>): Array<{ en: string; pt: string }> {
  const seen = new Set<string>()
  const result: Array<{ en: string; pt: string }> = []

  for (const card of cards) {
    const normalized = card.en.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()

    // Skip exact or near-duplicates
    let isDuplicate = seen.has(normalized)

    if (!isDuplicate) {
      // Check high word overlap with existing
      for (const existing of seen) {
        const wordsA = new Set(normalized.split(' ').filter(Boolean))
        const wordsB = new Set(existing.split(' ').filter(Boolean))
        if (wordsA.size < 3 || wordsB.size < 3) continue
        const overlap = [...wordsA].filter(w => wordsB.has(w)).length
        const ratio = overlap / Math.min(wordsA.size, wordsB.size)
        if (ratio > 0.75) {
          isDuplicate = true
          break
        }
      }
    }

    if (!isDuplicate) {
      seen.add(normalized)
      result.push(card)
    }
  }

  return result
}

export async function getBlitzAiRateStatus(): Promise<{
  limited: boolean
  retryAfterSeconds: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { limited: false, retryAfterSeconds: 0 }

  return peekRateLimit('blitz_ai_generation', user.id, 10)
}

export async function generateBlitzAiPack(
  limit = 32,
  level: LearnerCefrLevel = 'A2'
): Promise<{
  cards: Card[]
  pack: BlitzAiPackDraft | null
  error: string | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cards: [], pack: null, error: 'Não autenticado' }

  if (!isLearnerCefrLevel(level)) {
    return { cards: [], pack: null, error: 'Nível de inglês inválido para o Blitz IA.' }
  }

  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 32, 8), 40)
  const limited = await isRateLimited('blitz_ai_generation', user.id, 10, 24 * 60 * 60)
  if (limited) {
    return {
      cards: [],
      pack: null,
      error: 'Limite diário de gerações do Blitz IA atingido. Tente novamente amanhã.',
    }
  }

  try {
    const content = await createGroqChatCompletion({
      model: AI_MODELS.blitz,
      temperature: 0.75,
      jsonMode: true,
      maxTokens: 4096,
      messages: [
        {
          role: 'system',
          content: 'Você é um professor de inglês especialista em criar materiais de estudo para brasileiros. Sempre gere traduções 100% naturais em português brasileiro (pt-BR). IMPORTANTE: Cada geração para o mesmo nível deve ser completamente original, com máxima variedade estrutural e lexical. Nunca repita frases ou ideias de outras gerações. Retorne apenas JSON válido.',
        },
        { role: 'user', content: buildBlitzAiPrompt(safeLimit, level) },
      ],
    })

    const generatedCards = parseGeneratedCards(content)
    const importAnalysis = analyzeImportCards(generatedCards)
    const validCards = deduplicateBlitzCards(importAnalysis.validCards).slice(0, safeLimit)

    if (validCards.length < 4) {
      return { cards: [], pack: null, error: 'A IA não gerou cards suficientes para o Blitz.' }
    }

    const pack: BlitzAiPackDraft = {
      name: `Blitz IA ${level} - ${getAppDateString()}`,
      description: `Pack efêmero gerado por IA para o nível ${level} (${getCefrLevelLabel(level)}) durante uma partida de Blitz.`,
      level,
      cards: validCards,
    }

    return {
      cards: toBlitzTempCards(validCards),
      pack,
      error: null,
    }
  } catch (error) {
    console.error('Erro ao gerar Blitz IA:', error)
    return { cards: [], pack: null, error: 'Não foi possível gerar o Blitz IA agora.' }
  }
}

export async function saveBlitzAiPack(input: BlitzAiPackDraft, voice?: string) {
  const parsed = SaveBlitzAiPackSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false as const, error: 'Pack gerado inválido.' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false as const, error: 'Não autenticado' }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return { success: false as const, error: 'Serviço temporariamente indisponível para salvar o pack.' }
  }

  const importAnalysis = analyzeImportCards(parsed.data.cards)
  if (importAnalysis.validCards.length < 2) {
    return { success: false as const, error: 'Não há cards suficientes para salvar.' }
  }

  const selectedVoice = parseTtsVoice(voice)

  const { data: pack, error: packError } = await adminSupabase
    .from('packs')
    .insert({
      name: parsed.data.name,
      description: parsed.data.description || null,
      level: parsed.data.level ?? null,
      owner_id: user.id,
      is_public: false,
      category: 'Blitz IA',
    })
    .select('id')
    .single()

  if (packError || !pack) {
    console.error('Erro ao salvar pack do Blitz IA:', packError)
    return { success: false as const, error: 'Não foi possível salvar o pack.' }
  }

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

  const { data: insertedCards, error: cardsError } = await adminSupabase
    .from('cards')
    .insert(cardsToInsert)
    .select('id, english_phrase')

  if (cardsError || !insertedCards || insertedCards.length === 0) {
    console.error('Erro ao salvar cards do Blitz IA:', cardsError)
    await adminSupabase.from('packs').delete().eq('id', pack.id)
    return { success: false as const, error: 'Não foi possível salvar os cards do pack.' }
  }

  // Generate audio for each card (best effort)
  for (const cardRow of insertedCards) {
    try {
      const storagePath = `${cardRow.id}/${randomUUID()}.mp3`
      const audioBuffer = await synthesizeSpeechToBuffer(
        cardRow.english_phrase,
        selectedVoice,
        'kivora-blitz-ai-tts'
      )

      const { data: uploadData, error: uploadError } = await adminSupabase.storage
        .from('card_audios')
        .upload(storagePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (uploadError || !uploadData) {
        console.error('Erro ao subir áudio de card Blitz IA:', uploadError)
        continue
      }

      const { data: { publicUrl } } = adminSupabase.storage
        .from('card_audios')
        .getPublicUrl(uploadData.path)

      await adminSupabase.from('cards').update({ audio_url: publicUrl }).eq('id', cardRow.id)
    } catch (ttsErr) {
      console.error('Erro ao gerar áudio para card Blitz IA:', cardRow.id, ttsErr)
    }
  }

  const { error: assignmentError } = await adminSupabase.from('assignments').insert({
    user_id: user.id,
    pack_id: pack.id,
    game_mode: 'flashcard',
    status: 'pending',
    assigned_date: getAppDateString(),
    assigned_by: 'self',
  })

  if (assignmentError) {
    console.error('Erro ao atribuir pack do Blitz IA:', assignmentError)
    await adminSupabase.from('packs').delete().eq('id', pack.id)
    return { success: false as const, error: 'O pack foi criado, mas não entrou no seu perfil.' }
  }

  revalidatePath('/profile')
  revalidatePath('/home')
  revalidatePath('/study')
  revalidatePath('/review')
  revalidatePath('/blitz')

  return {
    success: true as const,
    packId: pack.id,
    cardCount: insertedCards.length,
  }
}

const BlitzMissReviewSchema = z.object({
  cardIds: z.array(z.string().uuid()).min(1).max(50),
})

export async function queueBlitzMissesForReview(cardIds: string[]) {
  const parsed = BlitzMissReviewSchema.safeParse({ cardIds })
  if (!parsed.success) {
    return { success: false as const, error: 'Nenhum card válido para revisar' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false as const, error: 'Não autenticado' }
  }

  const uniqueCardIds = [...new Set(parsed.data.cardIds)]

  const { data: sessionData, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      user_id: user.id,
      assignment_id: null,
      correct_answers: 0,
      wrong_answers: uniqueCardIds.length,
      max_streak: 0,
    })
    .select('id')
    .single()

  if (sessionError || !sessionData?.id) {
    console.error('Erro ao criar sessão de revisão do Blitz:', sessionError)
    return { success: false as const, error: 'Não foi possível salvar os erros' }
  }

  const now = new Date().toISOString()
  const errorInserts = uniqueCardIds.map((cardId) => ({
    session_id: sessionData.id,
    user_id: user.id,
    card_id: cardId,
    created_at: now,
  }))

  const { error: logsError } = await supabase.from('session_errors').insert(errorInserts)
  if (logsError) {
    console.error('Erro ao salvar erros do Blitz:', logsError)
    return { success: false as const, error: 'Não foi possível registrar os erros' }
  }

  const { data: errorCards } = await supabase
    .from('cards')
    .select('id,pack_id')
    .in('id', uniqueCardIds)

  if (errorCards && errorCards.length > 0) {
    const cardIdsForSrs = errorCards.map((card) => card.id)
    const { data: existingReviews } = await supabase
      .from('card_reviews')
      .select('card_id,interval_days,ease_factor,repetitions,total_reviews,next_review_date')
      .eq('user_id', user.id)
      .in('card_id', cardIdsForSrs)

    type CardReviewRow = {
      card_id: string
      interval_days: number
      ease_factor: number
      repetitions: number
      total_reviews: number
      next_review_date: string
    }
    const existingMap = new Map(
      ((existingReviews as CardReviewRow[] | null) || []).map((row) => [row.card_id, row])
    )
    const reviewNow = new Date()
    const tomorrow = new Date(reviewNow)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { calculateNextReview } = await import('@/features/review/lib/spacedRepetition')

    const srsUpserts = errorCards.flatMap((card: { id: string; pack_id: string }) => {
      const existing = existingMap.get(card.id)

      if (existing) {
        const scheduledFor = new Date(existing.next_review_date)
        if (scheduledFor <= tomorrow) return []
      }

      const previousInterval = existing?.interval_days ?? 0
      const previousEaseFactor = existing?.ease_factor ?? 2.5
      const previousRepetitions = existing?.repetitions ?? 0
      const previousTotalReviews = existing?.total_reviews ?? 0

      const reviewResult =
        previousInterval === 0
          ? { intervalDays: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: reviewNow }
          : calculateNextReview(1, previousInterval, previousEaseFactor, previousRepetitions)

      return [
        {
          user_id: user.id,
          card_id: card.id,
          pack_id: card.pack_id,
          review_date: reviewNow.toISOString(),
          next_review_date: reviewResult.nextReviewDate.toISOString(),
          interval_days: reviewResult.intervalDays,
          ease_factor: reviewResult.easeFactor,
          repetitions: reviewResult.repetitions,
          quality: 1,
          total_reviews: previousTotalReviews + 1,
        },
      ]
    })

    if (srsUpserts.length > 0) {
      const { error: srsError } = await supabase
        .from('card_reviews')
        .upsert(srsUpserts, { onConflict: 'user_id,card_id' })
      if (srsError) {
        console.error('Erro ao sincronizar erros do Blitz com o SRS:', srsError)
      }
    }
  }

  revalidatePath('/review')
  revalidatePath('/home')
  revalidatePath('/problem-words')

  return {
    success: true as const,
    queuedCount: uniqueCardIds.length,
    reviewPath: `/review?source=blitz&cards=${uniqueCardIds.join(',')}`,
  }
}

export async function getUserBlitzBestScore() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data, error } = await supabase
    .from('blitz_runs')
    .select('score')
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && !isBlitzTableMissingError(error)) {
    console.error('Erro ao buscar recorde de Blitz:', error.message)
  }

  return data?.score ?? 0
}

export async function saveBlitzRun(data: {
  score: number
  maxCombo: number
  cardsAnswered: number
  durationMs: number
}) {
  const parsed = BlitzRunSchema.safeParse(data)
  if (!parsed.success) throw new Error('Partida inválida')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { error } = await supabase.from('blitz_runs').insert({
    user_id: user.id,
    score: parsed.data.score,
    max_combo: parsed.data.maxCombo,
    cards_answered: parsed.data.cardsAnswered,
    duration_ms: parsed.data.durationMs,
  })

  if (error) {
    if (isBlitzTableMissingError(error)) {
      console.warn('Tabela blitz_runs ausente. Aplique a migration do Supabase para salvar partidas.')
      return {
        success: false,
        bestScore: parsed.data.score,
        tableMissing: true as const,
      }
    }
    throw new Error(error.message)
  }

  const today = getAppDateString()
  const { data: streakBefore } = await supabase
    .from('user_streaks')
    .select('last_activity_date')
    .eq('user_id', user.id)
    .maybeSingle()

  const wasActiveToday = streakBefore?.last_activity_date === today
  let streakUpdated = false
  let gamification: GamificationResult = { unlockedBadges: [], questsCompleted: [] }

  try {
    await updateStreak(user.id)
    streakUpdated = !wasActiveToday
  } catch (streakError) {
    console.error('Erro ao atualizar streak após Blitz:', streakError)
  }

  try {
    gamification = await evaluateGamification(user.id, {
      type: 'blitz',
      blitzScore: parsed.data.score,
      maxCombo: parsed.data.maxCombo,
    })
  } catch (gamificationError) {
    console.error('Erro na gamificação do Blitz:', gamificationError)
  }

  const bestScore = await getUserBlitzBestScore()
  revalidatePath('/blitz')
  revalidatePath('/blitz/ranking')
  revalidatePath('/home')
  revalidatePath('/social')
  revalidatePath('/profile')
  return {
    success: true,
    bestScore: Math.max(bestScore, parsed.data.score),
    streakUpdated,
    unlockedBadges: gamification.unlockedBadges,
    questsCompleted: gamification.questsCompleted,
  }
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
