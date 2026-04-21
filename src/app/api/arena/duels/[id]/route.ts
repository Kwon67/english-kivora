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
    .select('id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at')
    .eq('id', id)
    .single()

  if (error || !duel) {
    return {
      supabase,
      user,
      duel: null,
      error: NextResponse.json({ error: error?.message || 'Duel not found' }, { status: 404 }),
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

async function maybeActivateDuel(supabase: Awaited<ReturnType<typeof createClient>>, duelId: string) {
  const { data: duel } = await supabase
    .from('arena_duels')
    .select('id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at')
    .eq('id', duelId)
    .single()

  if (
    duel &&
    duel.status === 'pending' &&
    duel.player1_joined_at &&
    duel.player2_joined_at
  ) {
    await supabase
      .from('arena_duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', duelId)
      .eq('status', 'pending')
  }

  const { data: refreshedDuel, error } = await supabase
    .from('arena_duels')
    .select('id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at')
    .eq('id', duelId)
    .single()

  if (error || !refreshedDuel) {
    return null
  }

  return refreshedDuel
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const { supabase, error } = await getAuthorizedDuel(id)

  if (error) {
    return error
  }

  const duel = await maybeActivateDuel(supabase, id)

  if (!duel) {
    return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
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
    | { action?: 'finish' | 'cancel' }
    | null

  if (body?.action === 'finish') {
    if (duel.status !== 'finished') {
      await supabase
        .from('arena_duels')
        .update({
          status: 'finished',
          winner_id: user.id,
          finished_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'active')
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

  const updatedDuel = await maybeActivateDuel(supabase, id)

  if (!updatedDuel) {
    return NextResponse.json({ error: 'Duel not found' }, { status: 404 })
  }

  return NextResponse.json(updatedDuel)
}
