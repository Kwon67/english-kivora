import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import DashboardShell from '@/components/layout/DashboardShell'
import SocialFeed from '@/features/social/components/SocialFeed'
import SocialFollowButton from '@/features/social/components/SocialFollowButton'
import { glassTile, softKicker } from '@/lib/dashboardUi'

export const dynamic = 'force-dynamic'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio')

  const { data: leaderboard } = await supabase.rpc('get_weekly_leaderboard', {
    window_start: '2000-01-01T00:00:00Z'
  })

  const { data: follows } = await supabase
    .from('friendships')
    .select('addressee_id')
    .eq('requester_id', user.id)

  const followedIds = new Set(follows?.map(f => f.addressee_id) || [])

  const followedIdsArray = Array.from(followedIds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let feedItems: any[] = []
  if (followedIdsArray.length > 0) {
    const { data: recentSessions } = await supabase
      .from('game_sessions')
      .select('id, completed_at, correct_answers, max_streak, user_id, assignments(packs(name))')
      .in('user_id', followedIdsArray)
      .order('completed_at', { ascending: false })
      .limit(10)

    if (recentSessions) {
      feedItems = recentSessions.map(session => {
        const p = profiles?.find(prof => prof.id === session.user_id)
        // @ts-expect-error DTO mapping
        const packName = session.assignments?.packs?.name || 'Sessão'
        return {
          id: session.id,
          completed_at: session.completed_at,
          correct_answers: session.correct_answers,
          max_streak: session.max_streak,
          pack_name: packName,
          user: p ? { id: p.id, username: p.username, avatar_url: p.avatar_url } : { id: session.user_id, username: 'Usuário', avatar_url: null }
        }
      })
    }
  }

  const mergedProfiles = (profiles || []).map(p => {
    const stats = leaderboard?.find((l: { user_id: string, score: number, accuracy: number, sessions: number }) => l.user_id === p.id)
    return {
      ...p,
      score: stats?.score || 0,
      accuracy: stats?.accuracy || 0,
      sessions: stats?.sessions || 0,
      isFollowing: followedIds.has(p.id)
    }
  }).sort((a, b) => b.score - a.score)

  return (
    <DashboardShell maxWidthClass="max-w-[var(--page-width)]">
      <div className="space-y-12 pb-8 animate-fade-in">
        <section>
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={softKicker}>Comunidade</p>
              <h1 className="mt-3 font-montserrat text-3xl font-bold tracking-tight text-text">Feed de Atividades</h1>
              <p className="mt-2 text-text-muted">O que seus amigos estão estudando.</p>
            </div>
          </header>
          <SocialFeed items={feedItems} />
        </section>

        <section>
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={softKicker}>Membros</p>
              <h2 className="mt-3 font-montserrat text-2xl font-bold tracking-tight text-text">Comunidade</h2>
              <p className="mt-2 text-text-muted">Descubra novos membros e acompanhe a evolução de todos.</p>
            </div>
          </header>

          <div className="scroll-reveal-stagger grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {mergedProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`${glassTile} flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:border-primary/30 dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] group`}
              >
                <Link href={`/profile/${profile.username}`} className="flex flex-1 flex-col items-center p-6">
                  <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-[var(--color-surface-container)] bg-[var(--color-surface-container-low)] transition-transform group-hover:scale-105">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-primary">
                        {profile.username[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text transition-colors group-hover:text-primary">
                    @{profile.username}
                  </h3>
                  {profile.bio ? (
                    <p className="mt-2 line-clamp-2 text-center text-sm text-text-muted">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="mt-2 text-center text-sm italic text-text-muted/50">
                      Sem bio
                    </p>
                  )}

                  <div className="mt-auto flex w-full justify-center gap-6 pt-6 text-sm">
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold leading-none text-primary">{profile.sessions}</span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">Sessões</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-bold leading-none text-primary">{profile.accuracy}%</span>
                      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-text-muted">Precisão</span>
                    </div>
                  </div>
                </Link>

                {profile.id !== user.id && (
                  <div className="border-t border-dashed border-border-muted/20 bg-surface-container-lowest p-4 dark:border-border-accent/20">
                    <SocialFollowButton userId={profile.id} isFollowing={profile.isFollowing} />
                  </div>
                )}

                {profile.id === user.id && (
                  <div className="border-t border-dashed border-border-muted/20 bg-surface-container-lowest p-4 dark:border-border-accent/20">
                    <div className="w-full rounded-full border border-dashed border-primary/50 py-2 text-center text-sm font-semibold text-primary">
                      Você
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}