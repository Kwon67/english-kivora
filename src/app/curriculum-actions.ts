'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  getCefrLevelWeight,
  isLearnerCefrLevel,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'
import {
  EXAM_ATTEMPT_RESUME_MINUTES,
  getExamCooldownMinutes,
  getNextCurriculumLevel,
} from '@/features/curriculum/lib/curriculum'
import { getCurriculumState } from '@/features/curriculum/lib/curriculumState'
import {
  buildLevelExam,
  gradeLevelExam,
  toPublicQuestion,
  type ExamReviewItem,
  type KeyedExamQuestion,
  type PublicExamQuestion,
} from '@/features/curriculum/lib/levelExam'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { getModesForLevel } from '@/features/study/lib/dailyPlan'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { getAppDateString } from '@/lib/timezone'
import { logger } from '@/lib/logger'

type Failure = { success: false; error: string }

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

/**
 * Abre um pack do currículo a partir de uma bolinha da trilha.
 *
 * O catálogo não é auto-atribuível pelo membro (RLS, currículo guiado), então quem cria a linha é
 * o service role — mas só depois de conferir as duas regras que importam: o pack é do catálogo
 * público, e o nível dele não passa do nível atual do aluno. Um POST forjado pedindo um pack do
 * B1 para quem ainda não passou na prova do A1 é recusado aqui, não só escondido na interface.
 *
 * O modo gira a cada vez que o pack é estudado (flashcard primeiro, para conhecer as frases), de
 * modo que refazer um pack treina uma habilidade diferente em vez de repetir o mesmo exercício.
 */
export async function startCurriculumPackAction(
  packId: string
): Promise<{ success: true; assignmentId: string } | Failure> {
  if (!z.string().uuid().safeParse(packId).success) return { success: false, error: 'Lição inválida' }

  const userId = await requireUserId()
  if (!userId) return { success: false, error: 'Não autenticado' }

  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'Não foi possível abrir a lição agora.' }

  const [{ data: pack }, state] = await Promise.all([
    admin.from('packs').select('id,level,is_public').eq('id', packId).maybeSingle(),
    getCurriculumState(userId),
  ])

  if (!pack || pack.is_public !== true) return { success: false, error: 'Lição não encontrada' }

  const packLevel = normalizePackLevel(pack.level)
  if (getCefrLevelWeight(packLevel) > getCefrLevelWeight(state.currentLevel)) {
    return {
      success: false,
      error: `Esta lição é do ${packLevel}. Passe na prova do ${state.currentLevel} para liberar.`,
    }
  }

  const { data: history } = await admin
    .from('assignments')
    .select('id,status,game_mode,assigned_date')
    .eq('user_id', userId)
    .eq('pack_id', packId)

  const rows = history || []
  const pending = rows
    .filter((row) => !isAssignmentCompleted(row.status))
    .sort((a, b) => (a.assigned_date < b.assigned_date ? -1 : 1))[0]
  if (pending) return { success: true, assignmentId: pending.id }

  const modes = getModesForLevel(packLevel)
  const timesCompleted = rows.filter((row) => isAssignmentCompleted(row.status)).length
  const gameMode = modes[timesCompleted % modes.length]
  const today = getAppDateString()

  // UNIQUE (user_id, assigned_date, pack_id, game_mode): se já existe a linha de hoje (concluída),
  // reabre em vez de falhar no insert.
  const existingToday = rows.find((row) => row.assigned_date === today && row.game_mode === gameMode)
  const { data, error } = existingToday
    ? await admin
        .from('assignments')
        .update({ status: 'pending' })
        .eq('id', existingToday.id)
        .eq('user_id', userId)
        .select('id')
        .single()
    : await admin
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
    logger.error('Failed to start curriculum pack', { userId, packId, error })
    return { success: false, error: 'Não foi possível abrir a lição agora.' }
  }

  revalidatePath('/home')
  return { success: true, assignmentId: data.id }
}

export type StartExamResult =
  | { success: true; attemptId: string; questions: PublicExamQuestion[] }
  | (Failure & { cooldownMinutes?: number })

/**
 * Começa (ou retoma) a prova final do nível ATUAL do aluno.
 *
 * Retomar uma tentativa aberta em vez de sortear outra fecha o atalho de recarregar a página até
 * cair uma prova fácil. Só o nível atual pode ser prestado: não há prova do B1 para quem ainda não
 * passou no A1, e refazer a de um nível já aprovado não muda nada.
 */
