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
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  // Save game session
  const { error: sessionError } = await supabase.from('game_sessions').insert({
    user_id: user.id,
    assignment_id: data.assignmentId,
    correct_answers: data.correct,
    wrong_answers: data.wrong,
    max_streak: data.streakMax,
  })

  if (sessionError) throw new Error(sessionError.message)

  // Mark assignment as completed
  const { error: updateError } = await supabase
    .from('assignments')
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

    const { error } = await supabase.from('assignments').upsert(assignments, { onConflict: 'user_id,assigned_date,pack_id' })

    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('assignments').upsert({
      user_id,
      pack_id,
      game_mode,
      assigned_date: finalDate,
    }, { onConflict: 'user_id,assigned_date,pack_id' })

    if (error) return { error: error.message }
  }

  revalidatePath('/admin/assign')
  revalidatePath('/home')
  return { success: true }
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

export async function createMember(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado')

  const username = (formData.get('username') as string || '').trim().toLowerCase()
  const password = (formData.get('password') as string || '').trim()

  if (!username || username.length < 3) return { error: 'Username deve ter pelo menos 3 caracteres' }
  if (!password || password.length < 6) return { error: 'Senha deve ter pelo menos 6 caracteres' }
  if (!/^[a-z0-9_]+$/.test(username)) return { error: 'Username só pode conter letras, números e _' }

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { error: 'Sessão inválida' }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-manage-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ action: 'create', username, password }),
    }
  )

  const json = await res.json()
  if (!res.ok || json.error) return { error: json.error || 'Erro ao criar membro' }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteMember(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Acesso negado')

  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { error: 'Sessão inválida' }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-manage-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ action: 'delete', userId }),
    }
  )

  const json = await res.json()
  if (!res.ok || json.error) return { error: json.error || 'Erro ao remover membro' }

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
      total_reviews: data.previousInterval !== undefined 
        ? supabase.rpc('increment', { row_id: data.cardId })
        : 1
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
  if (!user) return { dueCards: [], totalDue: 0 }

  const now = new Date().toISOString()

  // Get cards that are due for review
  const { data: dueReviews, error: reviewsError } = await supabase
    .from('card_reviews')
    .select('*, cards(*), packs(*)')
    .eq('user_id', user.id)
    .lte('next_review_date', now)
    .order('next_review_date', { ascending: true })

  if (reviewsError) {
    console.error('Error fetching due cards:', reviewsError)
    return { dueCards: [], totalDue: 0 }
  }

  // Get new cards (cards that haven't been reviewed yet)
  const { data: newCards, error: newCardsError } = await supabase
    .from('cards')
    .select('*, packs(*)')
    .not('id', 'in', 
      supabase
        .from('card_reviews')
        .select('card_id')
        .eq('user_id', user.id)
    )
    .limit(20)

  if (newCardsError) {
    console.error('Error fetching new cards:', newCardsError)
  }

  // Combine due reviews with new cards
  const dueCards = [
    ...(dueReviews || []),
    ...(newCards || []).map(card => ({
      ...card,
      isNew: true,
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0
    }))
  ]

  return { dueCards, totalDue: dueCards.length }
}

export async function getReviewStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const now = new Date().toISOString()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString()

  // Cards due today
  const { count: dueToday } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .lte('next_review_date', now)

  // Cards due tomorrow
  const { count: dueTomorrow } = await supabase
    .from('card_reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gt('next_review_date', now)
    .lte('next_review_date', tomorrowStr)

  // New cards (never reviewed)
  const { count: newCards } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .not('id', 'in', 
      supabase
        .from('card_reviews')
        .select('card_id')
        .eq('user_id', user.id)
    )

  // Total reviews made
  const { data: reviewStats } = await supabase
    .from('card_reviews')
    .select('total_reviews')
    .eq('user_id', user.id)

  const totalReviews = reviewStats?.reduce((sum, r) => sum + (r.total_reviews || 0), 0) || 0

  return {
    dueToday: dueToday || 0,
    dueTomorrow: dueTomorrow || 0,
    newCards: newCards || 0,
    totalReviews
  }
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

