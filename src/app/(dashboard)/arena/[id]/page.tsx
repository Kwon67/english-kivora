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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the duel
  const { data: duel, error: duelError } = await supabase
    .from('arena_duels')
    .select('*, packs(name), player1_joined_at, player2_joined_at, game_type')
    .eq('id', id)
    .single()

  // Mark current player as joined on page visit
  const isPlayer1 = duel?.player1_id === user.id
  const joinField = isPlayer1 ? 'player1_joined_at' : 'player2_joined_at'
  await supabase
    .from('arena_duels')
    .update({ [joinField]: new Date().toISOString() })
    .eq('id', id)

  if (duelError || !duel) {
    console.error('Error fetching duel:', duelError)
    redirect('/home')
  }

  // Validate user is player 1 or 2
  if (duel.player1_id !== user.id && duel.player2_id !== user.id) {
    redirect('/home')
  }

  // Fetch profiles for both players
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', [duel.player1_id, duel.player2_id])

  if (profilesError || !profiles || profiles.length !== 2) {
    console.error('Error fetching players:', profilesError)
    redirect('/home')
  }

  const p1 = profiles.find(p => p.id === duel.player1_id)
  const p2 = profiles.find(p => p.id === duel.player2_id)

  if (!p1 || !p2) {
    console.error('Error: players not found in profiles')
    redirect('/home')
  }

  // Fetch cards for the pack
  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', duel.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError || !cards || cards.length === 0) {
    console.error('Error fetching cards:', cardsError)
    redirect('/home')
  }

  return (
    <ArenaClient
      duelId={duel.id}
      userId={user.id}
      player1={p1}
      player2={p2}
      initialStatus={duel.status}
      winnerId={duel.winner_id}
      packName={(duel.packs as { name: string })?.name || 'Arena Pack'}
      cards={cards}
      player1JoinedAt={duel.player1_joined_at}
      player2JoinedAt={duel.player2_joined_at}
      gameType={duel.game_type}
    />
  )
}
