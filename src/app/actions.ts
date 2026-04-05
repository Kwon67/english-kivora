'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
  pack_id: z.string().uuid(),
  en: z.string().min(1, 'Inglês é obrigatório'),
  pt: z.string().min(1, 'Português é obrigatório'),
  order_index: z.number().int().default(0),
})

const AssignmentSchema = z.object({
  user_id: z.string(),
  pack_id: z.string().uuid(),
  game_mode: z.enum(['multiple_choice', 'flashcard', 'typing', 'matching']),
  assigned_date: z.string().optional(),
})

export async function loginAction(formData: FormData) {
  try {
    console.log('Login action started')
    console.log('ENV check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) + '...',
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'exists' : 'missing'
    })
    
    const supabase = await createClient()
    console.log('Supabase client created')

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Email e senha são obrigatórios' }
    }

    console.log('Attempting login for:', email)
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Login error:', error.message)
      return { error: error.message }
    }

    if (!data.user) {
      return { error: 'Erro ao obter dados do usuário' }
    }

    console.log('Login successful, checking profile')
    // Check user role
    const { data: profile, error: profileError } = await supabase
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
  } catch (err: any) {
    console.error('Unexpected error in loginAction:', err?.message || err)
    return { error: 'Erro inesperado no servidor: ' + (err?.message || 'Unknown') }
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
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Save game session
  const { error: sessionError } = await supabase.from('game_sessions').insert({
    user_id: user.id,
    pack_id: data.packId,
    assignment_id: data.assignmentId,
    correct_answers: data.correct,
    wrong_answers: data.wrong,
    max_streak: data.streakMax,
  })

  if (sessionError) throw new Error(sessionError.message)

  // Mark assignment as completed
  const { error: updateError } = await supabase
    .from('daily_assignments')
    .update({ status: 'completed' })
    .eq('id', data.assignmentId)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/home')
  revalidatePath('/history')
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

  const { error } = await supabase.from('packs').insert({
    name: validated.data.name,
    description: validated.data.description || null,
    level: validated.data.level || null,
  })

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

  const { error } = await supabase
    .from('packs')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
      level: validated.data.level || null,
    })
    .eq('id', id)

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

  const validated = AssignmentSchema.safeParse({
    user_id: formData.get('user_id'),
    pack_id: formData.get('pack_id'),
    game_mode: formData.get('game_mode'),
    assigned_date: formData.get('assigned_date'),
  })

  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const { user_id, pack_id, game_mode, assigned_date } = validated.data
  const now = new Date()
  const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const finalDate = assigned_date || localDate

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
    }))

    const { error } = await supabase.from('assignments').insert(assignments)

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('assignments').insert({
      user_id,
      pack_id,
      game_mode,
      assigned_date: finalDate,
    })

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/assign')
  revalidatePath('/home')
  return { success: true }
}
