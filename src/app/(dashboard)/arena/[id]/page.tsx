import { redirect } from 'next/navigation'
import { homeNoticeRedirect } from '@/lib/homeNotices'
import { createClient } from '@/lib/supabase/server'
import ArenaClient from '@/features/arena/components/ArenaClient'
import ArenaWaitingScreen from '@/features/arena/components/ArenaWaitingScreen'

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
    redirect(homeNoticeRedirect('duel_not_found'))
  }

  if (duel.player1_id !== user.id && duel.player2_id !== user.id) {
    redirect(homeNoticeRedirect('duel_unavailable'))
  }

  if (duel.status === 'cancelled') {
    redirect('/arena')
  }

  // Server does NOT auto-activate the duel — activation requires both
  // players to be actively present (heartbeat). Client handles this.

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', [duel.player1_id, duel.player2_id])

  if (profilesError || !profiles || profiles.length !== 2) {
    console.error('Error fetching players:', profilesError)
    redirect(homeNoticeRedirect('duel_error'))
  }

  const p1 = profiles.find(p => p.id === duel.player1_id)
  const p2 = profiles.find(p => p.id === duel.player2_id)

  if (!p1 || !p2) {
    console.error('Error: players not found in profiles')
    redirect(homeNoticeRedirect('duel_error'))
  }

  // If current user is player1 and duel is pending and player2 hasn't joined, show waiting screen
  const isPlayer1 = duel.player1_id === user.id
  const isPlayer2Joined = !!duel.player2_joined_at
  
  if (isPlayer1 && duel.status === 'pending' && !isPlayer2Joined) {
    return <ArenaWaitingScreen duelId={duel.id} opponentName={p2.username} />
  }

  const { data: cards, error: cardsError } = await supabase
    .from('cards')
    .select('*')
    .eq('pack_id', duel.pack_id)
    .order('created_at', { ascending: true })

  if (cardsError || !cards || cards.length === 0) {
    console.error('Error fetching cards:', cardsError)
    redirect(homeNoticeRedirect('duel_error'))
  }

  return (
    <ArenaClient
      duelId={duel.id}
      userId={user.id}
      player1={p1}
      player2={p2}
      initialStatus={duel.status}
      winnerId={duel.winner_id}
      packName={(duel.packs as { name: string })?.name || 'Pacote da Arena'}
      cards={cards}
      player1JoinedAt={duel.player1_joined_at}
      player2JoinedAt={duel.player2_joined_at}
      initialStartedAt={duel.started_at}
      gameType={duel.game_type}
      player1Events={duel.player1_events}
      player2Events={duel.player2_events}
      initialPlayer1Score={duel.player1_score}
      initialPlayer2Score={duel.player2_score}
      initialPlayer1Wrong={duel.player1_wrong}
      initialPlayer2Wrong={duel.player2_wrong}
    />
  )
}
