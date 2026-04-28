import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { followUser, unfollowUser } from '@/app/actions'
import { ShieldCheck, Target, Trophy, Info, CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ username: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Profile Header Card */}
      <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md">
        {profile.cover_url ? (
          <div className="h-32 sm:h-48 w-full relative">
            <Image src={profile.cover_url} alt="Capa" fill className="object-cover" />
          </div>
        ) : (
          <div className="h-32 sm:h-48 w-full bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-primary)]/40 relative" />
        )}
        
        <div className="px-6 pb-6 sm:px-10 sm:pb-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20 gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-full border-4 border-[var(--color-surface)] bg-[var(--color-surface-container)] shadow-lg z-10 flex-shrink-0">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-[var(--color-primary)]">
                    {profile.username[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col pb-2">
                <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
                  {profile.username}
                </h1>
                {profile.bio && (
                  <p className="mt-1.5 text-base text-[var(--color-text)] leading-snug">
                    {profile.bio}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>Membro desde {new Date(profile.created_at).getFullYear()}</span>
                  </div>
                  <div className="flex gap-3 font-medium">
                    <span><strong className="text-[var(--color-text)]">{followersCount || 0}</strong> Seguidores</span>
                    <span><strong className="text-[var(--color-text)]">{followingCount || 0}</strong> Seguindo</span>
                  </div>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <div className="pb-2 flex-shrink-0">
                {isFollowing ? (
                  <form action={async () => {
                    'use server'
                    await unfollowUser(profile.id)
                  }}>
                    <button type="submit" className="w-full sm:w-auto rounded-full border border-[var(--color-border)] px-8 py-2.5 font-semibold text-[var(--color-text-muted)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-text)] transition-colors cursor-pointer shadow-sm">
                      Deixar de Seguir
                    </button>
                  </form>
                ) : (
                  <form action={async () => {
                    'use server'
                    await followUser(profile.id)
                  }}>
                    <button type="submit" className="w-full sm:w-auto rounded-full bg-[var(--color-primary)] px-8 py-2.5 font-semibold text-[var(--color-on-primary)] hover:opacity-90 transition-opacity cursor-pointer shadow-sm">
                      Seguir
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {profile.description && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-[var(--color-text)] mb-2">Sobre</h2>
              <p className="text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap">
                {profile.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats */}
        <div className="space-y-8">
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Target className="h-5 w-5 text-[var(--color-primary)]" />
              Estatísticas
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] p-4">
                <span className="text-3xl font-bold text-[var(--color-primary)]">{stats.score}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Score Total</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] p-4">
                <span className="text-3xl font-bold text-[var(--color-primary)]">{stats.sessions}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Sessões</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] p-4">
                <span className="text-3xl font-bold text-[var(--color-primary)]">{stats.accuracy}%</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Precisão Média</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface-container-lowest)] border border-[var(--color-border)] p-4">
                <span className="text-3xl font-bold text-[var(--color-primary)]">{stats.best_streak}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] mt-1">Maior Ofensiva</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Badges */}
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Trophy className="h-5 w-5 text-[var(--color-primary)]" />
              Conquistas e Badges
            </h2>
            
            {typedBadges && typedBadges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {typedBadges.map((ub, idx) => {
                  const badge = ub.badge
                  return (
                    <div key={idx} title={badge.description} className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4 text-center transition-colors hover:border-[var(--color-primary)]/30">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-inner">
                        <ShieldCheck className="h-8 w-8" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-[var(--color-text)]">{badge.name}</span>
                        <span className="block text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{badge.description}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--color-text-muted)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-container)] mb-4">
                  <Info className="h-8 w-8 opacity-50" />
                </div>
                <p>Nenhuma conquista desbloqueada ainda.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
