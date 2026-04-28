import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { followUser, unfollowUser } from '@/app/actions'

export const dynamic = 'force-dynamic'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch all profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')

  // Fetch all-time leaderboard for stats
  const { data: leaderboard } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: '2000-01-01T00:00:00Z'
  })

  // Fetch friendships (follows) for current user
  const { data: follows } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', user.id)

  const followedIds = new Set(follows?.map(f => f.addressee_id) || [])

  const mergedProfiles = (profiles || []).map(p => {
    const stats = leaderboard?.find((l: any) => l.user_id === p.id)
    return {
      ...p,
      score: stats?.score || 0,
      accuracy: stats?.accuracy || 0,
      sessions: stats?.sessions || 0,
      isFollowing: followedIds.has(p.id)
    }
  }).sort((a, b) => b.score - a.score)

  return (
    <div className="mx-auto max-w-[var(--page-width)] px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Comunidade</h1>
        <p className="text-[var(--color-text-muted)]">Descubra novos membros e acompanhe a evolução de todos.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mergedProfiles.map((profile) => (
          <div key={profile.id} className="flex flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-primary)]/30 group">
            
            <Link href={`/profile/${profile.username}`} className="p-6 flex flex-col items-center flex-1">
              <div className="relative h-24 w-24 mb-4 overflow-hidden rounded-full border-4 border-[var(--color-surface-container)] bg-[var(--color-surface-container-low)] transition-transform group-hover:scale-105">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-[var(--color-primary)]">
                    {profile.username[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                @{profile.username}
              </h3>
              {profile.bio ? (
                <p className="mt-2 text-sm text-[var(--color-text-muted)] text-center line-clamp-2">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]/50 text-center italic">
                  Sem bio
                </p>
              )}

              <div className="mt-auto pt-6 flex gap-6 text-sm w-full justify-center">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-[var(--color-primary)] text-lg leading-none">{profile.sessions}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Sessões</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-[var(--color-primary)] text-lg leading-none">{profile.accuracy}%</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Precisão</span>
                </div>
              </div>
            </Link>

            {profile.id !== user.id && (
              <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-surface-container-lowest)]">
                {profile.isFollowing ? (
                  <form action={async () => {
                    'use server'
                    await unfollowUser(profile.id)
                  }}>
                    <button type="submit" className="w-full rounded-full border border-[var(--color-border)] py-2 text-sm font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)] transition-colors cursor-pointer">
                      Deixar de Seguir
                    </button>
                  </form>
                ) : (
                  <form action={async () => {
                    'use server'
                    await followUser(profile.id)
                  }}>
                    <button type="submit" className="w-full rounded-full bg-[var(--color-primary)] py-2 text-sm font-semibold text-[var(--color-on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                      Seguir
                    </button>
                  </form>
                )}
              </div>
            )}
            
            {profile.id === user.id && (
              <div className="border-t border-[var(--color-border)] p-4 bg-[var(--color-surface-container-lowest)]">
                <div className="w-full rounded-full border border-dashed border-[var(--color-primary)]/50 py-2 text-sm font-semibold text-[var(--color-primary)] text-center">
                  Você
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
