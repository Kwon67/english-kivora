import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PublicProfileClient from '@/features/profile/components/PublicProfileClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  const cleanUsername = decodedUsername.startsWith('@') ? decodedUsername.slice(1) : decodedUsername

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the profile (try lowercase first, fallback to exact match)
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername.toLowerCase())
    .maybeSingle()

  if (!profile) {
    const { data: fallbackProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', cleanUsername)
      .maybeSingle()
    profile = fallbackProfile
  }

  if (!profile) return notFound()

  const isOwnProfile = profile.id === user.id

  // Follow check
  let isFollowing = false
  if (!isOwnProfile) {
    const { data: followRecord } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', user.id)
      .eq('addressee_id', profile.id)
      .maybeSingle()
    
    isFollowing = !!followRecord
  }

  // Get total followers and following
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('addressee_id', profile.id),
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('requester_id', profile.id)
  ])

  // Stats
  const { data: leaderboard } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: '2000-01-01T00:00:00Z'
  })
  const stats = leaderboard?.find((l: { user_id: string }) => l.user_id === profile.id) || { score: 0, accuracy: 0, sessions: 0, best_streak: 0 }

  // Badges
  const { data: userBadges } = await supabase
    .from('user_badges')
    .select('unlocked_at, badge:badge_id (name, description, icon_name)')
    .eq('user_id', profile.id)
    .order('unlocked_at', { ascending: false })

  const typedBadges = userBadges as unknown as { unlocked_at: string, badge: { name: string, description: string, icon_name: string } }[]

  // Fluency Radar Data
  const { data: sessionData } = await supabase
    .from('game_sessions')
    .select(`
      correct_answers, 
      wrong_answers, 
      assignments (
        pack_id, 
        packs (
          category
        )
      )
    `)
    .eq('user_id', profile.id)

  const radarMap: Record<string, { correct: number, total: number }> = {}
  
  if (sessionData) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (sessionData as any[]).forEach((session) => {
      const category = (session.assignments as any)?.packs?.category || 'Geral'
      if (!radarMap[category]) radarMap[category] = { correct: 0, total: 0 }
      radarMap[category].correct += (session as any).correct_answers || 0
      radarMap[category].total += ((session as any).correct_answers || 0) + ((session as any).wrong_answers || 0)
    })
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }

  const radarData = Object.entries(radarMap).map(([category, stats]) => ({
    category,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  })).sort((a, b) => b.accuracy - a.accuracy).slice(0, 6)

  return (
    <PublicProfileClient
      profile={profile}
      isOwnProfile={isOwnProfile}
      initialIsFollowing={isFollowing}
      followersCount={followersCount || 0}
      followingCount={followingCount || 0}
      stats={stats}
      badges={typedBadges || []}
      radarData={radarData}
    />
  )
}
