import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ArenaClient from './ArenaClient'

export default async function ArenaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const duelSelect =
    '*, packs(name), player1_joined_at, player2_joined_at, game_type'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: duel, error: duelError } = await supabase
    .from('arena_duels')
    .select(duelSelect)
    .eq('id', id)
    .single()

  if (duelError || !duel) {
    console.error('Error fetching duel:', duelError)
    redirect('/home')
  }

  if (duel.player1_id !== user.id && duel.player2_id !== user.id) {
    redirect('/home')
  }

  if (duel.status === 'cancelled') {
    redirect('/arena')
  }

  const isPlayer1 = duel.player1_id === user.id
  const joinField = isPlayer1 ? 'player1_joined_at' : 'player2_joined_at'
  const alreadyJoined = isPlayer1 ? duel.player1_joined_at : duel.player2_joined_at

  if (!alreadyJoined && (duel.status === 'pending' || duel.status === 'active')) {
    const { error: joinError } = await supabase
      .from('arena_duels')
      .update({ [joinField]: new Date().toISOString() })
      .eq('id', id)

    if (joinError) {
      console.error('Error marking duel join:', joinError)
    }
  }

  let resolvedDuel = duel

  const { data: joinedDuel, error: joinedDuelError } = await supabase
    .from('arena_duels')
    .select(duelSelect)
    .eq('id', id)
    .single()

  if (joinedDuelError) {
    console.error('Error refreshing duel after join:', joinedDuelError)
  } else if (joinedDuel) {
    resolvedDuel = joinedDuel
  }

  if (
    resolvedDuel.status === 'pending' &&
    resolvedDuel.player1_joined_at &&
    resolvedDuel.player2_joined_at
  ) {
    const { error: activateError } = await supabase
      .from('arena_duels')
      .update({
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending')

    if (activateError) {
      console.error('Error activating duel after both joined:', activateError)
    }

    const { data: activeDuel, error: activeDuelError } = await supabase
      .from('arena_duels')
      .select(duelSelect)
      .eq('id', id)
      .single()

    if (activeDuelError) {
      console.error('Error refreshing active duel:', activeDuelError)
    } else if (activeDuel) {
      resolvedDuel = activeDuel
    }
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', [resolvedDuel.player1_id, resolvedDuel.player2_id])

  if (profilesError || !profiles || profiles.length !== 2) {
    console.error('Error fetching players:', profilesError)
    redirect('/home')
  }

  const p1 = profiles.find(p => p.id === resolvedDuel.player1_id)
  const p2 = profiles.find(p => p.id === resolvedDuel.player2_id)

  if (!p1 || !p2) {
    console.error('Error: players not found in profiles')
    redirect('/home')
  }

  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', resolvedDuel.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError || !cards || cards.length === 0) {
    console.error('Error fetching cards:', cardsError)
    redirect('/home')
  }

  return (
    <ArenaClient
      duelId={resolvedDuel.id}
      userId={user.id}
      player1={p1}
      player2={p2}
      initialStatus={resolvedDuel.status}
      winnerId={resolvedDuel.winner_id}
      packName={(resolvedDuel.packs as { name: string })?.name || 'Arena Pack'}
      cards={cards}
      player1JoinedAt={resolvedDuel.player1_joined_at}
      player2JoinedAt={resolvedDuel.player2_joined_at}
      gameType={resolvedDuel.game_type}
    />
  )
}
