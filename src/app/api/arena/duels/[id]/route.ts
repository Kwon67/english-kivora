import { NextResponse } from 'next/server'
import { z } from 'zod'
import { countArenaEvents, inferArenaProgress, resolveArenaWinner } from '@/features/arena/lib/duel'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const duelResponseSelect =
  'id,status,winner_id,player1_id,player2_id,player1_joined_at,player2_joined_at,player1_score,player2_score,player1_wrong,player2_wrong,player1_events,player2_events,started_at,game_type,pack_id,is_ghost'

type RouteContext = {
  params: Promise<{ id: string }>
}


const DuelIdSchema = z.string().uuid()

const ArenaEventSchema = z.object({
  timeMs: z.number().int().min(0).max(10 * 60 * 1000),
  correct: z.boolean(),
})

const DuelPostSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('heartbeat') }),
  z.object({ action: z.literal('leave') }),
  z.object({ action: z.literal('activate') }),
  z.object({ action: z.literal('cancel') }),
  z.object({
    action: z.literal('score'),
    score: z.number().int().min(0).max(500),
    wrong: z.number().int().min(0).max(500),
  }),
  z.object({
    action: z.literal('finish'),
    score: z.number().int().min(0).max(500),
    wrong: z.number().int().min(0).max(500),
    progress: z.number().int().min(0).max(500).optional(),
    events: z.array(ArenaEventSchema).max(500).optional(),
  }),
])

function isHeartbeatFresh(heartbeat: string | null) {
  if (!heartbeat) return false
  return Date.now() - new Date(heartbeat).getTime() < 10_000
}

