'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isAssignmentCompleted } from '@/features/game/lib/assignmentStatus'
import { isPlayableGameMode } from '@/features/game/lib/gameModes'
import { createClient } from '@/lib/supabase/server'
import { getAppDateString } from '@/lib/timezone'

const MemberSelfAssignSchema = z.object({
  packId: z.string().uuid('Pack inválido'),
  gameMode: z.enum([
    'multiple_choice',
    'flashcard',
    'typing',
    'matching',
    'listening',
    'speaking',
  ]),
})

type ActionResult =
  | { success: true; assignmentId: string }
  | { success: false; error: string }

type RemoveResult =
  | { success: true }
  | { success: false; error: string }

export async function selfAssignPackAction(input: {
  packId: string
  gameMode: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado' }
  }

  const validated = MemberSelfAssignSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message || 'Dados inválidos' }
  }

  const { packId, gameMode } = validated.data
  if (!isPlayableGameMode(gameMode)) {
    return { success: false, error: 'Modo de jogo inválido' }
  }

  const { data: pack, error: packError } = await supabase
    .from('packs')
    .select('id,is_public,owner_id')
    .eq('id', packId)
    .maybeSingle()

  if (packError || !pack) {
    return { success: false, error: 'Pack não encontrado' }
  }

  const isOwner = pack.owner_id === user.id
  const isPublic = pack.is_public !== false
  if (!isPublic && !isOwner) {
    return { success: false, error: 'Você não tem acesso a este pack' }
  }

  const today = getAppDateString()
  const assignmentPayload = {
    user_id: user.id,
    pack_id: packId,
    game_mode: gameMode,
    status: 'pending',
    assigned_date: today,
    assigned_by: 'self' as const,
    reward_badge_id: null,
  }

  const { data: existingAssignment } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('pack_id', packId)
    .eq('game_mode', gameMode)
    .eq('assigned_date', today)
    .maybeSingle()

  const { data, error } = existingAssignment
    ? await supabase
        .from('assignments')
        .update({
          status: 'pending',
          assigned_by: 'self',
          reward_badge_id: null,
        })
        .eq('id', existingAssignment.id)
        .eq('user_id', user.id)
        .select('id')
        .single()
    : await supabase.from('assignments').insert(assignmentPayload).select('id').single()

  if (error || !data) {
    const message = error?.message || ''
    const rlsBlocked = message.toLowerCase().includes('row-level security')
    return {
      success: false,
      error: rlsBlocked
        ? 'Não foi possível iniciar a sessão. Atualize a página e tente de novo.'
        : message || 'Não foi possível adicionar o pack à rotina',
    }
  }

  revalidatePath('/home')
  revalidatePath('/explore')
  revalidatePath('/study')
  revalidatePath(`/explore/pack/${packId}`)

  return { success: true, assignmentId: data.id }
}

export async function removeSelfAssignmentAction(assignmentId: string): Promise<RemoveResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Não autenticado' }
  }

  const { data: assignment, error: lookupError } = await supabase
    .from('assignments')
    .select('id,assigned_by,status')
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (lookupError || !assignment) {
    return { success: false, error: 'Atividade não encontrada' }
  }

  if (assignment.assigned_by !== 'self') {
    return {
      success: false,
      error: 'Esta atividade foi atribuída pelo admin e não pode ser removida.',
    }
  }

  if (isAssignmentCompleted(assignment.status)) {
    return { success: false, error: 'Atividades concluídas não podem ser removidas.' }
  }

  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('user_id', user.id)
    .eq('assigned_by', 'self')

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/home')
  revalidatePath('/explore')
  revalidatePath('/study')

  return { success: true }
}