export async function startLevelExamAction(level: string): Promise<StartExamResult> {
  if (!isLearnerCefrLevel(level)) return { success: false, error: 'Nível inválido' }

  const userId = await requireUserId()
  if (!userId) return { success: false, error: 'Não autenticado' }

  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'A prova está indisponível agora.' }

  const state = await getCurriculumState(userId)
  if (level !== state.currentLevel) {
    return {
      success: false,
      error: state.passed.has(level)
        ? `Você já foi aprovado no ${level}.`
        : `Faça primeiro a prova do ${state.currentLevel}.`,
    }
  }

  const cooldownMinutes = getExamCooldownMinutes(state.lastFailedAt)
  if (cooldownMinutes > 0) {
    return {
      success: false,
      error: `Revise um pouco e tente de novo em ${cooldownMinutes} min.`,
      cooldownMinutes,
    }
  }

  const resumeSince = new Date(Date.now() - EXAM_ATTEMPT_RESUME_MINUTES * 60_000).toISOString()
  const { data: open } = await admin
    .from('level_exam_attempts')
    .select('id,questions')
    .eq('user_id', userId)
    .eq('level', level)
    .is('submitted_at', null)
    .gte('started_at', resumeSince)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (open) {
    const questions = open.questions as unknown as KeyedExamQuestion[]
    return { success: true, attemptId: open.id, questions: questions.map(toPublicQuestion) }
  }

  const { data: cardRows, error: cardsError } = await admin
    .from('cards')
    .select('id,pack_id,english_phrase,portuguese_translation,packs!inner(level,is_public)')
    .eq('packs.level', level)
    .eq('packs.is_public', true)
    .limit(5000)

  if (cardsError) {
    logger.error('Failed to load exam cards', { userId, level, error: cardsError })
    return { success: false, error: 'Não foi possível montar a prova agora.' }
  }

  const questions = buildLevelExam(
    (cardRows || []).flatMap((row) => row.pack_id ? [{
      id: row.id,
      packId: row.pack_id,
      en: row.english_phrase ?? '',
      pt: row.portuguese_translation ?? '',
    }] : [])
  )

  if (questions.length < 10) {
    return { success: false, error: 'Ainda não há conteúdo suficiente para a prova deste nível.' }
  }

  const { data: attempt, error } = await admin
    .from('level_exam_attempts')
    .insert({ user_id: userId, level, questions: questions as unknown as never, total: questions.length })
    .select('id')
    .single()

  if (error || !attempt) {
    logger.error('Failed to create exam attempt', { userId, level, error })
    return { success: false, error: 'Não foi possível começar a prova agora.' }
  }

  return { success: true, attemptId: attempt.id, questions: questions.map(toPublicQuestion) }
}

export type SubmitExamResult =
  | {
      success: true
      score: number
      total: number
      passed: boolean
      level: LearnerCefrLevel
      nextLevel: LearnerCefrLevel | null
      review: ExamReviewItem[]
      /** Packs onde houve erro, para o aluno saber o que revisar. */
      weakPacks: { id: string; name: string }[]
    }
  | Failure

const AnswersSchema = z.record(z.string().max(40), z.string().max(500))

export async function submitLevelExamAction(
  attemptId: string,
  answers: Record<string, string>
): Promise<SubmitExamResult> {
  if (!z.string().uuid().safeParse(attemptId).success) return { success: false, error: 'Prova inválida' }
  const parsedAnswers = AnswersSchema.safeParse(answers)
  if (!parsedAnswers.success) return { success: false, error: 'Respostas inválidas' }

  const userId = await requireUserId()
  if (!userId) return { success: false, error: 'Não autenticado' }

  const admin = createAdminClient()
  if (!admin) return { success: false, error: 'A prova está indisponível agora.' }

  const { data: attempt } = await admin
    .from('level_exam_attempts')
    .select('id,level,questions,submitted_at')
    .eq('id', attemptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!attempt || !isLearnerCefrLevel(attempt.level)) return { success: false, error: 'Prova não encontrada' }
  if (attempt.submitted_at) return { success: false, error: 'Esta prova já foi entregue.' }

  const questions = attempt.questions as unknown as KeyedExamQuestion[]
  const result = gradeLevelExam(questions, parsedAnswers.data)

  // `.is('submitted_at', null)` torna a entrega idempotente: dois envios simultâneos não gravam
  // duas notas para a mesma tentativa.
  const { data: saved, error } = await admin
    .from('level_exam_attempts')
    .update({
      answers: parsedAnswers.data,
      score: result.score,
      passed: result.passed,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', userId)
    .is('submitted_at', null)
    .select('id')
    .maybeSingle()

  if (error || !saved) {
    logger.error('Failed to save exam result', { userId, attemptId, error })
    return { success: false, error: 'Não foi possível salvar sua prova. Tente de novo.' }
  }

  const weakPackIds = [...new Set(result.review.filter((item) => !item.correct).map((item) => item.packId))]
  const { data: weakPacks } = weakPackIds.length
    ? await admin.from('packs').select('id,name').in('id', weakPackIds)
    : { data: [] }

  revalidatePath('/home')

  return {
    success: true,
    score: result.score,
    total: result.total,
    passed: result.passed,
    level: attempt.level,
    nextLevel: getNextCurriculumLevel(attempt.level),
    review: result.review,
    weakPacks: (weakPacks || []).map((pack) => ({ id: pack.id, name: pack.name })),
  }
}