async function getAuthorizedDuel(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
      duel: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: duel, error } = await supabase
    .from('arena_duels')
    .select(duelResponseSelect)
    .eq('id', id)
    .single()

  if (error || !duel) {
    return {
      supabase,
      user,
      profile,
      duel: null,
      error: NextResponse.json({ error: 'Duelo não encontrado' }, { status: 404 }),
    }
  }

  if (duel.player1_id !== user.id && duel.player2_id !== user.id && profile?.role !== 'admin') {
    return {
      supabase,
      user,
      profile,
      duel: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { supabase, user, profile, duel, error: null }
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!DuelIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid duel id' }, { status: 400 })
  }

  const { duel, error } = await getAuthorizedDuel(id)

  if (error || !duel) {
    return error ?? NextResponse.json({ error: 'Duelo não encontrado' }, { status: 404 })
  }

  return NextResponse.json(duel)
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  if (!DuelIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'Invalid duel id' }, { status: 400 })
  }

  const { supabase, user, profile, duel, error } = await getAuthorizedDuel(id)

  if (error || !user || !duel) {
    return error ?? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = DuelPostSchema.safeParse(await request.json().catch(() => null))
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const body = parsedBody.data
  const writeSupabase = createAdminClient()
  if (!writeSupabase) {
    return NextResponse.json({ error: 'Falha ao preparar a atualização do duelo.' }, { status: 500 })
  }

  const isParticipant = duel.player1_id === user.id || duel.player2_id === user.id
  if (!isParticipant && body.action !== 'cancel' && body.action !== 'activate') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.action === 'heartbeat') {
    const joinField = user.id === duel.player1_id ? 'player1_joined_at' : 'player2_joined_at'
    const { error: heartbeatError } = await writeSupabase
      .from('arena_duels')
      .update({ [joinField]: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['pending', 'active'])

    if (heartbeatError) {
      console.error('Arena heartbeat failed', { duelId: id, userId: user.id, heartbeatError })
      return NextResponse.json({ error: 'Falha ao atualizar presença.' }, { status: 500 })
    }
  } else if (body.action === 'leave') {
    const leftField = user.id === duel.player1_id ? 'player1_left_at' : 'player2_left_at'
    const { error: leaveError } = await writeSupabase
      .from('arena_duels')
      .update({ [leftField]: new Date().toISOString() })
      .eq('id', id)
      .in('status', ['pending', 'active'])

    if (leaveError) {
      console.error('Arena leave update failed', { duelId: id, userId: user.id, leaveError })
      return NextResponse.json({ error: 'Falha ao atualizar saída.' }, { status: 500 })
    }
  } else if (body.action === 'activate') {
    const player1Ready = isHeartbeatFresh(duel.player1_joined_at)
    const player2Ready = isHeartbeatFresh(duel.player2_joined_at)
    const ghostReady = Boolean(duel.is_ghost && countArenaEvents(duel.player1_events) + countArenaEvents(duel.player2_events) > 0)

    if (duel.status !== 'pending' || (!ghostReady && (!player1Ready || !player2Ready))) {
      return NextResponse.json({ error: 'Duelo ainda não pode ser ativado.' }, { status: 409 })
    }

    const startedAt = new Date(Date.now() + 3000).toISOString()
    const { error: activateError } = await writeSupabase
      .from('arena_duels')
      .update({ status: 'active', started_at: startedAt })
      .eq('id', id)
      .eq('status', 'pending')

    if (activateError) {
      console.error('Arena activation failed', { duelId: id, userId: user.id, activateError })
      return NextResponse.json({ error: 'Falha ao ativar o duelo.' }, { status: 500 })
    }
  } else if (body.action === 'score') {
    const scoreField = user.id === duel.player1_id ? 'player1_score' : 'player2_score'
    const wrongField = user.id === duel.player1_id ? 'player1_wrong' : 'player2_wrong'

    const { error: scoreError } = await writeSupabase
      .from('arena_duels')
      .update({ [scoreField]: body.score, [wrongField]: body.wrong })
      .eq('id', id)
      .eq('status', 'active')

    if (scoreError) {
      console.error('Arena score update failed', { duelId: id, userId: user.id, scoreError })
      return NextResponse.json({ error: 'Falha ao atualizar pontuação.' }, { status: 500 })
    }
  } else if (body.action === 'finish') {
    const scoreField = user.id === duel.player1_id ? 'player1_score' : 'player2_score'
    const wrongField = user.id === duel.player1_id ? 'player1_wrong' : 'player2_wrong'
    const eventsField = user.id === duel.player1_id ? 'player1_events' : 'player2_events'
    const finalScore = body.score
    const finalWrong = body.wrong
    const finalProgress = inferArenaProgress({
      explicitProgress: body.progress,
      events: body.events,
      score: finalScore,
    })
    const opponentFinalScore = user.id === duel.player1_id ? duel.player2_score : duel.player1_score
    const opponentFinalWrong = user.id === duel.player1_id ? duel.player2_wrong : duel.player1_wrong
    const opponentFinalProgress =
      user.id === duel.player1_id
        ? inferArenaProgress({ events: duel.player2_events, score: duel.player2_score })
        : inferArenaProgress({ events: duel.player1_events, score: duel.player1_score })
    const { count: packCardCount } = duel.pack_id
      ? await supabase
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('pack_id', duel.pack_id)
      : { count: null }
    const targetProgress = Math.max(1, Math.min(packCardCount ?? 10, 10))
    const player1FinalScore = user.id === duel.player1_id ? finalScore : opponentFinalScore
    const player2FinalScore = user.id === duel.player2_id ? finalScore : opponentFinalScore
    const player1FinalWrong = user.id === duel.player1_id ? finalWrong : opponentFinalWrong
    const player2FinalWrong = user.id === duel.player2_id ? finalWrong : opponentFinalWrong
    const player1FinalProgress = user.id === duel.player1_id ? finalProgress : opponentFinalProgress
    const player2FinalProgress = user.id === duel.player2_id ? finalProgress : opponentFinalProgress
    const completionWinnerId =
      player1FinalProgress >= targetProgress && player2FinalProgress < targetProgress
        ? duel.player1_id
        : player2FinalProgress >= targetProgress && player1FinalProgress < targetProgress
          ? duel.player2_id
          : null
    const finalWinnerId = completionWinnerId ?? resolveArenaWinner({
      player1Id: duel.player1_id,
      player2Id: duel.player2_id,
      player1Score: player1FinalScore,
      player2Score: player2FinalScore,
      player1Progress: player1FinalProgress,
      player2Progress: player2FinalProgress,
      player1Wrong: player1FinalWrong,
      player2Wrong: player2FinalWrong,
    })

    if (duel.status !== 'finished') {
      const updatePayload: Record<string, unknown> = {
        status: 'finished',
        winner_id: finalWinnerId,
        finished_at: new Date().toISOString(),
        [scoreField]: finalScore,
        [wrongField]: finalWrong,
      }
      if (Array.isArray(body.events)) updatePayload[eventsField] = body.events

      const { data: finishedDuel, error: finishError } = await writeSupabase
        .from('arena_duels')
        .update(updatePayload)
        .eq('id', id)
        .eq('status', 'active')
        .select(duelResponseSelect)
        .maybeSingle()

      if (finishError) {
        console.error('Arena finish update failed', { duelId: id, userId: user.id, finishError })
        return NextResponse.json({ error: 'Falha ao finalizar o duelo.' }, { status: 500 })
      }

      // finishedDuel is null when the other player already finished first (race condition).
      // In this case, fall through to save our score on the already-finished duel, but DO NOT overwrite the winner_id.
      if (!finishedDuel) {
        const scoreUpdatePayload: Record<string, unknown> = {
          [scoreField]: finalScore,
          [wrongField]: finalWrong,
        }
        if (Array.isArray(body.events)) scoreUpdatePayload[eventsField] = body.events

        const { error: raceScoreError } = await writeSupabase
          .from('arena_duels')
          .update(scoreUpdatePayload)
          .eq('id', id)

        if (raceScoreError) {
          console.error('Arena race-condition score update failed', { duelId: id, userId: user.id, raceScoreError })
        }
      }

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
            const ghostWriteSupabase = writeSupabase as unknown as typeof supabase
            await ghostWriteSupabase
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
      // Duel is already finished. Just update the late-finisher's stats. DO NOT overwrite winner_id.
      const updatePayload: Record<string, unknown> = {
        [scoreField]: finalScore,
        [wrongField]: finalWrong,
      }
      if (Array.isArray(body.events)) updatePayload[eventsField] = body.events

      if (Object.keys(updatePayload).length > 0) {
        const { error: scoreUpdateError } = await writeSupabase
          .from('arena_duels')
          .update(updatePayload)
          .eq('id', id)

        if (scoreUpdateError) {
          console.error('Arena finished score update failed', { duelId: id, userId: user.id, scoreUpdateError })
          return NextResponse.json({ error: 'Falha ao atualizar o resultado do duelo.' }, { status: 500 })
        }
      }
    }
  } else if (body.action === 'cancel') {
    if (duel.status === 'pending' || isParticipant || profile?.role === 'admin') {
      const { error: cancelError } = await writeSupabase
        .from('arena_duels')
        .update({
          status: 'cancelled',
          finished_at: new Date().toISOString(),
        })
        .eq('id', id)
        .in('status', ['pending', 'active'])

      if (cancelError) {
        console.error('Arena cancel update failed', { duelId: id, userId: user.id, cancelError })
        return NextResponse.json({ error: 'Falha ao cancelar o duelo.' }, { status: 500 })
      }
    }
  }

  // Return the updated duel state
  const { data: updatedDuel } = await supabase
    .from('arena_duels')
    .select(duelResponseSelect)
    .eq('id', id)
    .single()

  if (!updatedDuel) {
    return NextResponse.json({ error: 'Duelo não encontrado' }, { status: 404 })
  }

  return NextResponse.json(updatedDuel)
}
