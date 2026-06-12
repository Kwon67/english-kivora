import { NextResponse } from 'next/server'
import { z } from 'zod'
import { protectJsonPost } from '@/lib/rateLimit'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GAME_TYPES = [
  'multiple_choice',
  'matching',
  'flashcard',
  'typing',
  'listening',
  'speaking',
] as const

const CreateDuelSchema = z.object({
  opponentId: z.string().uuid(),
  packId: z.string().uuid(),
  gameType: z.enum(GAME_TYPES),
  player1Id: z.string().uuid().optional(),
})

async function getUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, profile: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id,role')
    .eq('id', user.id)
    .single()

  return { supabase, user, profile }
}

export async function POST(request: Request) {
  const protectionResponse = protectJsonPost(request, {
    keyPrefix: 'api:arena:duels',
    limit: 60,
    windowMs: 60_000,
  })
  if (protectionResponse) return protectionResponse

  const body = await request.json().catch(() => null)
  const parsed = CreateDuelSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid duel request' }, { status: 400 })
  }

  const { supabase, user, profile } = await getUserProfile()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const player1Id = parsed.data.player1Id ?? user.id
  const player2Id = parsed.data.opponentId
  const isAdminRequest = player1Id !== user.id

  if (isAdminRequest && profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (player1Id === player2Id) {
    return NextResponse.json({ error: 'Players must be different' }, { status: 400 })
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 })
  }

  const { data: packCards, error: packCardsError } = await supabase
    .from('cards')
    .select('id')
    .eq('pack_id', parsed.data.packId)
    .limit(1)

  if (packCardsError || !packCards || packCards.length === 0) {
    return NextResponse.json({ error: 'Pack unavailable for arena' }, { status: 400 })
  }

  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString()
  const involvedPlayersFilter =
    `player1_id.eq.${player1Id},player2_id.eq.${player1Id},player1_id.eq.${player2Id},player2_id.eq.${player2Id}`

  await adminSupabase
    .from('arena_duels')
    .update({ status: 'cancelled', finished_at: now.toISOString() })
    .eq('status', 'pending')
    .or(involvedPlayersFilter)
    .lt('created_at', fiveMinutesAgo)

  await adminSupabase
    .from('arena_duels')
    .update({ status: 'cancelled', finished_at: now.toISOString() })
    .eq('status', 'active')
    .or(involvedPlayersFilter)
    .lt('created_at', fifteenMinutesAgo)

  const { data: conflictingDuels, error: conflictingError } = await adminSupabase
    .from('arena_duels')
    .select('id')
    .in('status', ['pending', 'active'])
    .or(involvedPlayersFilter)
    .gte('created_at', fiveMinutesAgo)
    .limit(1)

  if (conflictingError) {
    console.error('Arena conflict check failed', { userId: user.id, conflictingError })
    return NextResponse.json({ error: 'Unable to validate duel' }, { status: 500 })
  }

  if (conflictingDuels && conflictingDuels.length > 0) {
    return NextResponse.json({ error: 'One player is already in another duel' }, { status: 409 })
  }

  const { data: duel, error } = await adminSupabase
    .from('arena_duels')
    .insert({
      player1_id: player1Id,
      player2_id: player2Id,
      pack_id: parsed.data.packId,
      game_type: parsed.data.gameType,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error || !duel) {
    console.error('Arena duel create failed', { userId: user.id, error })
    return NextResponse.json({ error: 'Unable to create duel' }, { status: 500 })
  }

  return NextResponse.json({ success: true, duelId: duel.id })
}
