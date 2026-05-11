import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

async function getAuthorizedDuel(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, duel: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: duel, error } = await supabase
    .from('arena_duels')
    .select('id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at,player1_score,player2_score,player1_wrong,player2_wrong,game_type,pack_id')
    .eq('id', id)
    .single()

  if (error || !duel) {
    return {
      supabase,
      user,
      duel: null,
      error: NextResponse.json({ error: error?.message || 'Duelo não encontrado' }, { status: 404 }),
    }
  }

  if (duel.player1_id !== user.id && duel.player2_id !== user.id) {
    return {
      supabase,
      user,
      duel: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { supabase, user, duel, error: null }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const { duel, error } = await getAuthorizedDuel(id)

  if (error || !duel) {
    return error ?? NextResponse.json({ error: 'Duelo não encontrado' }, { status: 404 })
  }

  return NextResponse.json(duel)
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const { supabase, user, duel, error } = await getAuthorizedDuel(id)

  if (error || !user || !duel) {
    return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as
    | { action?: 'finish' | 'cancel'; score?: number; wrong?: number; events?: Array<{ timeMs: number, correct: boolean }> }
    | null

  if (body?.action === 'finish') {
    const scoreField = user.id === duel.player1_id ? 'player1_score' : 'player2_score'
    const wrongField = user.id === duel.player1_id ? 'player1_wrong' : 'player2_wrong'
    const eventsField = user.id === duel.player1_id ? 'player1_events' : 'player2_events'
    
    // Agora todos os modos de jogo enviam o score a partir do cliente
    const finalScore = Number.isFinite(body.score)
      ? Math.max(0, Math.trunc(body.score ?? 0))
      : 0
    const finalWrong = Number.isFinite(body.wrong)
      ? Math.max(0, Math.trunc(body.wrong ?? 0))
      : 0

    if (duel.status !== 'finished') {
      const updatePayload: Record<string, unknown> = {
        status: 'finished',
        winner_id: user.id,
        finished_at: new Date().toISOString(),
        [scoreField]: finalScore,
        [wrongField]: finalWrong,
      }
      if (Array.isArray(body.events)) updatePayload[eventsField] = body.events

      await supabase
        .from('arena_duels')
        .update(updatePayload)
        .eq('id', id)
        .eq('status', 'active')

      // Record Ghost Performance if it's a high score
      if (Array.isArray(body.events) && body.events.length > 0) {
        try {
          const { data: existingGhost } = await supabase
            .from('arena_ghost_recordings')
            .select('id, score')
            .eq('user_id', user.id)
            .eq('pack_id', duel.pack_id)
            .eq('game_type', duel.game_type)
            .maybeSingle()

          if (!existingGhost || finalScore > (existingGhost.score || 0)) {
            await supabase
              .from('arena_ghost_recordings')
              .upsert({
                user_id: user.id,
                pack_id: duel.pack_id,
                game_type: duel.game_type,
                score: finalScore,
                wrong_count: finalWrong,
                events: body.events
              }, { onConflict: 'user_id,pack_id,game_type' })
          }
        } catch (ghostErr) {
          console.error('Failed to record ghost:', ghostErr)
        }
      }
    } else {
      const updatePayload: Record<string, unknown> = {
        [scoreField]: finalScore,
        [wrongField]: finalWrong,
      }
      if (Array.isArray(body.events)) updatePayload[eventsField] = body.events

      await supabase
        .from('arena_duels')
        .update(updatePayload)
        .eq('id', id)
    }
  } else if (body?.action === 'cancel') {
    if (duel.status === 'pending') {
      await supabase
        .from('arena_duels')
        .update({
          status: 'cancelled',
          finished_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'pending')
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  // Return the updated duel state
  const { data: updatedDuel } = await supabase
    .from('arena_duels')
    .select('id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at,player1_score,player2_score,player1_wrong,player2_wrong,game_type')
    .eq('id', id)
    .single()

  if (!updatedDuel) {
    return NextResponse.json({ error: 'Duelo não encontrado' }, { status: 404 })
  }

  return NextResponse.json(updatedDuel)
}
